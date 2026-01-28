/**
 * WooCommerce Product Setup Script
 * Updates products with correct sizes, colors, and prices
 * Uses local proxy server to avoid direct API restrictions
 */

import axios from 'axios';

// Use the local proxy server
const API_BASE = 'http://localhost:3000/api';

// Product Configuration
const PRODUCTS_CONFIG = {
    'hoodie': {
        name: 'Dišpet Hoodie',
        price: '50',
        description: 'Premium teška hoodica, savršena za svaku priliku.',
        short_description: 'Kvalitetna hoodie majica s vašim izborom dizajna.',
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
        description: 'Klasična pamučna majica s vašim izborom dizajna.',
        short_description: 'Udobna pamučna majica dostupna u raznim bojama.',
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
        description: 'Klasična šilterica koja upotpunjuje svaki stil.',
        short_description: 'Stylish šilterica s vezenim logom.',
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
        description: 'Termo boca od nehrđajućeg čelika.',
        short_description: 'Kvalitetna termosica za tople i hladne napitke.',
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

    const config = {
        method,
        url,
        data,
    };

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

// Create or update a product attribute
async function ensureAttribute(name, slug, options) {
    console.log(`\n📦 Checking attribute: ${name}...`);

    // Check if attribute exists
    const attributes = await wcApi('/products/attributes');
    let attribute = attributes.find(a => a.slug === slug);

    if (!attribute) {
        console.log(`  Creating attribute: ${name}`);
        attribute = await wcApi('/products/attributes', 'POST', {
            name,
            slug,
            type: 'select',
            order_by: 'menu_order',
            has_archives: false
        });
        console.log(`  ✅ Created attribute ID: ${attribute.id}`);
    } else {
        console.log(`  ✅ Attribute exists: ID ${attribute.id}`);
    }

    // Get existing terms
    const existingTerms = await wcApi(`/products/attributes/${attribute.id}/terms?per_page=100`);
    const existingTermNames = existingTerms.map(t => t.name);

    // Add missing terms
    for (const option of options) {
        if (!existingTermNames.includes(option)) {
            console.log(`  Adding term: ${option}`);
            await wcApi(`/products/attributes/${attribute.id}/terms`, 'POST', {
                name: option
            });
        }
    }

    return attribute;
}

// Find existing product by name pattern
async function findProduct(searchTerms) {
    const products = await wcApi('/products?per_page=100');

    for (const term of searchTerms) {
        const found = products.find(p =>
            p.name.toLowerCase().includes(term.toLowerCase())
        );
        if (found) return found;
    }
    return null;
}

// Update or create a product
async function setupProduct(key, config) {
    console.log(`\n🛍️  Setting up product: ${config.name}`);

    // Search terms to find existing product
    const searchTerms = {
        'hoodie': ['hoodie', 'duksica', 'hudi'],
        'tshirt': ['shirt', 'majica', 't-shirt'],
        'cap': ['cap', 'kapa', 'šilterica'],
        'bottle': ['bottle', 'boca', 'termosica', 'termos']
    };

    let product = await findProduct(searchTerms[key] || [config.name]);

    // Build attributes array
    const attributes = [];

    // Size attribute
    if (config.sizes.length > 0) {
        attributes.push({
            name: 'Veličina',
            slug: 'velicina',
            position: 0,
            visible: true,
            variation: true,
            options: config.sizes
        });
    }

    // Color attribute
    if (config.colors.length > 0) {
        attributes.push({
            name: 'Boja',
            slug: 'boja',
            position: 1,
            visible: true,
            variation: true,
            options: config.colors.map(c => c.name)
        });
    }

    const productData = {
        name: config.name,
        type: 'variable',
        regular_price: '',  // Variable products don't have a price
        description: config.description,
        short_description: config.short_description,
        status: 'publish',
        catalog_visibility: 'visible',
        attributes,
        manage_stock: false,
        stock_status: 'instock'
    };

    if (product) {
        console.log(`  Found existing product ID: ${product.id}`);
        product = await wcApi(`/products/${product.id}`, 'PUT', productData);
        console.log(`  ✅ Updated product: ${product.name}`);
    } else {
        console.log(`  Creating new product...`);
        product = await wcApi('/products', 'POST', productData);
        console.log(`  ✅ Created product ID: ${product.id}`);
    }

    // Create/update variations
    await setupVariations(product.id, config);

    return product;
}

// Setup variations for a product
async function setupVariations(productId, config) {
    console.log(`  📊 Setting up variations for product ${productId}...`);

    // Get existing variations
    const existingVariations = await wcApi(`/products/${productId}/variations?per_page=100`);
    console.log(`  Found ${existingVariations.length} existing variations`);

    // Build all needed variations
    const neededVariations = [];

    for (const size of config.sizes) {
        for (const color of config.colors) {
            neededVariations.push({
                size,
                colorName: color.name,
                colorHex: color.hex
            });
        }
    }

    console.log(`  Need ${neededVariations.length} variations total`);

    // Check each needed variation
    for (const v of neededVariations) {
        // Check if variation exists
        const existing = existingVariations.find(ev => {
            const sizeAttr = ev.attributes?.find(a => a.name === 'Veličina' || a.slug === 'velicina');
            const colorAttr = ev.attributes?.find(a => a.name === 'Boja' || a.slug === 'boja');
            return sizeAttr?.option === v.size && colorAttr?.option === v.colorName;
        });

        const variationData = {
            regular_price: config.price,
            status: 'publish',
            manage_stock: false,
            stock_status: 'instock',
            attributes: [
                { name: 'Veličina', option: v.size },
                { name: 'Boja', option: v.colorName }
            ]
        };

        if (existing) {
            // Update if price is different
            if (existing.regular_price !== config.price) {
                await wcApi(`/products/${productId}/variations/${existing.id}`, 'PUT', variationData);
                console.log(`    Updated: ${v.size} / ${v.colorName} - €${config.price}`);
            }
        } else {
            // Create new variation
            try {
                await wcApi(`/products/${productId}/variations`, 'POST', variationData);
                console.log(`    Created: ${v.size} / ${v.colorName} - €${config.price}`);
            } catch (err) {
                console.log(`    ⚠️ Could not create: ${v.size} / ${v.colorName} - ${err.message}`);
            }
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 WooCommerce Product Setup Script');
    console.log('====================================');
    console.log(`Using proxy: ${API_BASE}`);

    try {
        // Test connection
        console.log('\n🔌 Testing API connection...');
        const testProducts = await wcApi('/products?per_page=1');
        console.log(`✅ Connected! Found ${testProducts.length > 0 ? 'products' : 'no products yet'}`);

        // Collect all unique sizes and colors
        const allSizes = [...new Set(Object.values(PRODUCTS_CONFIG).flatMap(p => p.sizes))];
        const allColors = [...new Set(Object.values(PRODUCTS_CONFIG).flatMap(p => p.colors.map(c => c.name)))];

        // Setup global attributes
        await ensureAttribute('Veličina', 'velicina', allSizes);
        await ensureAttribute('Boja', 'boja', allColors);

        // Setup each product
        for (const [key, config] of Object.entries(PRODUCTS_CONFIG)) {
            await setupProduct(key, config);
        }

        console.log('\n====================================');
        console.log('✅ All products have been set up!');
        console.log('\nPrices:');
        console.log('  - Hoodie: €50');
        console.log('  - T-Shirt: €30');
        console.log('  - Cap: €20');
        console.log('  - Bottle: €20');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main();
