# Railway Persistent Volume Setup Guide

This guide shows you how to add a persistent volume in Railway to store your SQLite database files.

## Why You Need a Persistent Volume

Without a persistent volume, your SQLite database files will be lost every time Railway redeploys your application. A persistent volume ensures your data survives deployments and restarts.

## Step-by-Step Instructions

### 1. Open Your Service in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your project
3. Click on your service (the one running your application)

### 2. Navigate to Volumes

1. Click on the **"Settings"** tab (gear icon) in your service
2. Scroll down to the **"Volumes"** section
3. You'll see a section that says "No volumes attached" (if you haven't added any yet)

### 3. Add a New Volume

1. Click the **"+ Add Volume"** button (or **"New Volume"** button)
2. A dialog will appear asking for volume configuration

### 4. Configure the Volume

Fill in the following:

- **Mount Path**: `/app/backend/data`
  - This is where the volume will be mounted in your container
  - Your database files will be stored here

- **Volume Name**: (Optional) Give it a name like `nft-database` or `app-data`
  - Railway will auto-generate a name if you leave it blank

### 5. Create the Volume

1. Click **"Add"** or **"Create"** button
2. Railway will create and attach the volume
3. You should see the volume listed in the Volumes section

### 6. Verify the Volume

After adding the volume:
- The volume should appear in the list with the mount path `/app/backend/data`
- Railway will automatically mount it when your service starts

## Important Notes

### Volume Path in Your Code

Your `DATABASE_PATH` environment variable should point to a path **inside** the mounted volume:

```env
DATABASE_PATH=./data/nft-collection.db
```

This works because:
- Railway mounts the volume at `/app/backend/data`
- Your backend runs from `/app/backend/`
- So `./data/nft-collection.db` resolves to `/app/backend/data/nft-collection.db` ✅

### Alternative: Absolute Path

You can also use an absolute path:

```env
DATABASE_PATH=/app/backend/data/nft-collection.db
```

Both work, but the relative path (`./data/nft-collection.db`) is recommended.

## Visual Guide

```
Railway Service
├── Code: /app/
│   ├── backend/
│   │   ├── dist/          (compiled code)
│   │   ├── frontend-dist/ (frontend files)
│   │   └── data/          ← Volume mounted here
│   │       └── nft-collection.db
│   └── ...
└── Volume: /app/backend/data (persistent storage)
```

## Troubleshooting

### Volume Not Appearing

1. **Check service settings**: Make sure you're in the correct service
2. **Refresh the page**: Sometimes the UI needs a refresh
3. **Check permissions**: Ensure you have admin access to the project

### Database Still Not Persisting

1. **Verify mount path**: Check that the volume is mounted at `/app/backend/data`
2. **Check environment variable**: Ensure `DATABASE_PATH=./data/nft-collection.db`
3. **Check logs**: Look for database path in application logs
4. **Verify directory exists**: The `data` directory should be created automatically

### Volume Size

- Railway volumes start small and grow as needed
- You're charged for storage used
- SQLite databases are typically small (MB to GB range)

## Testing the Volume

After adding the volume:

1. **Redeploy your service** (or it will use the volume on next restart)
2. **Create some data** in your application
3. **Redeploy again** - your data should persist!

## Cost

- Railway volumes are charged based on storage used
- Small databases (under 1GB) are very affordable
- Check Railway's pricing page for current rates

## Next Steps

After setting up the volume:

1. ✅ Verify `DATABASE_PATH` environment variable is set correctly
2. ✅ Redeploy your service to use the volume
3. ✅ Test that data persists across deployments
4. ✅ Monitor volume usage in Railway dashboard

## Additional Resources

- [Railway Volumes Documentation](https://docs.railway.app/storage/volumes)
- [Railway Pricing](https://railway.app/pricing)
