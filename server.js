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
    // Order log file path
    const ORDER_LOG_DIR = path.join(CWD, 'data');
    const ORDER_LOG_FILE = path.join(ORDER_LOG_DIR, 'orders.json');

    // Helper: Save order to JSON log file
    const saveOrderToLog = (orderData) => {
        try {
            // Ensure data directory exists
            if (!fs.existsSync(ORDER_LOG_DIR)) {
                fs.mkdirSync(ORDER_LOG_DIR, { recursive: true });
            }

            // Read existing orders
            let orders = [];
            if (fs.existsSync(ORDER_LOG_FILE)) {
                const raw = fs.readFileSync(ORDER_LOG_FILE, 'utf-8');
                orders = JSON.parse(raw);
            }

            // Add new order with timestamp
            orders.push({
                ...orderData,
                logged_at: new Date().toISOString(),
            });

            // Write back
            fs.writeFileSync(ORDER_LOG_FILE, JSON.stringify(orders, null, 2), 'utf-8');
            console.log(`✅ Order #${orderData.orderId} saved to orders log (${orders.length} total orders)`);
        } catch (err) {
            console.error('❌ Failed to save order to log:', err);
        }
    };

    app.post('/api/order-notification', async (req, res) => {
        const { orderId, customer, items, total } = req.body;

        if (!orderId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing order data' });
        }

        console.log(`Received Order Notification for Order #${orderId}`);
        console.log(`  Customer: ${customer?.name || 'N/A'} (${customer?.email || 'N/A'})`);
        console.log(`  Items: ${items.length}, Total: ${total}€`);
        items.forEach((item, i) => console.log(`  Item ${i + 1}: ${item.name} | Color: ${item.color || 'N/A'} | Size: ${item.size || 'N/A'}`));

        // 📝 SAVE ORDER TO LOCAL JSON LOG (safety net)
        saveOrderToLog({ orderId, customer, items, total });

        // 📦 AUTO-DECREMENT INVENTORY
        try {
            const inventoryChanges = decrementInventoryForOrder(items);
            console.log(`📦 Inventory decremented for Order #${orderId}:`, inventoryChanges);
        } catch (invErr) {
            console.error('❌ Inventory decrement failed:', invErr);
        }

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

        // --- PREPARE EMAILS ---
        const footerStyle = `background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 14px;`;

        const printEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ff69b4, #9b59b6); padding: 25px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🛒 Nova Narudžba #${orderId}</h1>
            <p style="color: white; opacity: 0.9; margin-top: 5px;">Spremno za printanje</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-bottom: 1px solid #eee;">
            <h3 style="margin-top: 0; color: #333;">👤 Kupac:</h3>
            <p style="margin: 5px 0;"><strong>Ime:</strong> ${customer?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${customer?.email || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Telefon:</strong> ${customer?.phone || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Adresa:</strong> ${customer?.address || 'N/A'}, ${customer?.city || ''} ${customer?.postalCode || ''}</p>
        </div>

        <div style="padding: 20px;">
            <h3 style="color: #333;">📦 Proizvodi:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eee;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Dizajn</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Detalji</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>

        <div style="padding: 15px; background: #f9f9f9; text-align: center; font-weight: bold; font-size: 20px; border-top: 1px solid #eee;">
            Ukupno: ${total || '0.00'} €
        </div>

        <div style="${footerStyle}">
            <strong>ANTIGRAVITY PRINT SUSTAV</strong>
        </div>
    </div>
    `;

        const customerEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00ffbf, #0089cd); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Hvala na narudžbi! 🤘</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Vaša narudžba #${orderId} je zaprimljena.</p>
        </div>
        
        <div style="padding: 30px; line-height: 1.6; color: #333;">
            <p>Bok ${customer?.name?.split(' ')[0] || 'tamo'},</p>
            <p>Hvala što si odabrao <strong>Dišpet</strong>! Tvoja narudžba je upravo sletjela u naš sustav i čim prođe provjeru, krećemo u akciju.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0089cd;">Sažetak narudžbe:</h3>
                <p><strong>Broj narudžbe:</strong> #${orderId}</p>
                <p><strong>Ukupno za platiti:</strong> ${total} €</p>
            </div>

            <p>Čim pošaljemo paket, dobit ćeš poruku s brojem za praćenje.</p>
            
            <p>Ako imaš bilo kakvih pitanja, slobodno nam se javi na <a href="mailto:info@dispet.fun" style="color: #0089cd;">info@dispet.fun</a>.</p>
            
            <p style="margin-top: 30px;">Pozdrav,<br/><strong>Dišpet Tim</strong></p>
        </div>
        
        <div style="${footerStyle}">
            <p>&copy; ${new Date().getFullYear()} Dišpet. Sva prava pridržana.</p>
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

                // 1. Send to Admin/Print team
                await transporter.sendMail({
                    from: `"Dišpet Narudžbe" <${process.env.SMTP_USER}>`,
                    to: 'info@dispet.fun, dispet.fun@gmail.com',
                    subject: `🛒 Nova Narudžba #${orderId} - ZA PRINT`,
                    html: printEmailHtml
                });

                // 2. Send to Customer (if email exists)
                if (customer?.email) {
                    await transporter.sendMail({
                        from: `"Dišpet" <${process.env.SMTP_USER}>`,
                        to: customer.email,
                        subject: `Potvrda narudžbe #${orderId} - Dišpet`,
                        html: customerEmailHtml
                    });
                    console.log(`Customer confirmation sent to ${customer.email} for order #${orderId}`);
                }

                console.log(`Order notification emails sent for Order #${orderId}`);
            } catch (error) {
                console.error('Failed to send order notifications:', error);
            }
        } else {
            console.warn('SMTP not configured - order notification logged only');
        }

        res.json({ success: true });
    });

    // --- VIEW ORDER LOG (Admin) ---
    app.get('/api/orders-log', async (req, res) => {
        try {
            if (fs.existsSync(ORDER_LOG_FILE)) {
                const raw = fs.readFileSync(ORDER_LOG_FILE, 'utf-8');
                const orders = JSON.parse(raw);
                res.json({ success: true, count: orders.length, orders });
            } else {
                res.json({ success: true, count: 0, orders: [] });
            }
        } catch (err) {
            console.error('Failed to read orders log:', err);
            res.status(500).json({ error: 'Failed to read orders log' });
        }
    });

    // ======================================================================
    // --- INVENTORY MANAGEMENT SYSTEM ---
    // ======================================================================
    const INVENTORY_FILE = path.join(ORDER_LOG_DIR, 'inventory.json');

    // Helper: Read inventory from file
    const readInventory = () => {
        try {
            if (!fs.existsSync(ORDER_LOG_DIR)) {
                fs.mkdirSync(ORDER_LOG_DIR, { recursive: true });
            }
            if (fs.existsSync(INVENTORY_FILE)) {
                const raw = fs.readFileSync(INVENTORY_FILE, 'utf-8');
                return JSON.parse(raw);
            }
            return { products: {}, last_updated: null };
        } catch (err) {
            console.error('Failed to read inventory:', err);
            return { products: {}, last_updated: null };
        }
    };

    // Helper: Write inventory to file
    const writeInventory = (data) => {
        try {
            if (!fs.existsSync(ORDER_LOG_DIR)) {
                fs.mkdirSync(ORDER_LOG_DIR, { recursive: true });
            }
            data.last_updated = new Date().toISOString();
            fs.writeFileSync(INVENTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (err) {
            console.error('Failed to write inventory:', err);
            return false;
        }
    };

    // Helper: Map hex colors to WooCommerce color names
    const HEX_TO_COLOR_NAME = {
        '#231f20': 'Crna',
        '#d1d5db': 'Siva',
        '#00ab98': 'Tirkizna',
        '#00aeef': 'Cijan',
        '#387bbf': 'Plava',
        '#8358a4': 'Ljubičasta',
        '#ffffff': 'Bijela',
        '#e78fab': 'Roza',
        '#a1d7c0': 'Mint',
    };

    const resolveColorName = (color) => {
        if (!color) return '';
        const lower = color.toLowerCase();
        // If it's already a name (not starting with #), return as-is
        if (!color.startsWith('#')) return color;
        return HEX_TO_COLOR_NAME[lower] || color;
    };

    // Helper: Decrement inventory for an order
    const decrementInventoryForOrder = (items) => {
        const inventory = readInventory();
        const changes = [];

        for (const item of items) {
            const productKey = String(item.product_id || item.id);
            const size = item.size || item.selectedSize || '';
            const rawColor = item.color || item.selectedColor || '';
            const color = resolveColorName(rawColor);
            const qty = item.quantity || 1;

            // Build variant key: "productId" or "productId|size|color"
            const variantKey = (size || color)
                ? `${productKey}|${size}|${color}`
                : productKey;

            if (inventory.products[variantKey]) {
                const prev = inventory.products[variantKey].stock;
                inventory.products[variantKey].stock = Math.max(0, prev - qty);
                inventory.products[variantKey].last_sold = new Date().toISOString();
                inventory.products[variantKey].total_sold = (inventory.products[variantKey].total_sold || 0) + qty;
                changes.push({ variantKey, prev, now: inventory.products[variantKey].stock, qty });
            } else {
                // Auto-create entry with negative awareness (stock -qty means we don't know initial)
                inventory.products[variantKey] = {
                    product_id: parseInt(productKey),
                    name: item.name || 'Unknown',
                    size,
                    color,
                    stock: 0, // Unknown initial stock
                    total_sold: qty,
                    last_sold: new Date().toISOString(),
                    auto_created: true,
                    note: 'Auto-created from order. Set initial stock manually.'
                };
                changes.push({ variantKey, prev: 'N/A', now: 0, qty, auto_created: true });
            }
        }

        writeInventory(inventory);
        return changes;
    };

    // GET /api/inventory - Get full inventory
    app.get('/api/inventory', (req, res) => {
        try {
            const inventory = readInventory();
            // Convert object to array for easier frontend consumption
            const items = Object.entries(inventory.products).map(([key, data]) => ({
                key,
                ...(data)
            }));

            // Sort: out of stock first, then by name
            items.sort((a, b) => {
                if (a.stock === 0 && b.stock > 0) return -1;
                if (a.stock > 0 && b.stock === 0) return 1;
                return (a.name || '').localeCompare(b.name || '');
            });

            res.json({
                success: true,
                count: items.length,
                last_updated: inventory.last_updated,
                items,
                low_stock: items.filter(i => i.stock <= 3 && i.stock > 0),
                out_of_stock: items.filter(i => i.stock === 0 && !i.auto_created),
            });
        } catch (err) {
            console.error('Failed to read inventory:', err);
            res.status(500).json({ error: 'Failed to read inventory' });
        }
    });

    // PUT /api/inventory/:key - Update a single inventory item
    app.put('/api/inventory/:key', (req, res) => {
        try {
            const key = decodeURIComponent(req.params.key);
            const { stock, name, size, color, note } = req.body;
            const inventory = readInventory();

            if (!inventory.products[key]) {
                // Create new entry
                inventory.products[key] = {
                    product_id: parseInt(key.split('|')[0]) || 0,
                    name: name || 'Unknown',
                    size: size || '',
                    color: color || '',
                    stock: 0,
                    total_sold: 0,
                };
            }

            // Update fields
            if (stock !== undefined) inventory.products[key].stock = parseInt(stock);
            if (name !== undefined) inventory.products[key].name = name;
            if (size !== undefined) inventory.products[key].size = size;
            if (color !== undefined) inventory.products[key].color = color;
            if (note !== undefined) inventory.products[key].note = note;
            inventory.products[key].auto_created = false; // Mark as manually managed

            writeInventory(inventory);
            console.log(`📦 Inventory updated: ${key} → stock: ${inventory.products[key].stock}`);

            res.json({ success: true, item: { key, ...inventory.products[key] } });
        } catch (err) {
            console.error('Failed to update inventory:', err);
            res.status(500).json({ error: 'Failed to update inventory' });
        }
    });

    // POST /api/inventory - Add a new inventory item
    app.post('/api/inventory', (req, res) => {
        try {
            const { product_id, name, size, color, stock, note } = req.body;
            if (!product_id || !name) {
                return res.status(400).json({ error: 'product_id and name are required' });
            }

            const inventory = readInventory();

            const key = (size || color)
                ? `${product_id}|${size || ''}|${color || ''}`
                : String(product_id);

            inventory.products[key] = {
                product_id: parseInt(product_id),
                name,
                size: size || '',
                color: color || '',
                stock: parseInt(stock) || 0,
                total_sold: 0,
                note: note || '',
                created_at: new Date().toISOString(),
            };

            writeInventory(inventory);
            console.log(`📦 Inventory item added: ${key} (${name}) → stock: ${stock || 0}`);

            res.json({ success: true, item: { key, ...inventory.products[key] } });
        } catch (err) {
            console.error('Failed to add inventory item:', err);
            res.status(500).json({ error: 'Failed to add inventory item' });
        }
    });

    // DELETE /api/inventory/:key - Remove an inventory item
    app.delete('/api/inventory/:key', (req, res) => {
        try {
            const key = decodeURIComponent(req.params.key);
            const inventory = readInventory();

            if (inventory.products[key]) {
                delete inventory.products[key];
                writeInventory(inventory);
                console.log(`📦 Inventory item removed: ${key}`);
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (err) {
            console.error('Failed to delete inventory item:', err);
            res.status(500).json({ error: 'Failed to delete inventory item' });
        }
    });

    // POST /api/inventory/sync - Sync inventory from WooCommerce variations
    app.post('/api/inventory/sync', async (req, res) => {
        try {
            const WP_API_BASE = (process.env.WP_API_URL || 'https://wp.dispet.fun/wp-json').replace(/\/$/, '');
            const ck = process.env.WC_CONSUMER_KEY;
            const cs = process.env.WC_CONSUMER_SECRET;

            if (!ck || !cs) {
                return res.status(500).json({ error: 'WooCommerce credentials not configured' });
            }

            const wcFetch = async (path) => {
                const sep = path.includes('?') ? '&' : '?';
                const url = `${WP_API_BASE}${path}${sep}consumer_key=${ck}&consumer_secret=${cs}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`WC API error: ${response.status}`);
                return response.json();
            };

            // 1. Fetch all products
            const products = await wcFetch('/wc/v3/products?per_page=100');
            const inventory = readInventory();
            let synced = 0;
            let skipped = 0;

            for (const product of products) {
                if (product.type === 'variable' && product.variations && product.variations.length > 0) {
                    // Fetch variations for this product
                    const variations = await wcFetch(`/wc/v3/products/${product.id}/variations?per_page=100`);

                    for (const v of variations) {
                        const sizeAttr = v.attributes.find(a => a.name === 'Veličina');
                        const colorAttr = v.attributes.find(a => a.name === 'Boja');
                        const size = sizeAttr ? sizeAttr.option : '';
                        const color = colorAttr ? colorAttr.option : '';

                        // Key format: productId|Size|Color (using names, not hex codes)
                        const key = (size || color)
                            ? `${product.id}|${size}|${color}`
                            : String(product.id);

                        const wcStock = v.stock_quantity || 0;

                        if (!inventory.products[key]) {
                            // New item — import from WC
                            inventory.products[key] = {
                                product_id: product.id,
                                name: product.name,
                                size,
                                color,
                                stock: wcStock,
                                total_sold: 0,
                                wc_variation_id: v.id,
                                synced_from_wc: true,
                                synced_at: new Date().toISOString(),
                            };
                            synced++;
                        } else {
                            // Existing item — update WC variation ID but keep local stock as source of truth
                            inventory.products[key].wc_variation_id = v.id;
                            inventory.products[key].name = product.name;
                            inventory.products[key].synced_at = new Date().toISOString();
                            // If this was auto_created with wrong data, update stock from WC
                            if (inventory.products[key].auto_created) {
                                inventory.products[key].stock = wcStock;
                                inventory.products[key].auto_created = false;
                                synced++;
                            } else {
                                skipped++;
                            }
                        }
                    }
                } else if (product.type === 'simple') {
                    const key = String(product.id);
                    if (!inventory.products[key]) {
                        inventory.products[key] = {
                            product_id: product.id,
                            name: product.name,
                            size: '',
                            color: '',
                            stock: product.stock_quantity || 0,
                            total_sold: 0,
                            synced_from_wc: true,
                            synced_at: new Date().toISOString(),
                        };
                        synced++;
                    } else {
                        skipped++;
                    }
                }
            }

            writeInventory(inventory);
            console.log(`📦 Inventory sync complete: ${synced} synced, ${skipped} skipped`);

            res.json({
                success: true,
                synced,
                skipped,
                total: Object.keys(inventory.products).length,
                message: `Synced ${synced} items from WooCommerce. ${skipped} already existed.`
            });
        } catch (err) {
            console.error('Failed to sync inventory from WC:', err);
            res.status(500).json({ error: 'Failed to sync from WooCommerce: ' + err.message });
        }
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
        const internalRoutes = ['/messages', '/health', '/debug-auth', '/contact', '/upload-design', '/order-notification', '/orders-log', '/inventory'];
        if (internalRoutes.some(route => apiPath.startsWith(route))) {
            return next();
        }

        const WP_API_BASE = (process.env.WP_API_URL || 'https://wp.dispet.fun/wp-json').replace(/\/$/, '');
        const targetUrl = `${WP_API_BASE}${apiPath}`;

        console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

        let authHeader = null;

        // Check if client sent their own Authorization header (user-specific auth)
        const clientAuth = req.headers['authorization'];

        if (clientAuth) {
            // Forward client's auth (e.g., user logging in or admin performing actions)
            authHeader = clientAuth;
            console.log('[Proxy] Using client Authorization header');
        } else if (apiPath.includes('/wc')) {
            // WooCommerce Routes -> Use Consumer Key/Secret
            const key = process.env.WC_CONSUMER_KEY;
            const secret = process.env.WC_CONSUMER_SECRET;
            if (key && secret) {
                const authString = Buffer.from(`${key}:${secret}`).toString('base64');
                authHeader = `Basic ${authString}`;
            }
        } else if (apiPath.includes('/wp/') || apiPath.includes('/antigravity/')) {
            // Standard WP Routes & Antigravity Extensions -> Use App Password
            authHeader = getWpAuthHeader();
        }

        // Prepare Headers
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Node.js Proxy)',
            'Accept': 'application/json'
        };

        if (req.headers['content-type']) {
            headers['Content-Type'] = req.headers['content-type'];
        }

        // Apply Auth Header
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
