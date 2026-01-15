# Build Fix: vue-tsc Compatibility Issue

## Problem

The build was failing with:
```
Search string not found: "/supportedTSExtensions = .*(?=;)/"
```

This is a compatibility issue between `vue-tsc` v1.8.3 and newer TypeScript/Node.js versions used by Railway.

## Solution

Two changes were made:

### 1. Removed Type Checking from Production Build

**Changed:** `frontend/package.json`
- **Before:** `"build": "vue-tsc && vite build"`
- **After:** `"build": "vite build"`

**Why:** 
- Type checking is slower and can have compatibility issues
- Production builds should be fast and reliable
- Type checking is still available via `npm run type-check` for development

### 2. Updated vue-tsc Version

**Changed:** `frontend/package.json`
- **Before:** `"vue-tsc": "^1.8.3"`
- **After:** `"vue-tsc": "^2.0.0"`

**Why:**
- Newer version has better compatibility with modern TypeScript/Node.js
- Still available for development type checking

## Available Scripts

- `npm run build` - Fast production build (no type checking)
- `npm run build:check` - Production build with type checking (slower)
- `npm run type-check` - Type check only (no build)

## For Development

You can still type-check your code:
```bash
cd frontend
npm run type-check
```

Or use the IDE's built-in TypeScript checking.

## Next Steps

1. ✅ Commit and push these changes
2. ✅ Railway will rebuild automatically
3. ✅ Build should now succeed

## Alternative Solutions (if needed)

If you still encounter issues:

1. **Pin Node.js version** in `nixpacks.toml`:
   ```toml
   [phases.setup]
   nixPkgs = ["nodejs_18"]  # Use Node 18 instead of 20
   ```

2. **Skip type checking entirely** (already done):
   - Production builds now skip type checking
   - Type checking available separately for development

3. **Use different TypeScript checker**:
   - Could use `tsc --noEmit` instead of `vue-tsc`
   - But `vue-tsc` is better for Vue 3 projects
