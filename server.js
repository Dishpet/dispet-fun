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
    // ES Module path helper
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const CWD = process.cwd();

    console.log('[STARTUP] Server initializing...');
    console.log('[STARTUP] CWD:', CWD);
    console.log('[STARTUP] __dirname:', __dirname);

    // Robust environment variable loading
    const envPaths = [
        path.join(CWD, '.env.server'),
        path.join(CWD, '.env'),
        path.join(__dirname, '.env.server'),
        path.join(__dirname, '.env'),
    ];

    let envLoaded = false;
    for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
            console.log(`[STARTUP] Loading env from: ${envPath}`);
            const result = dotenv.config({ path: envPath });
            if (!result.error) {
                envLoaded = true;
                break;
            } else {
                console.error(`[STARTUP] Error loading ${envPath}:`, result.error);
            }
        }
    }

    if (!envLoaded) {
        console.warn('[STARTUP] No specific .env file found/loaded. Using system environment.');
        dotenv.config(); // Fallback to default
    }

    // Scrub helper - only remove quotes from values that actually have them
    const scrub = (v) => {
        if (!v) return '';
        let s = v.toString().trim();
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.slice(1, -1);
        }
        return s;
    };

    // Apply scrubbing to critical variables
    if (process.env.WC_CONSUMER_KEY) process.env.WC_CONSUMER_KEY = scrub(process.env.WC_CONSUMER_KEY);
    if (process.env.WC_CONSUMER_SECRET) process.env.WC_CONSUMER_SECRET = scrub(process.env.WC_CONSUMER_SECRET);
    if (process.env.WP_APP_USER) process.env.WP_APP_USER = scrub(process.env.WP_APP_USER);
    if (process.env.WP_APP_PASS) process.env.WP_APP_PASS = scrub(process.env.WP_APP_PASS);
    if (process.env.WP_API_URL) process.env.WP_API_URL = scrub(process.env.WP_API_URL);

    // Validate existence of keys after load
    const HAS_WC_CREDS = !!(process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET);
    if (!HAS_WC_CREDS) {
        console.error('[CRITICAL] WooCommerce Credentials Missing after env load!');
    } else {
        console.log('[STARTUP] WooCommerce Credentials Loaded');
    }

    const app = express();
    const PORT = process.env.PORT || 3000;

    // Use CWD for data persistence - safer on Hostinger
    const dataDir = path.join(CWD, 'data');
    const MESSAGES_FILE = path.join(dataDir, 'messages.json');

    if (!fs.existsSync(dataDir)) {
        try {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('[STARTUP] Created data directory at:', dataDir);
        } catch (e) {
            console.error('[STARTUP] Failed to create data directory:', e.message);
        }
    }

    // Helper to get WordPress Application Password Auth Header
    const getWpAuthHeader = () => {
        const user = process.env.WP_APP_USER;
        const pass = process.env.WP_APP_PASS;
        if (!user || !pass) return null;
        // Strip spaces from WP App Passwords
        const cleanPass = pass.replace(/\s+/g, '');
        const hash = Buffer.from(`${user}:${cleanPass}`).toString('base64');
        return `Basic ${hash}`;
    };

    // Middleware
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ exposedHeaders: ['X-WP-Total', 'X-WP-TotalPages'] }));
    app.use(express.json());

    // --- HEALTH CHECK / DEBUG ---
    app.get('/api/health', (req, res) => {
        const wcKey = process.env.WC_CONSUMER_KEY || '';
        const wcSecret = process.env.WC_CONSUMER_SECRET || '';

        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            config: {
                hasWpUrl: !!process.env.WP_API_URL,
                hasWcKey: !!wcKey,
                hasWcSecret: !!wcSecret,
                wcKeyMasked: wcKey ? `${wcKey.slice(0, 5)}...${wcKey.slice(-4)}` : 'none',
                wpUrl: process.env.WP_API_URL || 'not set',
                cwd: CWD,
                envLoaded
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
                    dataType: typeof response.data,
                    isArray: Array.isArray(response.data)
                };
            } catch (e) {
                testResult = { error: e.message };
            }
        }

        res.json({
            envLoaded: loadedEnv,
            hasKey: !!key,
            keySummary: key ? `${key.substring(0, 5)}...` : 'none',
            wpUrl,
            testResult,
            cwd: process.cwd(),
            envDebugLog: envDebugLog || []
        });
    });

    // --- PROXY API ROUTES ---

    // Use app.use as a catch-all proxy for /api requests
    app.use('/api', async (req, res, next) => {
        const subPath = req.url; // includes query params
        const apiPath = subPath.startsWith('/') ? subPath : `/${subPath}`;

        // SAFETY: Skip internal routes
        const internalRoutes = ['/messages', '/health', '/debug-auth', '/contact', '/upload-design'];
        if (internalRoutes.some(route => apiPath.startsWith(route))) {
            return next();
        }

        const WP_API_BASE = (process.env.WP_API_URL || 'https://wp.dispet.fun/wp-json').replace(/\/$/, '');
        const targetUrl = `${WP_API_BASE}${apiPath}`;

        console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

        let authHeader = null;

        // WooCommerce Authentication (covers /wc/v3, /wc-analytics, etc)
        if (apiPath.includes('/wc')) {
            const key = process.env.WC_CONSUMER_KEY;
            const secret = process.env.WC_CONSUMER_SECRET;

            if (key && secret) {
                const authString = Buffer.from(`${key}:${secret}`).toString('base64');
                authHeader = `Basic ${authString}`;
            }
        } else if (apiPath.includes('/wp/')) {
            authHeader = getWpAuthHeader();
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Node.js Proxy)',
            'Accept': 'application/json'
        };

        if (req.headers['content-type']) {
            headers['Content-Type'] = req.headers['content-type'];
        }

        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        try {
            const response = await axios({
                method: req.method,
                url: targetUrl,
                headers: headers,
                data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
                validateStatus: () => true, // Forward all status codes
            });

            // Forward status and headers
            res.status(response.status);

            // Forward relevant headers
            const safeHeaders = ['content-type', 'x-wp-total', 'x-wp-totalpages', 'link'];
            Object.keys(response.headers).forEach(key => {
                if (safeHeaders.includes(key.toLowerCase())) {
                    res.setHeader(key, response.headers[key]);
                }
            });

            res.send(response.data);
        } catch (error) {
            console.error(`[Proxy Error] ${req.method} ${apiPath}: ${error.message}`);
            res.status(500).json({
                error: 'Proxy Error',
                message: error.message,
                path: apiPath
            });
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
