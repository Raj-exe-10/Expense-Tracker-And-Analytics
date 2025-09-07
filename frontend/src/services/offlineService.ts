// Offline Service for managing offline functionality
import { store } from '../store';

class OfflineService {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  
  constructor() {
    this.initDB();
    this.setupEventListeners();
    this.registerServiceWorker();
  }
  
  private async initDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('ExpenseTrackerDB', 1);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('pendingExpenses')) {
          const expenseStore = db.createObjectStore('pendingExpenses', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          expenseStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { 
            keyPath: 'key' 
          });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          queueStore.createIndex('type', 'type', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }
  
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                this.notifyUpdate();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  private handleOnline() {
    this.isOnline = true;
    console.log('Back online - syncing data...');
    this.syncOfflineData();
    this.notifyOnlineStatus(true);
  }
  
  private handleOffline() {
    this.isOnline = false;
    console.log('Gone offline - switching to offline mode');
    this.notifyOnlineStatus(false);
  }
  
  private notifyOnlineStatus(online: boolean) {
    // Dispatch action to update Redux store
    store.dispatch({
      type: 'app/setOnlineStatus',
      payload: online
    });
    
    // Show notification
    if (online) {
      this.showNotification('Back online', 'Your data is being synced');
    } else {
      this.showNotification('Offline mode', 'Your changes will be saved locally');
    }
  }
  
  private notifyUpdate() {
    if (window.confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  }
  
  private showNotification(title: string, message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  }
  
  // Public methods for offline data management
  
  async saveOfflineExpense(expenseData: any) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['pendingExpenses'], 'readwrite');
    const store = transaction.objectStore('pendingExpenses');
    
    const data = {
      ...expenseData,
      timestamp: Date.now(),
      token: localStorage.getItem('access_token')
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getPendingExpenses(): Promise<any[]> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['pendingExpenses'], 'readonly');
    const store = transaction.objectStore('pendingExpenses');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async cacheData(key: string, data: any) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getCachedData(key: string): Promise<any> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (24 hours)
          const isValid = Date.now() - result.timestamp < 24 * 60 * 60 * 1000;
          resolve(isValid ? result.data : null);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async queueAction(type: string, action: any) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    
    const queueItem = {
      type,
      action,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getQueuedActions(type?: string): Promise<any[]> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async clearQueue(ids?: number[]) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    
    if (ids) {
      // Clear specific items
      const promises = ids.map(id => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      });
      return Promise.all(promises);
    } else {
      // Clear all
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
  }
  
  async syncOfflineData() {
    if (!this.isOnline) return;
    
    try {
      // Sync pending expenses
      const pendingExpenses = await this.getPendingExpenses();
      
      for (const expense of pendingExpenses) {
        try {
          const response = await fetch('/api/expenses/expenses/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${expense.token}`
            },
            body: JSON.stringify(expense)
          });
          
          if (response.ok) {
            // Remove from pending queue
            await this.removePendingExpense(expense.id);
          }
        } catch (error) {
          console.error('Failed to sync expense:', error);
        }
      }
      
      // Sync other queued actions
      const queuedActions = await this.getQueuedActions();
      const successfulIds: number[] = [];
      
      for (const item of queuedActions) {
        try {
          // Process based on action type
          await this.processQueuedAction(item);
          successfulIds.push(item.id);
        } catch (error) {
          console.error('Failed to process queued action:', error);
        }
      }
      
      // Clear successful actions
      if (successfulIds.length > 0) {
        await this.clearQueue(successfulIds);
      }
      
      this.showNotification('Sync complete', 'All offline changes have been synced');
    } catch (error) {
      console.error('Sync failed:', error);
      this.showNotification('Sync failed', 'Some changes could not be synced');
    }
  }
  
  private async removePendingExpense(id: number) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['pendingExpenses'], 'readwrite');
    const store = transaction.objectStore('pendingExpenses');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
  
  private async processQueuedAction(item: any) {
    // Process different types of queued actions
    switch (item.type) {
      case 'UPDATE_EXPENSE':
        return this.syncUpdateExpense(item.action);
      case 'DELETE_EXPENSE':
        return this.syncDeleteExpense(item.action);
      case 'CREATE_GROUP':
        return this.syncCreateGroup(item.action);
      default:
        console.warn('Unknown action type:', item.type);
    }
  }
  
  private async syncUpdateExpense(action: any) {
    const response = await fetch(`/api/expenses/expenses/${action.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(action.data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update expense');
    }
    
    return response.json();
  }
  
  private async syncDeleteExpense(action: any) {
    const response = await fetch(`/api/expenses/expenses/${action.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
  }
  
  private async syncCreateGroup(action: any) {
    const response = await fetch('/api/groups/groups/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(action.data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create group');
    }
    
    return response.json();
  }
  
  // Check if app can work offline
  isOfflineCapable(): boolean {
    return 'serviceWorker' in navigator && 'indexedDB' in window;
  }
  
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
  
  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
export default offlineService;
