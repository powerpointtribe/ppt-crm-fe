# Church Management System - Troubleshooting Guide

## "Failed to load resource: Could not connect to the server" Error

If you're seeing this error, here are the steps to resolve it:

### 1. Check Server Status

**Verify the development server is running:**
```bash
# Check if the server is running on port 5173
npm run dev
```

**Expected output:**
```
VITE v4.5.14  ready in 188 ms

➜  Local:   http://localhost:5173/
➜  Network: http://172.20.10.2:5173/
```

### 2. Browser Access

**Try accessing:**
- Primary: `http://localhost:5173`
- Alternative: `http://127.0.0.1:5173`
- Network (if available): Check the Network URL from the terminal output

### 3. Clear Browser Cache

**Chrome/Edge:**
1. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) for hard refresh
2. Or press `F12` → Network tab → Disable cache → Refresh

**Firefox:**
1. Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Or clear cache via Developer Tools

### 4. Check Browser Console

**Open Developer Tools (`F12`) and check for errors:**

**Common issues and solutions:**

1. **CORS Error:**
   ```
   Access to fetch at '...' from origin 'http://localhost:5173' has been blocked by CORS policy
   ```
   **Solution:** The proxy should handle this. Restart the dev server.

2. **Network Error:**
   ```
   Failed to fetch
   ```
   **Solution:** Check if you're connected to the internet and the API server is accessible.

3. **TypeError: NetworkError:**
   ```
   TypeError: NetworkError when attempting to fetch resource
   ```
   **Solution:** Try disabling browser extensions or use incognito mode.

### 5. Port Conflicts

**If port 5173 is busy:**
```bash
# Kill any process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### 6. Firewall/Antivirus

**Check if your firewall or antivirus is blocking the connection:**
- Temporarily disable firewall/antivirus
- Add localhost:5173 to allowed list
- Try accessing from incognito/private browsing mode

### 7. API Connection Test

**Test API connectivity:**

**Method 1: Browser Console**
```javascript
// Paste this in browser console on http://localhost:5173
fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin+4@church.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log)
```

**Method 2: Command Line**
```bash
# Test direct API
curl -X POST http://localhost:5173/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin+4@church.com", "password": "password123"}'
```

### 8. Environment Variables

**Check .env file:**
```bash
cat .env
```

**Should contain:**
```
VITE_API_BASE_URL=https://ppt-crm-be.onrender.com/api/v1
VITE_APP_NAME=Church Management System
```

### 9. Network Configuration

**If you're on a corporate network:**
- Check if proxy settings are interfering
- Try using mobile hotspot
- Contact IT department about port 5173 access

### 10. Alternative Solutions

**Option A: Use different network:**
- Switch to mobile hotspot
- Try different WiFi network

**Option B: Use different port:**
```bash
npm run dev -- --port 3000
# Then access via http://localhost:3000
```

**Option C: Use the Network URL:**
- Use the Network URL shown in terminal (e.g., `http://172.20.10.2:5173/`)
- This bypasses some localhost restrictions

## Test Credentials

**For testing the application:**
- **Email:** admin+4@church.com
- **Password:** password123

## Get Help

If none of these solutions work:

1. **Check the browser's Network tab** in Developer Tools to see the exact error
2. **Look at the terminal** where `npm run dev` is running for any error messages
3. **Try a different browser** (Chrome, Firefox, Safari, Edge)
4. **Restart your computer** as a last resort

## Working Confirmation

**When everything is working, you should see:**
- ✅ Development server running on http://localhost:5173
- ✅ Login page loads with test credentials shown
- ✅ No console errors in browser
- ✅ Yellow development mode indicator in bottom-right corner
- ✅ Successful login redirects to dashboard

## API Status

**Current API Configuration:**
- **Base URL:** https://ppt-crm-be.onrender.com/api/v1
- **Proxy:** Enabled for development
- **CORS:** Handled by proxy
- **Timeout:** 30 seconds
- **Status:** ✅ Working (last tested: 2025-10-06)