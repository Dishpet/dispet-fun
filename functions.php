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

        // 4. Process Payment via Stripe Plugin
        if (class_exists('WC_Gateway_Stripe')) {
            $gateway = new WC_Gateway_Stripe();
            
            // --- FIX START: FORCE ENVIRONMENT FOR HEADLESS STRIPE ---

            // A. Initialize WC Customer Global if missing (Plugin often looks here)
            if (function_exists('WC')) {
                 if (empty(WC()->customer)) {
                     // Create a session-based customer or load existing
                     WC()->customer = new WC_Customer($order->get_customer_id() > 0 ? $order->get_customer_id() : 0);
                 }
                 // Explicitly set the billing address on the global customer to match this order
                 WC()->customer->set_props([
                     'billing_first_name' => $order_data['billing']['first_name'],
                     'billing_last_name'  => $order_data['billing']['last_name'],
                     'billing_address_1'  => $order_data['billing']['address_1'],
                     'billing_city'       => $order_data['billing']['city'],
                     'billing_postcode'   => $order_data['billing']['postcode'],
                     'billing_country'    => $order_data['billing']['country'],
                     'billing_email'      => $order_data['billing']['email'],
                     'billing_phone'      => $order_data['billing']['phone'],
                 ]);
                 WC()->customer->save(); // Save to session/DB needed? mostly session.
            }

            // B. Initialize POST with EVERY possible field Stripe might check
            $_POST['stripe_token'] = $token;
            $_POST['payment_method'] = 'stripe';
            
            $billing = $order_data['billing'];
            $map = [
                'billing_first_name' => $billing['first_name'],
                'billing_last_name'  => $billing['last_name'],
                'billing_address_1'  => $billing['address_1'],
                'billing_city'       => $billing['city'],
                'billing_postcode'   => $billing['postcode'],
                'billing_country'    => $billing['country'],
                'billing_email'      => $billing['email'],
                'billing_phone'      => $billing['phone'],
                // Some plugins look for 'stripe_billing_...' or just non-prefixed
                'stripe_billing_address_1' => $billing['address_1'],
                'stripe_billing_zip' => $billing['postcode'],
                'stripe_billing_city' => $billing['city'],
            ];
            
            foreach ($map as $k => $v) {
                $_POST[$k] = $v;
            }

            // C. Update Real User Meta (Last Resort persistence)
            if ($order->get_customer_id() > 0) {
                foreach ($map as $key => $value) {
                    // Only update standard billing fields
                    if (strpos($key, 'billing_') === 0) {
                        update_user_meta($order->get_customer_id(), $key, $value);
                    }
                }
            }

            // --- FIX END ---
            
            $result = $gateway->process_payment($order->get_id());

            // Return the FULL result (including redirect URL if 3DSecure is needed)
            if (isset($result['result']) && $result['result'] === 'success') {
                return [
                    'success' => true,
                    'order_id' => $order->get_id(),
                    'redirect' => $result['redirect'] ?? null,
                    'result_payload' => $result
                ];
            } else {
                // Failed payment - Return proper error message from Gateway
                $order->update_status('failed', 'Headless Payment Failed');
                
                // Extract specific error message if available
                $errorMessage = isset($result['messages']) ? $result['messages'] : 'Payment processing failed. Please try again.';
                // Sometimes it is in a different format depending on plugin version
                if (method_exists($gateway, 'get_validation_errors')) {
                    $validation_errors = $gateway->get_validation_errors();
                    if (!empty($validation_errors)) {
                         $errorMessage = is_array($validation_errors) ? implode(' ', $validation_errors) : $validation_errors;
                    }
                }
                
                // Try to find error in notices if messages is empty
                if (function_exists('wc_get_notices')) {
                     $notices = wc_get_notices('error');
                     if (!empty($notices)) {
                         $notice_messages = [];
                         foreach ($notices as $notice) {
                             if (is_array($notice)) {
                                 // Sometimes notices are ['notice' => 'Message', 'data' => ...]
                                 $notice_messages[] = isset($notice['notice']) ? strip_tags($notice['notice']) : '';
                             } else {
                                 $notice_messages[] = strip_tags($notice);
                             }
                         }
                         $errorMessage .= " " . implode(" ", array_filter($notice_messages));
                         wc_clear_notices();
                     }
                }

                return new WP_Error('payment_failed', $errorMessage, ['status' => 402, 'gateway_result' => $result]);
            }
        }
        
        return new WP_Error('no_stripe', 'Stripe plugin missing on WP', ['status' => 500]);
    } catch (Exception $e) {
        return new WP_Error('error', $e->getMessage(), ['status' => 500]);
    }
}
