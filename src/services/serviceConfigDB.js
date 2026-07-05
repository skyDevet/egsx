// ============================================================
// serviceConfigDB.js - Complete IndexedDB Storage for Service Configs
// ============================================================

const DB_NAME = 'NLPProcessorDB';
const DB_VERSION = 1;
const STORE_NAME = 'serviceConfigs';
const VERSION_STORE = 'versions';

class ServiceConfigDB {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return true;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        console.log('Database initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('serviceId', 'serviceId', { unique: false });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('isActive', 'isActive', { unique: false });
          store.createIndex('version', 'version', { unique: false });
        }

        if (!db.objectStoreNames.contains(VERSION_STORE)) {
          db.createObjectStore(VERSION_STORE, { keyPath: 'id' });
        }

        console.log('Database stores created successfully');
      };
    });
  }

  getTransaction(storeNames, mode = 'readonly') {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.transaction(storeNames, mode);
  }

  async saveServiceConfig(config) {
    await this.init();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const now = new Date().toISOString();
        const configToSave = {
          ...config,
          createdAt: config.createdAt || now,
          updatedAt: now,
          isActive: config.isActive !== undefined ? config.isActive : true,
          version: (config.version || 0) + 1
        };

        if (!configToSave.id) {
          configToSave.id = `${configToSave.serviceId}_${Date.now()}`;
        }

        const request = store.put(configToSave);

        request.onsuccess = () => {
          console.log(`Service config saved: ${configToSave.id}`);
          this.updateVersion(configToSave.serviceId, configToSave.version).catch(console.error);
          resolve(configToSave);
        };

        request.onerror = (event) => {
          console.error('Error saving config:', event.target.error);
          reject(event.target.error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async updateVersion(serviceId, version) {
    const transaction = this.getTransaction([VERSION_STORE], 'readwrite');
    const store = transaction.objectStore(VERSION_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put({
        id: `version_${serviceId}`,
        serviceId,
        version,
        updatedAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getServiceConfig(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = (event) => {
          console.error('Error getting config:', event.target.error);
          reject(event.target.error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async getAllServiceConfigs(includeInactive = false) {
    await this.init();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          let results = request.result || [];
          if (!includeInactive) {
            results = results.filter(config => config.isActive !== false);
          }
          resolve(results);
        };

        request.onerror = (event) => {
          console.error('Error getting configs:', event.target.error);
          reject(event.target.error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async getServiceConfigsByServiceId(serviceId, includeInactive = false) {
    await this.init();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('serviceId');
        const request = index.getAll(serviceId);

        request.onsuccess = () => {
          let results = request.result || [];
          if (!includeInactive) {
            results = results.filter(config => config.isActive !== false);
          }
          resolve(results);
        };

        request.onerror = (event) => {
          console.error('Error getting configs by serviceId:', event.target.error);
          reject(event.target.error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async getLatestServiceConfig(serviceId) {
    const configs = await this.getServiceConfigsByServiceId(serviceId);
    if (configs.length === 0) return null;
    configs.sort((a, b) => (b.version || 0) - (a.version || 0));
    return configs[0];
  }

  async getActiveServiceConfigs() {
    return this.getAllServiceConfigs(false);
  }

  async updateServiceConfig(id, updates) {
    await this.init();

    const existing = await this.getServiceConfig(id);
    if (!existing) {
      throw new Error(`Service config with ID ${id} not found`);
    }

    const updatedConfig = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
      version: (existing.version || 0) + 1
    };

    return this.saveServiceConfig(updatedConfig);
  }

  async deleteServiceConfig(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log(`Service config deleted: ${id}`);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error('Error deleting config:', event.target.error);
          reject(event.target.error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async deactivateServiceConfig(id) {
    return this.updateServiceConfig(id, { isActive: false });
  }

  async activateServiceConfig(id) {
    return this.updateServiceConfig(id, { isActive: true });
  }

  async searchServiceConfigs(searchTerm) {
    await this.init();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result || [];
          const searchLower = searchTerm.toLowerCase();
          
          const filtered = results.filter(config => {
            const nameMatch = config.name && typeof config.name === 'object' 
              ? (config.name.en || '').toLowerCase().includes(searchLower) || 
                (config.name.am || '').toLowerCase().includes(searchLower)
              : (config.name || '').toLowerCase().includes(searchLower);
            
            const descMatch = config.description && typeof config.description === 'object'
              ? (config.description.en || '').toLowerCase().includes(searchLower) ||
                (config.description.am || '').toLowerCase().includes(searchLower)
              : (config.description || '').toLowerCase().includes(searchLower);
            
            const idMatch = (config.serviceId || '').toLowerCase().includes(searchLower);
            
            return nameMatch || descMatch || idMatch;
          });

          resolve(filtered);
        };

        request.onerror = (event) => {
          console.error('Error searching configs:', event.target.error);
          reject(event.target.error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async exportServiceConfigs() {
    const configs = await this.getAllServiceConfigs(true);
    return JSON.stringify(configs, null, 2);
  }

  async importServiceConfigs(jsonData) {
    try {
      const configs = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!Array.isArray(configs)) {
        throw new Error('Invalid data format. Expected array of configurations.');
      }

      const results = [];
      for (const config of configs) {
        const saved = await this.saveServiceConfig(config);
        results.push(saved);
      }

      return results;
    } catch (error) {
      console.error('Error importing configs:', error);
      throw error;
    }
  }

  async clearAllServiceConfigs() {
    await this.init();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('All service configs cleared');
          resolve(true);
        };

        request.onerror = (event) => {
          console.error('Error clearing configs:', event.target.error);
          reject(event.target.error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async getStats() {
    const configs = await this.getAllServiceConfigs(true);
    const active = configs.filter(c => c.isActive !== false);
    const byService = {};
    
    configs.forEach(c => {
      if (!byService[c.serviceId]) {
        byService[c.serviceId] = 0;
      }
      byService[c.serviceId]++;
    });

    return {
      totalConfigs: configs.length,
      activeConfigs: active.length,
      inactiveConfigs: configs.length - active.length,
      byService,
      lastUpdated: configs.reduce((latest, c) => {
        const date = new Date(c.updatedAt);
        return date > latest ? date : latest;
      }, new Date(0))
    };
  }
}

let dbInstance = null;

export async function getServiceConfigDB() {
  if (!dbInstance) {
    dbInstance = new ServiceConfigDB();
    await dbInstance.init();
  }
  return dbInstance;
}

// ============================================================
// HELPER FUNCTIONS FOR BILINGUAL DATA - ALL EXPORTED PROPERLY
// ============================================================

export function getLocalized(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj !== null) {
    try {
      const lang = localStorage.getItem('agig_language') === 'am' ? 'am' : 'en';
      const result = obj[lang];
      if (result !== undefined && result !== null && result !== '') {
        return result;
      }
      return obj.en || '';
    } catch (e) {
      return obj.en || '';
    }
  }
  return obj;
}

export function dbConfigToNLPFormat(dbConfig) {
  if (!dbConfig) return null;

  return {
    id: dbConfig.serviceId,
    name: dbConfig.name,
    description: dbConfig.description,
    initStep: dbConfig.initStep || 1,
    collectedData: dbConfig.collectedData || {},
    steps: dbConfig.steps || {},
    _metadata: {
      version: dbConfig.version,
      createdAt: dbConfig.createdAt,
      updatedAt: dbConfig.updatedAt
    }
  };
}

export function nlpServiceToDBFormat(serviceConfig, customId = null) {
  if (!serviceConfig) return null;

  // Ensure bilingual format for name and description
  const name = typeof serviceConfig.name === 'string' 
    ? { en: serviceConfig.name, am: serviceConfig.name }
    : serviceConfig.name || { en: '', am: '' };
  
  const description = typeof serviceConfig.description === 'string'
    ? { en: serviceConfig.description, am: serviceConfig.description }
    : serviceConfig.description || { en: '', am: '' };

  return {
    id: customId || `${serviceConfig.id}_${Date.now()}`,
    serviceId: serviceConfig.id,
    name: name,
    description: description,
    initStep: serviceConfig.initStep || 1,
    collectedData: serviceConfig.collectedData || {},
    steps: serviceConfig.steps || {},
    isActive: true,
    version: 1
  };
}

export async function fetchServiceConfig(serviceId, useLatestVersion = true) {
  try {
    const db = await getServiceConfigDB();
    
    let dbConfig;
    if (useLatestVersion) {
      dbConfig = await db.getLatestServiceConfig(serviceId);
    } else {
      const configs = await db.getServiceConfigsByServiceId(serviceId);
      dbConfig = configs.length > 0 ? configs[0] : null;
    }

    if (!dbConfig) {
      console.warn(`No config found for service: ${serviceId}`);
      return null;
    }

    return dbConfigToNLPFormat(dbConfig);
  } catch (error) {
    console.error(`Error fetching service config for ${serviceId}:`, error);
    return null;
  }
}

class ServiceConfigCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  async get(serviceId) {
    const cached = this.cache.get(serviceId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  set(serviceId, data) {
    this.cache.set(serviceId, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  invalidate(serviceId) {
    this.cache.delete(serviceId);
  }
}

const configCache = new ServiceConfigCache();

export async function fetchServiceConfigWithCache(serviceId, useLatestVersion = true) {
  const cached = await configCache.get(serviceId);
  if (cached) {
    console.log(`Using cached config for: ${serviceId}`);
    return cached;
  }

  const config = await fetchServiceConfig(serviceId, useLatestVersion);
  if (config) {
    configCache.set(serviceId, config);
  }

  return config;
}

export async function updateServiceConfig(serviceId, updatedConfig) {
  try {
    const db = await getServiceConfigDB();
    const dbConfig = nlpServiceToDBFormat(updatedConfig);
    const saved = await db.saveServiceConfig(dbConfig);
    configCache.invalidate(serviceId);
    return saved;
  } catch (error) {
    console.error(`Error updating service config for ${serviceId}:`, error);
    throw error;
  }
}

// DEFAULT EXPORT WITH ALL FUNCTIONS
export default {
  getServiceConfigDB,
  fetchServiceConfig,
  fetchServiceConfigWithCache,
  updateServiceConfig,
  dbConfigToNLPFormat,
  nlpServiceToDBFormat,
  getLocalized
};