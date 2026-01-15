# Railway Build Fix: Cannot find module '/app/backend/dist/main'

## Problem

The application crashes on startup with:
```
Error: Cannot find module '/app/backend/dist/main'
```

## Root Causes

1. **Build might be failing silently** - If frontend build fails, backend build might not complete
2. **Working directory issue** - Start command might run from wrong directory
3. **Missing file extension** - Should be `main.js` not `main`

## Fixes Applied

### 1. Fixed Start Command
**Changed:** `backend/package.json`
- **Before:** `"start:prod": "node dist/main"`
- **After:** `"start:prod": "node dist/main.js"`

### 2. Added Build Verification
**Changed:** `nixpacks.toml`
- Added verification step to check if `backend/dist/main.js` exists after build
- Build will fail early if file is missing

### 3. Fixed Start Command Directory
**Changed:** `nixpacks.toml`
- **Before:** `cmd = "npm run start:prod"`
- **After:** `cmd = "cd /app && npm run start:prod"`
- Ensures we're in the project root when starting

## Build Process Flow

1. **Install dependencies** (root, frontend, backend)
2. **Build frontend** → Creates `frontend/dist/`
3. **Build backend** → Creates `backend/dist/main.js`
4. **Copy frontend** → Copies to `backend/frontend-dist/`
5. **Verify build** → Checks that `backend/dist/main.js` exists
6. **Start** → Runs from `/app` directory

## Troubleshooting

### If Build Still Fails

1. **Check Railway build logs:**
   - Look for errors in frontend build
   - Look for errors in backend build
   - Check if verification step passes

2. **Common Issues:**

   **Frontend build fails:**
   - Check `frontend/package.json` dependencies
   - Verify Node.js version compatibility
   - Check for TypeScript errors

   **Backend build fails:**
   - Check `backend/package.json` dependencies
   - Verify NestJS CLI is installed
   - Check for TypeScript compilation errors

   **Copy step fails:**
   - Verify `scripts/copy-frontend.js` exists
   - Check that `frontend/dist/` exists after frontend build

3. **Manual Verification:**

   You can test the build locally:
   ```bash
   npm run build
   ls backend/dist/main.js  # Should exist
   ```

### If Start Still Fails

1. **Check working directory:**
   - Railway should start from `/app`
   - The start command does `cd /app && npm run start:prod`
   - Which then does `cd backend && node dist/main.js`

2. **Verify file exists:**
   - Check Railway logs to see if file exists
   - The verification step should catch this during build

3. **Check file permissions:**
   - Files should be executable
   - Railway handles this automatically

## Next Steps

1. ✅ Commit and push these changes
2. ✅ Railway will rebuild automatically
3. ✅ Check build logs to verify all steps pass
4. ✅ Application should start successfully

## Alternative: Direct Start Command

If issues persist, you can set Railway's start command directly to:
```
cd /app/backend && node dist/main.js
```

But the current setup should work with the fixes applied.
