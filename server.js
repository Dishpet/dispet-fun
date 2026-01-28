import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import FormData from 'form-data';
import { Buffer } from 'buffer';

// Wrap everything in try-catch to see errors
try {

    // ES Module __dirname equivalent
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    console.log('[STARTUP] Server initializing...');
    console.log('[STARTUP] __dirname:', __dirname);
    console.log('[STARTUP] Node version:', process.version);

    // Check what env files exist
    const possiblePaths = [
        path.join(__dirname, '.env.server'),
        path.join(__dirname, '.env'),
        path.join(process.cwd(), '.env'),
        path.join(__dirname, '.builds', 'config', '.env'),
        path.join(process.cwd(), '.builds', 'config', '.env')
    ];

    let loadedEnv = false;
    let envDebugLog = [];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`[STARTUP] Found .env at: ${p}`);
            envDebugLog.push(`Found .env at: ${p}`);

            // Debug: Read raw content (first 100 chars)
            try {
                const rawContent = fs.readFileSync(p, 'utf8');
                console.log(`[STARTUP] First 50 chars: ${JSON.stringify(rawContent.slice(0, 50))}`);
                envDebugLog.push(`First 50 chars: ${JSON.stringify(rawContent.slice(0, 50))}`);

                // Manual parse attempt
                const lines = rawContent.split('\n');
                console.log(`[STARTUP] File has ${lines.length} lines`);
                envDebugLog.push(`File has ${lines.length} lines`);
            } catch (err) {
                console.error('[STARTUP] Error reading file:', err);
                envDebugLog.push(`Error reading file: ${err.message}`);
            }

            const result = dotenv.config({ path: p });
            if (result.error) {
                console.error('[STARTUP] dotenv error:', result.error);
                envDebugLog.push(`dotenv error: ${result.error.message}`);
            } else {
                console.log('[STARTUP] dotenv parsed:', Object.keys(result.parsed || {}));
                envDebugLog.push(`dotenv parsed keys: ${Object.keys(result.parsed || {}).join(', ')}`);
            }

            loadedEnv = true;
            break;
        }
    }

    if (!loadedEnv) {
        console.log('[STARTUP] No local .env file found in search paths.');
        // Try default load just in case
        dotenv.config();
    }

    // Log which critical env vars are available
    console.log('[STARTUP] WP_API_URL:', process.env.WP_API_URL ? 'SET' : 'NOT SET');
    console.log('[STARTUP] WC_CONSUMER_KEY:', process.env.WC_CONSUMER_KEY ? 'SET' : 'NOT SET');


    const app = express();
    const PORT = process.env.PORT || 3000;
    const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

    // Ensure the data directory exists for local message storage
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Helper to get WordPress Application Password Auth Header (for /wp/v2/* endpoints)
    const getWpAuthHeader = () => {
        const user = process.env.WP_APP_USER;
        const pass = process.env.WP_APP_PASS;
        if (!user || !pass) return null;
        const cleanPass = pass.replace(/\s+/g, '');
        const hash = Buffer.from(`${user}:${cleanPass}`).toString('base64');
        return `Basic ${hash}`;
    };

    // Middleware
    app.use(helmet({
        contentSecurityPolicy: false,
    }));
    app.use(cors({
        exposedHeaders: ['X-WP-Total', 'X-WP-TotalPages']
    }));
    app.use(express.json());

    // --- HEALTH CHECK / DEBUG ---
    app.get('/api/health', (req, res) => {
        const wcKey = process.env.WC_CONSUMER_KEY || '';
        const wcSecret = process.env.WC_CONSUMER_SECRET || '';

        // Debug: List files in directory to see if .env exists
        let files = [];
        try {
            files = fs.readdirSync(__dirname);
        } catch (e) { files = ['error-listing-files']; }

        res.json({
            status: 'ok',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'production',
            config: {
                hasWpUrl: !!process.env.WP_API_URL,
                hasWcKey: !!wcKey,
                hasWcSecret: !!wcSecret,
                wcKeyMasked: wcKey ? `...${wcKey.slice(-4)}` : 'none',
                wcSecretMasked: wcSecret ? `...${wcSecret.slice(-4)}` : 'none',
                wpUrl: process.env.WP_API_URL || 'not set',
                port: PORT,
                debug: {
                    cwd: process.cwd(),
                    dirname: __dirname,
                    envFileExists: fs.existsSync(path.join(__dirname, '.env')),
                    ls: files.filter(f => f.startsWith('.env') || f === 'server.js'),
                    envLog: envDebugLog // Return the startup log to the client
                }
            }
        });
    });


    // --- CONTACT FORM HANDLER ---
    app.post('/api/contact', async (req, res) => {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`Received Contact Form Submission from: ${name} (${email})`);

        const smtpConfig = {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };

        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport(smtpConfig);

                await transporter.sendMail({
                    from: `"Dišpet Web" <${process.env.SMTP_USER}>`,
                    to: 'info@dispet.fun',
                    replyTo: email,
                    subject: `Nova poruka s weba: ${name}`,
                    text: `
Ime: ${name}
Email: ${email}
Telefon: ${phone || 'Nije naveden'}

Poruka:
${message}
                `,
                    html: `
<h3>Nova poruka s weba</h3>
<p><strong>Ime:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Telefon:</strong> ${phone || 'Nije naveden'}</p>
<hr />
<p><strong>Poruka:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
                `
                });
                console.log('Email sent successfully via SMTP.');
            } catch (error) {
                console.error('SMTP Error:', error);
            }
        } else {
            console.warn('No SMTP configuration found. Message logged to console only.');
            console.log('Message Content:', message);
        }

        // Store message locally
        try {
            const newMessage = {
                id: Date.now(),
                name,
                email,
                phone: phone || '',
                message,
                date: new Date().toISOString(),
                read: false
            };

            let messages = [];
            if (fs.existsSync(MESSAGES_FILE)) {
                const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
                try {
                    messages = JSON.parse(data);
                    if (!Array.isArray(messages)) messages = [];
                } catch (e) {
                    console.error("Error parsing messages file, resetting to empty array.");
                    messages = [];
                }
            }

            messages.unshift(newMessage);
            if (messages.length > 100) messages = messages.slice(0, 100);

            fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
            console.log('Message saved locally.');
        } catch (fsError) {
            console.error('Failed to save message locally:', fsError);
        }

        res.json({ success: true, message: 'Message received' });
    });

    // --- GET MESSAGES (for Admin) ---
    app.get('/api/messages', (req, res) => {
        try {
            if (fs.existsSync(MESSAGES_FILE)) {
                const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
                const messages = JSON.parse(data);
                res.json(messages);
            } else {
                res.json([]);
            }
        } catch (error) {
            console.error('Error reading messages:', error);
            res.status(500).json({ error: 'Failed to retrieve messages' });
        }
    });

    // --- DELETE MESSAGE ---
    app.delete('/api/messages/:id', (req, res) => {
        const { id } = req.params;
        try {
            if (fs.existsSync(MESSAGES_FILE)) {
                const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
                let messages = JSON.parse(data);

                const initialLength = messages.length;
                messages = messages.filter(msg => String(msg.id) !== String(id));

                if (messages.length < initialLength) {
                    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
                    return res.json({ success: true, message: 'Message deleted' });
                } else {
                    return res.status(404).json({ error: 'Message not found' });
                }
            }
            res.status(404).json({ error: 'No messages file found' });
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ error: 'Failed to delete message' });
        }
    });

    // --- REPLY TO MESSAGE ---
    app.post('/api/messages/reply', async (req, res) => {
        const { to, subject, body } = req.body;

        if (!to || !body) {
            return res.status(400).json({ error: 'Missing recipient or body' });
        }

        if (!process.env.SMTP_HOST) {
            return res.status(500).json({ error: 'SMTP not configured' });
        }

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: `"Dišpet Podrška" <${process.env.SMTP_USER}>`,
                to,
                subject: subject || 'Re: Vaša poruka za Dišpet',
                text: body,
                html: `<p>${body.replace(/\n/g, '<br>')}</p><br><hr><p><small>Sent from Dišpet Admin Dashboard</small></p>`
            });

            res.json({ success: true, message: 'Reply sent successfully' });
        } catch (error) {
            console.error('Reply failed:', error);
            res.status(500).json({ error: 'Failed to send reply' });
        }
    });

    // --- FORWARD MESSAGE ---
    app.post('/api/messages/forward', async (req, res) => {
        const { to, subject, body, originalMessage } = req.body;

        if (!to || !body) {
            return res.status(400).json({ error: 'Missing recipient or body' });
        }

        if (!process.env.SMTP_HOST) {
            return res.status(500).json({ error: 'SMTP not configured' });
        }

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const forwardedContent = `
        <p>${body.replace(/\n/g, '<br>')}</p>
        <br>
        <hr>
        <p><strong>Original Message:</strong></p>
        <blockquote>
            <p><strong>From:</strong> ${originalMessage.name} (${originalMessage.email})</p>
            <p><strong>Date:</strong> ${new Date(originalMessage.date).toLocaleString()}</p>
            <p>${originalMessage.message.replace(/\n/g, '<br>')}</p>
        </blockquote>
        `;

            await transporter.sendMail({
                from: `"Dišpet Admin" <${process.env.SMTP_USER}>`,
                to,
                subject: subject || `Fwd: Message from ${originalMessage.name}`,
                html: forwardedContent
            });

            res.json({ success: true, message: 'Message forwarded successfully' });
        } catch (error) {
            console.error('Forward failed:', error);
            res.status(500).json({ error: 'Failed to forward message' });
        }
    });


    // --- ORDER NOTIFICATION (for printing team) ---
    app.post('/api/order-notification', async (req, res) => {
        const { orderId, customer, items, total } = req.body;

        if (!orderId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing order data' });
        }

        console.log(`Received Order Notification for Order #${orderId}`);

        let itemsHtml = '';
        for (const item of items) {
            const imageUrl = item.image || '';
            const colorStyle = item.color ? `background-color: ${item.color}; padding: 20px; border-radius: 12px;` : '';

            itemsHtml += `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">
                <div style="${colorStyle} display: inline-block;">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" style="max-width: 100px; max-height: 100px; border-radius: 8px;" />` : 'Nema slike'}
                </div>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br/>
                <span style="color: #666;">Veličina: <strong>${item.size || 'N/A'}</strong></span><br/>
                <span style="color: #666;">Boja: 
                    <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background-color: ${item.color || '#ccc'}; border: 1px solid #999; vertical-align: middle;"></span>
                    <strong>${item.color || 'N/A'}</strong>
                </span><br/>
                <span style="color: #666;">Količina: <strong>${item.quantity}</strong></span>
            </td>
        </tr>
        `;
        }

        const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff69b4, #9b59b6); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">🛒 Nova Narudžba #${orderId}</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px;">
            <h3 style="margin-top: 0;">👤 Kupac:</h3>
            <p style="margin: 5px 0;"><strong>Ime:</strong> ${customer?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${customer?.email || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Telefon:</strong> ${customer?.phone || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Adresa:</strong> ${customer?.address || 'N/A'}, ${customer?.city || ''} ${customer?.postalCode || ''}</p>
        </div>

        <div style="padding: 20px;">
            <h3>📦 Proizvodi za Print:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eee;">
                        <th style="padding: 10px; text-align: left;">Dizajn</th>
                        <th style="padding: 10px; text-align: left;">Detalji</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>

        <div style="background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 12px 12px;">
            <strong>Ukupno: ${total || '0.00'} €</strong>
        </div>
    </div>
    `;

        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 465,
                    secure: true,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                await transporter.sendMail({
                    from: `"Dišpet Narudžbe" <${process.env.SMTP_USER}>`,
                    to: 'info@dispet.fun, dispet.fun@gmail.com',
                    subject: `🛒 Nova Narudžba #${orderId} - Za Print`,
                    html: emailHtml
                });

                console.log(`Order notification email sent for Order #${orderId}`);
            } catch (error) {
                console.error('Failed to send order notification:', error);
            }
        } else {
            console.warn('SMTP not configured - order notification logged only');
        }

        res.json({ success: true });
    });

    // --- UPLOAD DESIGN TO WORDPRESS MEDIA LIBRARY ---
    app.post('/api/upload-design', async (req, res) => {
        const { image, filename } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const wpApiUrl = process.env.WP_API_URL || 'https://wp.dispet.fun/wp-json';
        const wcKey = process.env.WC_CONSUMER_KEY;
        const wcSecret = process.env.WC_CONSUMER_SECRET;

        if (!wcKey || !wcSecret) {
            console.error('WordPress credentials not configured');
            return res.status(500).json({ error: 'WordPress credentials not configured' });
        }

        try {
            const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return res.status(400).json({ error: 'Invalid image format' });
            }

            const mimeType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            let extension = 'png';
            if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
            else if (mimeType.includes('webp')) extension = 'webp';

            const finalFilename = filename || `design-${Date.now()}.${extension}`;

            console.log(`Uploading design to WordPress: ${finalFilename}`);

            const form = new FormData();
            form.append('file', buffer, {
                filename: finalFilename,
                contentType: mimeType,
            });

            const authHeader = Buffer.from(`${wcKey}:${wcSecret}`).toString('base64');

            const response = await axios.post(`${wpApiUrl}/wp/v2/media`, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Basic ${authHeader}`,
                },
            });

            if (response.data && response.data.source_url) {
                console.log(`Design uploaded successfully: ${response.data.source_url}`);
                res.json({
                    success: true,
                    url: response.data.source_url,
                    id: response.data.id,
                });
            } else {
                throw new Error('No URL returned from WordPress');
            }
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            res.status(500).json({
                error: 'Upload failed',
                details: error.response?.data?.message || error.message,
            });
        }
    });


    // --- DEBUG ENDPOINT ---
    app.get('/api/debug-auth', async (req, res) => {
        const key = process.env.WC_CONSUMER_KEY || '';
        const secret = process.env.WC_CONSUMER_SECRET || '';
        const wpUrl = (process.env.WP_API_URL || 'https://wp.dispet.fun/wp-json').replace(/\/$/, '');

        let testResult = 'Skipped';
        if (key && secret) {
            try {
                const auth = Buffer.from(`${key}:${secret}`).toString('base64');
                const response = await axios.get(`${wpUrl}/wc/v3/products?per_page=1`, {
                    headers: { Authorization: `Basic ${auth}` },
                    validateStatus: () => true
                });
                testResult = {
                    status: response.status,
                    statusText: response.statusText,
                    dataMsg: response.data?.message || 'No message',
                    dataType: typeof response.data
                };
            } catch (e) {
                testResult = { error: e.message };
            }
        }

        res.json({
            envLoaded: loadedEnv,
            hasKey: !!key,
            wpUrl,
            testResult,
            cwd: process.cwd(),
            envDebugLog: envDebugLog || []
        });
    });

    // --- PROXY API ROUTES ---

    const WP_API_URL = (process.env.WP_API_URL || 'https://wp.dispet.fun/wp-json').replace(/\/$/, '');

    // Use app.use for robust middleware handling in Express 4/5
    app.use('/api', async (req, res) => {
        // Skip if already handled (however, app.use usually runs first? 
        // No, in Express, routes are matched in order. 
        // If we place this AT THE END, it catches everything not yet handled!)

        // Note: req.url in app.use is relative to the mount point (/api)
        // So if request is /api/wc/products, req.url is /wc/products
        const subPath = req.url;
        const apiPath = subPath.startsWith('/') ? subPath : `/${subPath}`;

        // Construct base Target URL
        let targetUrl = `${WP_API_URL}${apiPath}`;

        console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

        let authHeader = null;

        // Authentication Logic
        if (apiPath.startsWith('/wc/')) {
            const key = process.env.WC_CONSUMER_KEY;
            const secret = process.env.WC_CONSUMER_SECRET;

            if (key && secret) {
                // Method 1: Basic Auth Header (Standard)
                const authString = Buffer.from(`${key}:${secret}`).toString('base64');
                authHeader = `Basic ${authString}`;

                // Method 2: Query Params (Fallback for Header Stripping Proxies)
                const separator = targetUrl.includes('?') ? '&' : '?';
                targetUrl = `${targetUrl}${separator}consumer_key=${key}&consumer_secret=${secret}`;
            } else {
                console.warn('[Proxy] Missing WC credentials for WooCommerce request');
            }
        } else if (apiPath.startsWith('/wp/')) {
            authHeader = getWpAuthHeader();
        } else {
            // Fallback
            const key = process.env.WC_CONSUMER_KEY;
            const secret = process.env.WC_CONSUMER_SECRET;
            if (key && secret) {
                const authString = Buffer.from(`${key}:${secret}`).toString('base64');
                authHeader = `Basic ${authString}`;
            }
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };

        if (req.headers['content-type'] && !req.headers['content-type'].includes('multipart/form-data')) {
            headers['Content-Type'] = 'application/json';
        }

        if (req.headers['content-disposition']) {
            headers['Content-Disposition'] = req.headers['content-disposition'];
        }

        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: headers,
            data: req.method !== 'GET' ? req.body : undefined,
            validateStatus: () => true, // Don't throw on 4xx/5xx
        };

        // Handle specific fetch behavior if needed, but axios is fine.
        // We need to return the response.

        // ... (We need to copy the axios call from the previous implementation)
        // I will include it here in ReplacementContent to be safe
        try {
            const response = await axios(axiosConfig);

            // Forward status and headers
            res.status(response.status);

            // Forward headers carefully
            Object.keys(response.headers).forEach(key => {
                // Skip dangerous headers
                if (['content-length', 'connection', 'host', 'transfer-encoding'].includes(key.toLowerCase())) return;
                res.setHeader(key, response.headers[key]);
            });

            res.send(response.data);
        } catch (error) {
            console.error(`[Proxy Error] ${error.message}`);
            if (error.response) {
                res.status(error.response.status).send(error.response.data);
            } else {
                res.status(500).json({ error: 'Proxy Error', message: error.message });
            }
        }
    });


    // --- STATIC ASSETS & FALLBACK ---

    const distPath = path.resolve(__dirname, 'dist');
    const distIndexPath = path.join(distPath, 'index.html');

    if (!fs.existsSync(distPath)) {
        console.error(`[ERROR] dist folder not found at: ${distPath}`);
        console.error('[ERROR] Please run "npm run build" first');
    } else if (!fs.existsSync(distIndexPath)) {
        console.error(`[ERROR] dist/index.html not found at: ${distIndexPath}`);
        console.error('[ERROR] Build may have failed');
    } else {
        console.log(`[OK] Serving static files from: ${distPath}`);
    }

    app.use(express.static(distPath));

    // Express 5 catch-all route syntax
    app.get('{*path}', (req, res) => {

        if (fs.existsSync(distIndexPath)) {
            res.sendFile(distIndexPath);
        } else {
            res.status(500).send(`
            <h1>Build Not Found</h1>
            <p>The production build (dist folder) was not found.</p>
            <p>Expected path: ${distPath}</p>
            <p>Current directory: ${__dirname}</p>
            <p>Please ensure 'npm run build' has been executed.</p>
        `);
        }
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`__dirname: ${__dirname}`);
        console.log(`distPath: ${distPath}`);
    });

} catch (error) {
    console.error('[FATAL ERROR] Server failed to start:', error);
    process.exit(1);
}
