/**
 * WooCommerce Product Cleanup & Setup Script
 * Removes invalid variations and ensures all correct variations exist with correct prices.
 */

import axios from 'axios';

// Use the local proxy server
const API_BASE = 'http://localhost:3000/api';

// Product Configuration (Matches Shop.tsx)
const PRODUCTS_CONFIG = {
    'hoodie': {
        name: 'Dišpet Hoodie',
        price: '50',
        sizes: ['6-8 g.', '8-10 g.', '10-12 g.', 'S', 'M', 'L', 'XL'],
        colors: [
            { name: 'Crna', hex: '#231f20' },
            { name: 'Siva', hex: '#d1d5db' },
            { name: 'Tirkizna', hex: '#00ab98' },
            { name: 'Cijan', hex: '#00aeef' },
            { name: 'Plava', hex: '#387bbf' },
            { name: 'Ljubičasta', hex: '#8358a4' },
            { name: 'Bijela', hex: '#ffffff' },
            { name: 'Roza', hex: '#e78fab' },
            { name: 'Mint', hex: '#a1d7c0' }
        ]
    },
    'tshirt': {
        name: 'Dišpet T-shirt',
        price: '30',
        sizes: ['6-8 g.', '8-10 g.', '10-12 g.', 'S', 'M', 'L', 'XL'],
        colors: [
            { name: 'Crna', hex: '#231f20' },
            { name: 'Siva', hex: '#d1d5db' },
            { name: 'Tirkizna', hex: '#00ab98' },
            { name: 'Cijan', hex: '#00aeef' },
            { name: 'Plava', hex: '#387bbf' },
            { name: 'Ljubičasta', hex: '#8358a4' },
            { name: 'Bijela', hex: '#ffffff' },
            { name: 'Roza', hex: '#e78fab' },
            { name: 'Mint', hex: '#a1d7c0' }
        ]
    },
    'cap': {
        name: 'Dišpet Cap',
        price: '20',
        sizes: ['Univerzalna'],
        colors: [
            { name: 'Crna', hex: '#231f20' },
            { name: 'Siva', hex: '#d1d5db' },
            { name: 'Tirkizna', hex: '#00ab98' },
            { name: 'Cijan', hex: '#00aeef' },
            { name: 'Plava', hex: '#387bbf' },
            { name: 'Ljubičasta', hex: '#8358a4' },
            { name: 'Bijela', hex: '#ffffff' },
            { name: 'Roza', hex: '#e78fab' },
            { name: 'Mint', hex: '#a1d7c0' }
        ]
    },
    'bottle': {
        name: 'Dišpet Termosica',
        price: '20',
        sizes: ['500ml'],
        colors: [
            { name: 'Crna', hex: '#231f20' },
            { name: 'Bijela', hex: '#ffffff' }
        ]
    }
};

// Helper function for API calls through local proxy
async function wcApi(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE}/wc/v3${endpoint}`;
    const config = { method, url, data };
    if (method !== 'GET' && data) {
        config.headers = { 'Content-Type': 'application/json' };
    }
    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
        throw error;
    }
}

async function findProduct(searchTerms) {
    const products = await wcApi('/products?per_page=100');
    for (const term of searchTerms) {
        const found = products.find(p => p.name.toLowerCase().includes(term.toLowerCase()));
        if (found) return found;
    }
    return null;
}

async function cleanupAndSetupProduct(key, config) {
    console.log(`\n🛍️  Processing product: ${config.name}`);
    const searchTerms = {
        'hoodie': ['hoodie', 'duksica', 'hudi'],
        'tshirt': ['shirt', 'majica', 't-shirt'],
        'cap': ['cap', 'kapa', 'šilterica'],
        'bottle': ['bottle', 'boca', 'termosica', 'termos']
    };

    let product = await findProduct(searchTerms[key] || [config.name]);
    if (!product) {
        console.log(`  ❌ Product not found, skipping.`);
        return;
    }

    console.log(`  🔍 Product ID: ${product.id}`);

    // 1. Fetch all variations
    const variations = await wcApi(`/products/${product.id}/variations?per_page=100`);
    console.log(`  🔍 Found ${variations.length} total variations for product ${product.id}`);

    // 2. Identify and delete invalid variations
    const validSizes = config.sizes;
    const validColorNames = config.colors.map(c => c.name);

    for (const v of variations) {
        const sizeAttr = v.attributes?.find(a => a.name === 'Veličina' || a.slug === 'velicina');
        const colorAttr = v.attributes?.find(a => a.name === 'Boja' || a.slug === 'boja');

        const hasProperSize = sizeAttr && (validSizes.includes(sizeAttr.option) || validSizes.length === 0);
        const hasProperColor = colorAttr && (validColorNames.includes(colorAttr.option) || validColorNames.length === 0);

        // If it's the bottle, we specially check for 500ml and colors
        if (key === 'bottle') {
            if (!hasProperSize || !hasProperColor) {
                console.log(`  🗑️ Deleting invalid variation ID: ${v.id} (${sizeAttr?.option || 'No size'} / ${colorAttr?.option || 'No color'})`);
                await wcApi(`/products/${product.id}/variations/${v.id}?force=true`, 'DELETE');
            }
        }
        // For other products, they must have BOTH valid size and valid color
        else if (!hasProperSize || !hasProperColor) {
            console.log(`  🗑️ Deleting invalid variation ID: ${v.id} (Size: ${sizeAttr?.option || 'MISSING'}, Color: ${colorAttr?.option || 'MISSING'})`);
            await wcApi(`/products/${product.id}/variations/${v.id}?force=true`, 'DELETE');
        }
    }

    // 3. Ensure all necessary variations exist
    console.log(`  📊 Re-verifying all needed variations...`);
    for (const size of config.sizes) {
        for (const color of config.colors) {
            const exists = variations.find(ev => {
                const s = ev.attributes?.find(a => a.name === 'Veličina' || a.slug === 'velicina');
                const c = ev.attributes?.find(a => a.name === 'Boja' || a.slug === 'boja');
                return s?.option === size && c?.option === color.name;
            });

            const variationData = {
                regular_price: config.price,
                status: 'publish',
                manage_stock: false,
                stock_status: 'instock',
                attributes: [
                    { name: 'Veličina', option: size },
                    { name: 'Boja', option: color.name }
                ]
            };

            if (!exists) {
                try {
                    console.log(`    ➕ Creating missing: ${size} / ${color.name}`);
                    await wcApi(`/products/${product.id}/variations`, 'POST', variationData);
                } catch (err) {
                    console.log(`    ⚠️  Error creating ${size} / ${color.name}: ${err.message}`);
                }
            } else if (exists.regular_price !== config.price) {
                console.log(`    🆙 Updating price for: ${size} / ${color.name} -> €${config.price}`);
                await wcApi(`/products/${product.id}/variations/${exists.id}`, 'PUT', { regular_price: config.price });
            }
        }
    }
}

async function main() {
    console.log('🚀 Dišpet Variation Cleanup & Setup');
    console.log('====================================');
    try {
        const test = await wcApi('/products?per_page=1');
        console.log(`✅ Proxy connected to WordPress.`);

        for (const [key, config] of Object.entries(PRODUCTS_CONFIG)) {
            await cleanupAndSetupProduct(key, config);
        }
        console.log('\n✅ Cleanup and Setup complete!');
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
    }
}

main();
