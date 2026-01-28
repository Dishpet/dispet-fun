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
        console.log('--- Current Shipping Zones ---');
        const zones = await wcApi('/shipping/zones');
        console.log(JSON.stringify(zones, null, 2));

        for (const zone of zones) {
            console.log(`\n--- Methods for Zone: ${zone.name} (ID: ${zone.id}) ---`);
            const methods = await wcApi(`/shipping/zones/${zone.id}/methods`);
            console.log(JSON.stringify(methods, null, 2));

            console.log(`\n--- Locations for Zone: ${zone.name} (ID: ${zone.id}) ---`);
            const locations = await wcApi(`/shipping/zones/${zone.id}/locations`);
            console.log(JSON.stringify(locations, null, 2));
        }
    } catch (err) {
        console.error('Failed to fetch shipping info');
    }
}

main();
