<?php
/**
 * Child theme functions
 */

add_action( 'wp_enqueue_scripts', 'blocksy_child_enqueue_styles' );
function blocksy_child_enqueue_styles() {
	wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' );
}

// --- Antigravity Agent Connector Extensions ---

// Add CORS headers for REST API
add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $origin = get_http_origin();
        $allowed_origins = [
            'http://localhost:8080',
            'http://localhost:3000',
            'https://dispet.fun',
            'https://www.dispet.fun'
        ];
        
        if (in_array($origin, $allowed_origins) || !$origin) {
            header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
        }
        
        return $value;
    });
}, 15);

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

    // --- Shop Config API ---
    register_rest_route('antigravity/v1', '/shop-config', array(
        'methods'  => 'GET',
        'callback' => 'ag_get_shop_config',
        'permission_callback' => '__return_true' // Public read
    ));

    register_rest_route('antigravity/v1', '/shop-config', array(
        'methods'  => 'POST',
        'callback' => 'ag_save_shop_config',
        'permission_callback' => function () { return current_user_can('manage_options'); } // Admin only write
    ));

    // --- Media Library API (Designs) ---
    register_rest_route('antigravity/v1', '/designs', array(
        'methods'  => 'GET',
        'callback' => 'ag_get_design_images',
        'permission_callback' => '__return_true' // Public read
    ));

    // --- Public Products API (No Auth Required) ---
    register_rest_route('antigravity/v1', '/products', array(
        'methods'  => 'GET',
        'callback' => 'ag_get_public_products',
        'permission_callback' => '__return_true' // Public read
    ));
});

// Public products endpoint - returns basic product info without auth
function ag_get_public_products() {
    if (!function_exists('wc_get_products')) {
        return new WP_Error('no_wc', 'WooCommerce not active', ['status' => 500]);
    }

    $products = wc_get_products([
        'status' => 'publish',
        'limit' => 100,
    ]);

    $result = [];
    foreach ($products as $product) {
        $product_data = [
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'slug' => $product->get_slug(),
            'price' => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'stock_status' => $product->get_stock_status(),
            'stock_quantity' => $product->get_stock_quantity(),
            'average_rating' => $product->get_average_rating(),
            'rating_count' => $product->get_rating_count(),
            'type' => $product->get_type(),
        ];

        if ($product->is_type('variable')) {
            $product_data['variations'] = $product->get_available_variations();
        }

        $result[] = $product_data;
    }

    return rest_ensure_response($result);
}

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
                // Simplified: Add product directly (fallback to Parent ID if no variation_id)
                $item_id = $order->add_product($product, $qty, [
                    'variation' => isset($item['variation_id']) ? $item['variation_id'] : []
                ]);
                
                // Save Meta Data (Size, Color, Design)
                if ($item_id && !empty($item['meta_data'])) {
                    $order_item = $order->get_item($item_id);
                    if ($order_item) {
                        foreach ($item['meta_data'] as $meta) {
                             $order_item->add_meta_data($meta['key'], $meta['value']);
                        }
                        $order_item->save();
                    }
                }
            }
        }

        $order->set_address($order_data['billing'], 'billing');
        $order->set_address($order_data['shipping'], 'shipping');

        // Add Shipping Lines
        if (!empty($order_data['shipping_lines'])) {
            foreach ($order_data['shipping_lines'] as $shipping_line) {
                $shipping = new WC_Order_Item_Shipping();
                $shipping->set_method_title($shipping_line['method_title']);
                $shipping->set_method_id($shipping_line['method_id']);
                $shipping->set_total($shipping_line['total']);
                $order->add_item($shipping);
            }
        }
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

// --- Shop Config Callbacks ---

/**
 * Get shop configuration from wp_options
 */
function ag_get_shop_config() {
    $default_config = ag_get_default_shop_config();
    $saved_config = get_option('ag_shop_config', []);
    
    // Smart Merge: We want defaults for missing keys, but SAVED lists should overwrite default lists completely (no index merging)
    $config = $default_config;

    if (!empty($saved_config)) {
        foreach ($saved_config as $key => $value) {
            // Top Level: tshirt, hoodie, etc.
            if (isset($config[$key]) && is_array($config[$key]) && is_array($value)) {
                if (in_array($key, ['tshirt', 'hoodie', 'cap', 'bottle'])) {
                    // Product Config: Merge keys, but replace arrays
                    foreach ($value as $subKey => $subVal) {
                        $config[$key][$subKey] = $subVal;
                    }
                } elseif ($key === 'design_color_map') {
                    // Design Map: Merge keys (designs), replace color lists
                    foreach ($value as $dKey => $dVal) {
                        $config[$key][$dKey] = $dVal;
                    }
                } else {
                    // Others (alternatives): Replace entirely
                    $config[$key] = $value;
                }
            } else {
                // Scalar or new top-level key: Replace
                $config[$key] = $value;
            }
        }
    }
    
    return rest_ensure_response($config);
}

/**
 * Save shop configuration to wp_options
 */
function ag_save_shop_config($request) {
    $data = $request->get_json_params();
    
    if (empty($data)) {
        return new WP_Error('invalid_data', 'No configuration data provided', ['status' => 400]);
    }
    
    // Sanitize and validate (basic)
    $sanitized = [];
    foreach ($data as $product_key => $product_config) {
        if (!in_array($product_key, ['tshirt', 'hoodie', 'cap', 'bottle', 'alternatives', 'design_color_map'])) {
            continue;
        }
        $sanitized[$product_key] = $product_config;
    }
    
    update_option('ag_shop_config', $sanitized);
    
    return rest_ensure_response(['success' => true, 'message' => 'Configuration saved']);
}

/**
 * Get default shop configuration (fallback)
 */
function ag_get_default_shop_config() {
    $all_colors = ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'];
    
    return [
        'tshirt' => [
            'allowed_colors' => $all_colors,
            'default_zone' => 'back',
            'locked_zone' => 'front', // Front is locked to color-coded logo
            'restricted_designs' => [],
            'has_front_back' => true,
            'cycle_enabled' => true,
            'cycle_duration' => 6000
        ],
        'hoodie' => [
            'allowed_colors' => $all_colors,
            'default_zone' => 'back',
            'locked_zone' => 'front',
            'restricted_designs' => [],
            'has_front_back' => true,
            'cycle_enabled' => true,
            'cycle_duration' => 6000
        ],
        'cap' => [
            'allowed_colors' => ['#231f20'], // Black only
            'default_zone' => 'front',
            'locked_zone' => null,
            'restricted_designs' => ['street-5.png'],
            'has_front_back' => false,
            'cycle_enabled' => true,
            'cycle_duration' => 6000
        ],
        'bottle' => [
            'allowed_colors' => ['#231f20', '#ffffff'], // Black & White
            'default_zone' => 'front',
            'locked_zone' => null,
            'restricted_designs' => [],
            'has_front_back' => false,
            'cycle_enabled' => true,
            'cycle_duration' => 6000
        ],
        'alternatives' => [
            [
                'design_id' => 'street-3.png',
                'trigger_colors' => ['#e78fab', '#a1d7c0', '#00aeef'],
                'replace_with' => 'street-3-alt.png'
            ]
        ],
        'design_color_map' => [
            'street-1.png' => $all_colors,
            'street-3.png' => ['#231f20', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#e78fab', '#a1d7c0'],
            'street-5.png' => ['#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
            'street-6.png' => $all_colors,
            'street-7.png' => ['#231f20', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#a1d7c0'],
            'street-10.png' => ['#231f20', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#e78fab', '#a1d7c0'],
            'vintage-1.png' => ['#231f20', '#d1d5db', '#00ab98', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
            'vintage-2.png' => ['#231f20', '#d1d5db', '#00ab98', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
            'vintage-3.png' => ['#231f20'],
            'vintage-4.png' => $all_colors,
            'vintage-5.png' => ['#231f20', '#d1d5db', '#00ab98', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
            'logo-1.png' => $all_colors,
            'logo-3.png' => ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#ffffff', '#e78fab', '#a1d7c0'],
            'logo-5.png' => $all_colors,
            'logo-7.png' => $all_colors,
            'logo-9.png' => $all_colors,
            'logo-12.png' => ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#ffffff', '#e78fab', '#a1d7c0']
        ]
    ];
}

/**
 * Get design images from WordPress Media Library
 * Looks for images with 'design' in the title or a specific category/tag
 */
function ag_get_design_images($request) {
    $category = $request->get_param('category'); // Optional filter
    
    $args = [
        'post_type' => 'attachment',
        'post_mime_type' => 'image',
        'posts_per_page' => 100,
        'post_status' => 'inherit',
        's' => 'design' // Search for 'design' in title
    ];
    
    $query = new WP_Query($args);
    $designs = [];
    
    foreach ($query->posts as $attachment) {
        $url = wp_get_attachment_url($attachment->ID);
        $filename = basename($url);
        
        // Try to determine category from filename (street-, vintage-, logo-)
        $cat = 'other';
        if (strpos($filename, 'street') !== false) $cat = 'street';
        elseif (strpos($filename, 'vintage') !== false) $cat = 'vintage';
        elseif (strpos($filename, 'logo') !== false) $cat = 'logo';
        
        // Filter by category if requested
        if ($category && $cat !== $category) continue;
        
        $designs[] = [
            'id' => $attachment->ID,
            'url' => $url,
            'filename' => $filename,
            'title' => $attachment->post_title,
            'category' => $cat
        ];
    }
    
    return rest_ensure_response($designs);
}
