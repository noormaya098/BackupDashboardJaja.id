# Cache Management System

Sistem ini dirancang untuk mengatasi masalah cache yang menyebabkan user masih melihat data lama setelah ada update.

## Fitur Utama

### 1. Automatic Cache Busting
- Setiap build akan menghasilkan file dengan hash unik
- Browser akan otomatis mendownload file baru ketika ada update

### 2. Service Worker
- Mengelola cache secara otomatis
- Membersihkan cache lama ketika ada update
- Memberikan notifikasi update ke user

### 3. Version Management
- Sistem versioning otomatis
- Deteksi update berdasarkan version number
- Force refresh ketika ada version baru

### 4. Manual Cache Control
- Tombol untuk clear cache manual
- Tombol untuk force refresh
- Dapat diakses dari dashboard

## Cara Penggunaan

### Untuk Developer

1. **Build dengan cache busting:**
   ```bash
   npm run build:force
   ```

2. **Update version dan build:**
   ```bash
   npm run version:patch  # untuk patch update
   npm run version:minor  # untuk minor update
   npm run version:major  # untuk major update
   ```

3. **Deploy:**
   - Upload semua file di folder `dist/`
   - Pastikan file `.htaccess` ikut ter-upload

### Untuk User

1. **Automatic Update:**
   - Sistem akan otomatis mendeteksi update
   - User akan mendapat notifikasi untuk refresh
   - Cache akan dibersihkan otomatis

2. **Manual Clear Cache:**
   - Klik tombol "Clear Cache" di dashboard
   - Atau tekan Ctrl+Shift+R (hard refresh)

## Konfigurasi

### 1. Vite Configuration (`vite.config.js`)
```javascript
build: {
  rollupOptions: {
    output: {
      entryFileNames: 'assets/[name]-[hash].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]'
    }
  }
}
```

### 2. Cache Manager (`src/utils/cacheManager.js`)
- Ubah `this.version` untuk update version
- Atau gunakan script `npm run version:*`

### 3. Service Worker (`public/sw.js`)
- Mengelola cache secara otomatis
- Membersihkan cache lama
- Memberikan notifikasi update

## Troubleshooting

### Jika user masih melihat data lama:

1. **Cek version:**
   ```javascript
   console.log('Current version:', cacheManager.getCurrentVersion());
   console.log('Stored version:', cacheManager.getStoredVersion());
   ```

2. **Force clear cache:**
   ```javascript
   cacheManager.clearAllCaches();
   ```

3. **Hard refresh:**
   - Tekan Ctrl+Shift+R (Windows/Linux)
   - Tekan Cmd+Shift+R (Mac)

### Jika build tidak update:

1. **Clean build:**
   ```bash
   npm run build:force
   ```

2. **Clear node_modules:**
   ```bash
   rm -rf node_modules
   npm install
   npm run build:force
   ```

## Monitoring

### Log Cache Activity:
- Buka Developer Tools > Console
- Lihat log dari service worker
- Monitor cache hit/miss

### Check Version:
```javascript
// Di browser console
cacheManager.getCurrentVersion();
cacheManager.getStoredVersion();
```

## Best Practices

1. **Selalu gunakan `build:force` untuk production**
2. **Update version setiap kali ada perubahan penting**
3. **Test di browser incognito untuk memastikan tidak ada cache**
4. **Monitor console untuk error cache**

## File yang Terlibat

- `vite.config.js` - Konfigurasi build
- `src/utils/cacheManager.js` - Cache management utility
- `public/sw.js` - Service worker
- `src/widgets/cache/CacheControl.jsx` - UI control
- `public/.htaccess` - Server cache headers
- `scripts/update-cache-version.js` - Version update script

