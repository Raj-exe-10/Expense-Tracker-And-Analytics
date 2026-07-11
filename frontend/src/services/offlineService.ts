// Offline Service for managing offline functionality
import { store } from '../store';
import { tokenStorage } from '../utils/storage';

class OfflineService {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInFlight: Promise<void> | null = null;
  
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
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
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
    store.dispatch({
      type: 'app/setOnlineStatus',
      payload: online
    });
    
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
    
    // Do NOT persist the token — read it at sync time
    const { token: _omit, ...safeData } = expenseData;
    const data = {
      ...safeData,
      timestamp: Date.now(),
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
      const promises = ids.map(id => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      });
      return Promise.all(promises);
    } else {
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
  }
  
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline) return;

    // Mutex: share one in-flight sync promise across concurrent callers
    if (this.syncInFlight) {
      return this.syncInFlight;
    }

    this.syncInFlight = this._doSync().finally(() => {
      this.syncInFlight = null;
    });

    return this.syncInFlight;
  }

  private async _doSync(): Promise<void> {
    let allSucceeded = true;

    try {
      const pendingExpenses = await this.getPendingExpenses();
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      // Read token at sync time — never from the stored pending items
      const token = tokenStorage.getAccessToken() || '';

      const items = pendingExpenses.map((expense: any) => ({
        id: expense.server_id,
        base_version: expense.base_version,
        data: expense.data || expense,
      }));

      if (items.length > 0) {
        const response = await fetch(`${base}/api/expenses/sync/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.conflicts?.length) {
            window.dispatchEvent(
              new CustomEvent('ledgercore:sync-conflict', { detail: { conflicts: result.conflicts } })
            );
          }
          // Remove pending rows that were applied. Match updates by server_id;
          // match creates (no server_id) to applied IDs that are not existing server_ids.
          const appliedIds = (result.applied || []).map(String);
          const knownServerIds = new Set(
            pendingExpenses.filter((e: any) => e.server_id).map((e: any) => String(e.server_id))
          );
          const appliedCreates = appliedIds.filter((id: string) => !knownServerIds.has(id));
          let createIdx = 0;
          for (const pending of pendingExpenses) {
            if (pending.server_id && appliedIds.includes(String(pending.server_id))) {
              await this.removePendingExpense(pending.id);
            } else if (!pending.server_id && createIdx < appliedCreates.length) {
              await this.removePendingExpense(pending.id);
              createIdx += 1;
            }
          }
        } else {
          allSucceeded = false;
        }
      }

      // Sync other queued actions (no re-POST of the batch items above)
      const queuedActions = await this.getQueuedActions();
      const successfulIds: number[] = [];
      
      for (const item of queuedActions) {
        try {
          await this.processQueuedAction(item);
          successfulIds.push(item.id);
        } catch (error) {
          console.error('Failed to process queued action:', error);
          allSucceeded = false;
        }
      }
      
      if (successfulIds.length > 0) {
        await this.clearQueue(successfulIds);
      }
      
      if (allSucceeded) {
        this.showNotification('Sync complete', 'All offline changes have been synced');
      } else {
        this.showNotification('Partial sync', 'Some changes could not be synced and will retry later');
      }
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
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const response = await fetch(`${base}/api/expenses/expenses/${action.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`
      },
      body: JSON.stringify(action.data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update expense');
    }
    
    return response.json();
  }
  
  private async syncDeleteExpense(action: any) {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const response = await fetch(`${base}/api/expenses/expenses/${action.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
  }
  
  private async syncCreateGroup(action: any) {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const response = await fetch(`${base}/api/groups/groups/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`
      },
      body: JSON.stringify(action.data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create group');
    }
    
    return response.json();
  }
  
  isOfflineCapable(): boolean {
    return 'serviceWorker' in navigator && 'indexedDB' in window;
  }
  
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
  
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
}

export const offlineService = new OfflineService();
export default offlineService;
