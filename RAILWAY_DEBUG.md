# Railway Debugging Guide

## Current Issue

Error: `Cannot find module '/app/backend/dist/main'`

## Possible Causes

1. **Backend build not completing** - The `nest build` command might be failing
2. **File doesn't exist** - `dist/main.js` might not be created
3. **Cached package.json** - Railway might be using old version
4. **Workspace detection** - Railway might be starting backend workspace directly

## Debugging Steps

### 1. Check Build Logs in Railway

Look for these in the build phase:
- `Building frontend...` - Should complete successfully
- `Building backend...` - Should complete successfully  
- `Copying frontend...` - Should complete successfully
- `Verifying build...` - Should show `✓ backend/dist/main.js exists`
- If you see `✗ ERROR: backend/dist/main.js not found!` - Build failed

### 2. Check What Files Exist

The build verification step will list files in `backend/dist/` if main.js is missing:
```bash
ls -la backend/dist/
```

### 3. Verify Backend Build

The backend build uses NestJS CLI:
```bash
cd backend
npm run build  # Runs "nest build"
```

This should create:
- `backend/dist/main.js`
- `backend/dist/app.module.js`
- Other compiled files

### 4. Check NestJS Configuration

Verify `backend/nest-cli.json`:
```json
{
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

### 5. Check TypeScript Configuration

Verify `backend/tsconfig.json` has correct `outDir`:
```json
{
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

## Solutions

### Solution 1: Ensure Build Completes

The updated `nixpacks.toml` now:
1. Builds frontend explicitly
2. Builds backend explicitly
3. Copies frontend
4. Verifies `backend/dist/main.js` exists
5. Fails if verification doesn't pass

### Solution 2: Explicit Start Command

Updated `railway.json` to use:
```json
"startCommand": "cd /app && npm run start:prod"
```

This ensures we're in the project root.

### Solution 3: Check for Build Errors

If backend build fails, common causes:
- Missing dependencies
- TypeScript errors
- NestJS CLI not installed
- Out of memory during build

## Manual Testing

Test the build locally:
```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Build
npm run build

# Verify
ls -la backend/dist/main.js  # Should exist

# Test start
npm run start:prod
```

## Railway-Specific Issues

### Workspace Detection

Railway might detect `backend` as a separate workspace. To prevent this:
- Ensure `railway.json` is in the root
- Use explicit start command in `railway.json`
- Don't set root directory to `backend/` in Railway settings

### Build Cache

Railway caches builds. To clear:
1. Go to Railway dashboard
2. Service → Settings → Clear build cache
3. Redeploy

### Environment Variables

Ensure these are set:
- `NODE_ENV=production`
- `PORT` (Railway sets automatically)
- `GALACHAIN_API`
- `DATABASE_PATH=./data/nft-collection.db`

## Next Steps

1. ✅ Check Railway build logs for the verification step
2. ✅ Look for any build errors
3. ✅ Verify `backend/dist/main.js` exists after build
4. ✅ Check if start command is using correct path

## If Still Failing

Try setting Railway's start command directly in the dashboard:
```
cd /app/backend && node dist/main.js
```

But first, ensure the build is actually creating the file!
