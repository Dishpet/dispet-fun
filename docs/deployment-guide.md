# Deploying to Hostinger (Manual Build Workflow)

This project is configured to avoid memory issues and build failures on Hostinger's restricted environment. Because Hostinger often struggles with the resource-intensive `vite build` process, we use a **Local Build + Force Push** strategy.

## Deployment Strategy: "Skip Server Build"

The `package.json` contains a safety script:
```json
"build": "echo 'Skipping build on server'"
```
This prevents Hostinger's automated deployment tools from attempting a server-side compilation. Instead, the server simply serves the static files already present in the `dist` folder.

---

## Step-by-Step Deployment Instructions

To push new changes to the live site, follow these exact steps:

### 1. Build Locally
First, generate the production assets on your local machine where you have enough RAM.
```bash
npm run build:local
```
*Note: This runs `vite build` without triggering the "Skip" script.*

### 2. Add and Commit Source Changes
Commit your code changes as usual.
```bash
git add src/
git commit -m "Your feature description"
```

### 3. Force-Add the Compiled Assets
The `dist` folder is ignored by default in our `.gitignore` to keep the repo clean. However, since the server needs these files to stay updated, you must force-add the `dist` folder changes:
```bash
git add -f dist/
git commit -m "Deployment: Update production assets"
```

### 4. Push to Main
Push everything to the GitHub repository.
```bash
git push origin main
```

### 5. Finalize on Hostinger
Once pushed, Hostinger should automatically pull the new `dist` folder. 
- Ensure your Hostinger Node.js setup is pointing to `server.js`.
- If the changes don't appear immediately, perform a **Hard Refresh** (`Ctrl + F5` or `Cmd + Shift + R`) in your browser to clear the CDN/Browser cache.

---

## Troubleshooting

### "dist folder not found" error on server
If you see a "Build Not Found" page on the website, it means the `dist` folder was not successfully pushed or was deleted during a git operation. Re-run Step 3 using the `-f` (force) flag.

### Backend Changes
If you modify `server.js` or `.env.server`, you may need to **Restart the Node.js App** in the Hostinger Panel to apply those changes, as they are part of the runtime server, not the static frontend.
