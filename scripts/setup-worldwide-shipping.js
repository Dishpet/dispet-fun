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
        console.log('🚀 Setting up WorldWide Shipping and updating Croatia Zone ID 0 fallback...');

        // 1. Setup WorldWide Zone (ID 0 is the default fallback "Locations not covered by other zones")
        console.log('🌍 Configuring "Rest of World" fallback zone (ID 0)...');

        // Clear existing methods in zone 0
        const existingMethods = await wcApi('/shipping/zones/0/methods');
        for (const method of existingMethods) {
            await wcApi(`/shipping/zones/0/methods/${method.instance_id}`, 'DELETE', { force: true });
        }

        // Add Flat Rate (10€) for WorldWide
        const worldFlatRate = await wcApi('/shipping/zones/0/methods', 'POST', {
            method_id: 'flat_rate',
            settings: {
                title: 'International Shipping',
                cost: '10'
            }
        });
        console.log(`✅ International Flat Rate (10€) added to Zone 0 fallback.`);

        console.log('\n====================================');
        console.log('🎉 WORLDWIDE SHIPPING SETUP COMPLETE!');
        console.log('- Zone 0 (Rest of World): 10 €');
        console.log('====================================');

    } catch (err) {
        console.error('❌ Setup failed:', err.message);
    }
}

main();
