<?php
/**
 * Child theme functions
 */

add_action( 'wp_enqueue_scripts', 'blocksy_child_enqueue_styles' );
function blocksy_child_enqueue_styles() {
	wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' );
}

// --- Antigravity Agent Connector Extensions ---

add_action('rest_api_init', function () {
    register_rest_route('antigravity/v1', '/get-theme-file', array(
        'methods'  => 'GET',
        'callback' => function($request) {
            $file = basename(sanitize_text_field($request['file']));
            $path = get_stylesheet_directory() . '/' . $file;
            if (!file_exists($path)) return new WP_Error('not_found', 'File not found', ['status' => 404]);
            return ['code' => file_get_contents($path)];
        },
        'permission_callback' => function () { return current_user_can('edit_theme_options'); }
    ));

    register_rest_route('antigravity/v1', '/checkout-payment', array(
        'methods'  => 'POST',
        'callback' => 'ag_headless_checkout_handler',
        'permission_callback' => '__return_true'
    ));
});

function ag_headless_checkout_handler($request) {
    if (function_exists('WC') && empty(WC()->session)) {
        if (class_exists('WC_Session_Handler')) {
            WC()->session = new WC_Session_Handler();
            WC()->session->init();
        }
    }

    $params = $request->get_json_params();
    $token = $params['stripe_token'];
    $order_data = $params['order_data'];

    if (empty($token)) return new WP_Error('missing_token', 'Stripe token missing', ['status' => 400]);
    if (!function_exists('wc_create_order')) return new WP_Error('no_wc', 'WooCommerce not active', ['status' => 500]);

    try {
        $order = wc_create_order();
        
        foreach ($order_data['line_items'] as $item) {
            $product_id = $item['product_id'];
            $qty = $item['quantity'];
            $product = wc_get_product($product_id);
            if ($product) {
                $order->add_product($product, $qty, [
                    'variation' => isset($item['variation_id']) ? $item['variation_id'] : []
                ]);
            }
        }

        $order->set_address($order_data['billing'], 'billing');
        $order->set_address($order_data['shipping'], 'shipping');
        if (!empty($order_data['customer_id'])) {
            $order->set_customer_id($order_data['customer_id']);
        }

        $order->set_payment_method('stripe');
        $order->set_payment_method_title('Stripe (Cards)');
        $order->calculate_totals();
        $order->save();

        // Direct Stripe API Call (No Library Dependency)
        // Securely retrieve the key from wp-config.php constant
        $secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';

        if (empty($secret_key)) {
            // Fallback: check if hardcoded (for safety during transition, though we want to avoid this on GitHub)
            // But for the user response, we output the clean version.
            return new WP_Error('stripe_error', 'Stripe Secret Key is missing in wp-config.php.', ['status' => 500]);
        }

        $amount = (int)(round((float)$order->get_total(), 2) * 100);
        $currency = strtolower($order->get_currency());
        $description = 'Order #' . $order->get_id() . ' - ' . $order_data['billing']['email'];

        // Build Body for Stripe API
        $body = [
            'amount' => $amount,
            'currency' => $currency,
            'source' => $token,
            'description' => $description,
            'metadata[order_id]' => $order->get_id(),
            'metadata[customer_name]' => $order_data['billing']['first_name'] . ' ' . $order_data['billing']['last_name'],
            'receipt_email' => $order_data['billing']['email']
        ];
        
        // Add Shipping params (flat structure for API)
        if (!empty($order_data['billing']['address_1'])) {
            $body['shipping[name]'] = $order_data['billing']['first_name'] . ' ' . $order_data['billing']['last_name'];
            $body['shipping[address][line1]'] = $order_data['billing']['address_1'];
            $body['shipping[address][city]'] = $order_data['billing']['city'];
            $body['shipping[address][postal_code]'] = $order_data['billing']['postcode'];
            $body['shipping[address][country]'] = $order_data['billing']['country'];
        }

        // Perform Raw HTTP Request
        $response = wp_remote_post('https://api.stripe.com/v1/charges', [
            'headers' => [
                'Authorization' => 'Bearer ' . $secret_key,
                'Content-Type'  => 'application/x-www-form-urlencoded'
            ],
            'body' => $body,
            'timeout' => 45 // Stripe can be slow
        ]);

        if (is_wp_error($response)) {
             $error_msg = $response->get_error_message();
             $order->update_status('failed', 'Stripe Connection Error: ' . $error_msg);
             return new WP_Error('payment_failed', 'Connection Error: ' . $error_msg, ['status' => 500]);
        }

        $response_body = wp_remote_retrieve_body($response);
        $data = json_decode($response_body, true);
        $response_code = wp_remote_retrieve_response_code($response);

        if ($response_code !== 200 || isset($data['error'])) {
            // Stripe Rejected It
            $error_msg = isset($data['error']['message']) ? $data['error']['message'] : 'Unknown Error';
            $order->update_status('failed', 'Stripe Error: ' . $error_msg);
            // Expected Success State for Empty Card: "Your card was declined." or "Insufficient funds"
            return new WP_Error('payment_failed', $error_msg, ['status' => 402]);
        }

        // Success
        $charge_id = $data['id'];
        $order->payment_complete($charge_id);
        $order->add_order_note('Stripe Charge Successful via Headless RAW API. Charge ID: ' . $charge_id);
        $order->update_meta_data('_stripe_charge_id', $charge_id);
        $order->save();
        
        return [
            'success' => true,
            'order_id' => $order->get_id(),
            'redirect' => $order->get_checkout_order_received_url(),
            'charge_id' => $charge_id
        ];

    } catch (Exception $e) {
        return new WP_Error('error', $e->getMessage(), ['status' => 500]);
    }
}
