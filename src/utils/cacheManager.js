// Cache Manager Utility
class CacheManager {
  constructor() {
    this.version = '1.0.1';
    this.storageKey = 'jaja_app_version';
    this.lastUpdateKey = 'jaja_last_update';
  }

  // Check if app needs to be refreshed
  checkForUpdates() {
    const currentVersion = this.getCurrentVersion();
    const storedVersion = this.getStoredVersion();
    
    if (currentVersion !== storedVersion) {
      console.log('New version detected:', currentVersion);
      this.clearAllCaches();
      this.updateStoredVersion(currentVersion);
      return true;
    }
    
    return false;
  }

  // Get current app version
  getCurrentVersion() {
    // You can update this version number when you deploy
    return this.version;
  }

  // Get stored version from localStorage
  getStoredVersion() {
    return localStorage.getItem(this.storageKey) || '0.0.0';
  }

  // Update stored version
  updateStoredVersion(version) {
    localStorage.setItem(this.storageKey, version);
    localStorage.setItem(this.lastUpdateKey, new Date().toISOString());
  }

  // Clear all caches
  async clearAllCaches() {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      }

      // Clear localStorage (optional - be careful with this)
      // localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Force reload if service worker is available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('Service worker unregistered');
        }
      }

      return true;
    } catch (error) {
      console.error('Error clearing caches:', error);
      return false;
    }
  }

  // Force refresh the page
  forceRefresh() {
    // Clear caches first
    this.clearAllCaches().then(() => {
      // Force reload
      window.location.reload(true);
    });
  }

  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, ask user to refresh
              this.showUpdateNotification();
            }
          });
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Show update notification
  showUpdateNotification() {
    if (window.Swal) {
      window.Swal.fire({
        title: 'Update Available',
        text: 'A new version is available. Would you like to refresh?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Refresh Now',
        cancelButtonText: 'Later',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      }).then((result) => {
        if (result.isConfirmed) {
          this.forceRefresh();
        }
      });
    } else {
      // Fallback if SweetAlert is not available
      if (confirm('A new version is available. Would you like to refresh?')) {
        this.forceRefresh();
      }
    }
  }

  // Initialize cache management
  async init() {
    // Check for updates on app start
    const needsUpdate = this.checkForUpdates();
    
    if (needsUpdate) {
      console.log('App updated, clearing caches...');
    }

    // Register service worker only in production
    if (import.meta.env.PROD) {
      await this.registerServiceWorker();
    }

    // Set up periodic cache check (every 5 minutes)
    setInterval(() => {
      this.checkForUpdates();
    }, 5 * 60 * 1000);
  }

  // Manual cache clear method (can be called from UI)
  async clearCache() {
    const success = await this.clearAllCaches();
    if (success) {
      console.log('Cache cleared successfully');
      // Show success message
      if (window.Swal) {
        window.Swal.fire({
          title: 'Success',
          text: 'Cache cleared successfully',
          icon: 'success',
          timer: 2000
        });
      }
    }
    return success;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;

