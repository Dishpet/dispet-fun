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
            $file = sanitize_text_field($request['file']);
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
    // Initialize WC Session if not present (Required for wc_add_notice to work without crashing)
    if (function_exists('WC') && empty(WC()->session)) {
        // We need to look for a session class. Usually WC_Session_Handler
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
        // 1. Create Order
        $order = wc_create_order();
        
        // 2. Add Products
        foreach ($order_data['line_items'] as $item) {
            $product_id = $item['product_id'];
            $qty = $item['quantity'];
            $order->add_product(get_product($product_id), $qty, [
                'variation' => isset($item['variation_id']) ? $item['variation_id'] : []
            ]);
        }

        // 3. Set Addresses and Customer
        $order->set_address($order_data['billing'], 'billing');
        $order->set_address($order_data['shipping'], 'shipping');
        if (!empty($order_data['customer_id'])) {
            $order->set_customer_id($order_data['customer_id']);
        }

        $order->set_payment_method('stripe');
        $order->set_payment_method_title('Stripe (Cards)');
        $order->calculate_totals();
        $order->save();

        // 4. Custom Headless Stripe Processing (Direct SDK)
        // Bypasses plugin complexity to avoid 'Missing Customer Field' errors
        if (class_exists('WC_Gateway_Stripe')) {
            $stripe_settings = get_option('woocommerce_stripe_settings');
            
            if (!$stripe_settings) {
                 return new WP_Error('stripe_error', 'Stripe settings not found.', ['status' => 500]);
            }
            
            $test_mode = isset($stripe_settings['testmode']) && $stripe_settings['testmode'] === 'yes';
            $secret_key = $test_mode ? $stripe_settings['test_secret_key'] : $stripe_settings['secret_key'];
            
            if (empty($secret_key)) {
                return new WP_Error('stripe_error', 'Stripe Secret Key is missing in WooCommerce Settings.', ['status' => 500]);
            }

            // Ensure Stripe Library is loaded (Plugin usually loads it)
            if (class_exists('\Stripe\Stripe')) {
                \Stripe\Stripe::setApiKey($secret_key);
            } else {
                 return new WP_Error('stripe_error', 'Stripe PHP Library not loaded.', ['status' => 500]);
            }
            
            try {
                // Calculate amount in cents
                $amount = (int)(round((float)$order->get_total(), 2) * 100);
                $currency = strtolower($order->get_currency());
                
                // Description for Stripe Dashboard
                $description = 'Order #' . $order->get_id() . ' - ' . $order_data['billing']['email'];

                // Attempt Direct Charge
                $charge_args = [
                    'amount'      => $amount,
                    'currency'    => $currency,
                    'source'      => $token, // 'tok_...' from frontend
                    'description' => $description,
                    'metadata'    => [
                        'order_id' => $order->get_id(),
                        'customer_name' => $order_data['billing']['first_name'] . ' ' . $order_data['billing']['last_name']
                    ],
                    'receipt_email' => $order_data['billing']['email'],
                ];
                
                // Add Shipping Info for Fraud Protection logic (AVS)
                if (!empty($order_data['billing']['address_1'])) {
                    $charge_args['shipping'] = [
                        'name' => $order_data['billing']['first_name'] . ' ' . $order_data['billing']['last_name'],
                        'address' => [
                            'line1' => $order_data['billing']['address_1'],
                            'city' => $order_data['billing']['city'],
                            'postal_code' => $order_data['billing']['postcode'],
                            'country' => $order_data['billing']['country'], // Should be ISO 'HR' now
                        ]
                    ];
                }

                $charge = \Stripe\Charge::create($charge_args);
                
                // If we got here, payment is successful
                $order->payment_complete($charge->id);
                $order->add_order_note('Stripe Charge Successful via Headless API. Charge ID: ' . $charge->id);
                $order->update_meta_data('_stripe_charge_id', $charge->id);
                $order->save();
                
                return [
                    'success' => true,
                    'order_id' => $order->get_id(),
                    'redirect' => $order->get_checkout_order_received_url(),
                    'charge_id' => $charge->id
                ];

            } catch (\Exception $e) {
                // Return clear error to frontend
                $error_msg = $e->getMessage();
                $order->update_status('failed', 'Stripe Error: ' . $error_msg);
                return new WP_Error('payment_failed', $error_msg, ['status' => 402]);
            }
        }
        
        return new WP_Error('no_stripe', 'Stripe plugin missing on WP', ['status' => 500]);
    } catch (Exception $e) {
        return new WP_Error('error', $e->getMessage(), ['status' => 500]);
    }
}
