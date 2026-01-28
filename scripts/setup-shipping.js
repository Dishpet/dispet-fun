import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

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

async function main() {
    try {
        console.log('🚀 Setting up WooCommerce Shipping for Croatia...');

        // 1. Check if Croatia zone already exists
        const zones = await wcApi('/shipping/zones');
        let croatiaZone = zones.find(z => z.name === 'Hrvatska' || z.name === 'Croatia');

        if (!croatiaZone) {
            console.log('📦 Creating new shipping zone: Hrvatska...');
            croatiaZone = await wcApi('/shipping/zones', 'POST', {
                name: 'Hrvatska'
            });
            console.log(`✅ Zone created with ID: ${croatiaZone.id}`);
        } else {
            console.log(`✅ Zone "Hrvatska" already exists (ID: ${croatiaZone.id})`);
        }

        // 2. Set location to Croatia (HR)
        console.log('📍 Setting zone location to Croatia (HR)...');
        await wcApi(`/shipping/zones/${croatiaZone.id}/locations`, 'PUT', [
            {
                code: 'HR',
                type: 'country'
            }
        ]);
        console.log('✅ Location updated.');

        // 3. Clear existing methods to ensure a clean setup
        console.log('🧹 Clearing existing methods for this zone...');
        const existingMethods = await wcApi(`/shipping/zones/${croatiaZone.id}/methods`);
        for (const method of existingMethods) {
            await wcApi(`/shipping/zones/${croatiaZone.id}/methods/${method.instance_id}`, 'DELETE', { force: true });
        }

        // 4. Add Flat Rate (5€)
        console.log('🚚 Adding Flat Rate method (5€)...');
        const flatRate = await wcApi(`/shipping/zones/${croatiaZone.id}/methods`, 'POST', {
            method_id: 'flat_rate',
            settings: {
                title: 'Dostava',
                cost: '5'
            }
        });
        console.log(`✅ Flat Rate added (ID: ${flatRate.instance_id})`);

        // 5. Add Free Shipping (above 70€)
        console.log('🎁 Adding Free Shipping method (above 70€)...');
        const freeShipping = await wcApi(`/shipping/zones/${croatiaZone.id}/methods`, 'POST', {
            method_id: 'free_shipping',
            settings: {
                title: 'Besplatna dostava',
                requires: 'min_amount',
                min_amount: '70'
            }
        });
        console.log(`✅ Free Shipping added (ID: ${freeShipping.instance_id})`);

        console.log('\n====================================');
        console.log('🎉 SHIPPING SETUP COMPLETE!');
        console.log('- Zone: Croatia (HR)');
        console.log('- Flat Rate: 5 €');
        console.log('- Free Shipping: Above 70 €');
        console.log('====================================');

    } catch (err) {
        console.error('❌ Setup failed:', err.message);
    }
}

main();
