// ============================================================
// serviceConfigAdmin.js - Complete Admin Interface
// ============================================================

import { 
  getServiceConfigDB, 
  fetchServiceConfig, 
  updateServiceConfig,
  dbConfigToNLPFormat,
  nlpServiceToDBFormat,
  getLocalized
} from './serviceConfigDB.js';

class ServiceConfigAdmin {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await getServiceConfigDB();
    return this;
  }

  async listServices() {
    const configs = await this.db.getAllServiceConfigs(true);
    console.log('=== Service Configurations ===');
    configs.forEach(config => {
      const status = config.isActive !== false ? '✅' : '❌';
      const name = getLocalized(config.name);
      console.log(`${status} ${config.serviceId} - v${config.version} (${name})`);
      console.log(`   ID: ${config.id}`);
      console.log(`   Updated: ${config.updatedAt}`);
      console.log(`   Steps: ${Object.keys(config.steps || {}).length}`);
      console.log('');
    });
    return configs;
  }

  async viewService(serviceId) {
    const config = await this.db.getLatestServiceConfig(serviceId);
    if (!config) {
      console.log(`Service ${serviceId} not found`);
      return null;
    }

    const name = getLocalized(config.name);
    const desc = getLocalized(config.description);

    console.log(`=== ${name} (v${config.version}) ===`);
    console.log(`ID: ${config.serviceId}`);
    console.log(`Description: ${desc}`);
    console.log(`Status: ${config.isActive !== false ? 'Active' : 'Inactive'}`);
    console.log(`Created: ${config.createdAt}`);
    console.log(`Updated: ${config.updatedAt}`);
    console.log(`\nSteps:`);
    
    const steps = config.steps || {};
    Object.entries(steps).forEach(([stepId, step]) => {
      const title = getLocalized(step.title) || step.type;
      console.log(`  Step ${stepId}: ${title}`);
      if (step.fields) {
        const fieldNames = step.fields.map(f => f.name).join(', ');
        console.log(`    Fields: ${fieldNames}`);
      }
    });

    return config;
  }

  async createService(serviceData) {
    if (!serviceData.serviceId || !serviceData.name) {
      throw new Error('serviceId and name are required');
    }

    const existing = await this.db.getLatestServiceConfig(serviceData.serviceId);
    if (existing) {
      throw new Error(`Service ${serviceData.serviceId} already exists. Use update instead.`);
    }

    // Ensure bilingual format for name and description
    const name = typeof serviceData.name === 'string'
      ? { en: serviceData.name, am: serviceData.name }
      : serviceData.name || { en: '', am: '' };
    
    const description = typeof serviceData.description === 'string'
      ? { en: serviceData.description, am: serviceData.description }
      : serviceData.description || { en: '', am: '' };

    const config = {
      id: `${serviceData.serviceId}_v1`,
      serviceId: serviceData.serviceId,
      name: name,
      description: description,
      initStep: serviceData.initStep || 1,
      collectedData: serviceData.collectedData || {},
      steps: serviceData.steps || {},
      isActive: true,
      version: 1
    };

    return this.db.saveServiceConfig(config);
  }

  async updateService(serviceId, updates) {
    const existing = await this.db.getLatestServiceConfig(serviceId);
    if (!existing) {
      throw new Error(`Service ${serviceId} not found`);
    }

    // Ensure bilingual format for name and description if provided
    if (updates.name && typeof updates.name === 'string') {
      updates.name = { en: updates.name, am: updates.name };
    }
    if (updates.description && typeof updates.description === 'string') {
      updates.description = { en: updates.description, am: updates.description };
    }

    const newConfig = {
      ...existing,
      ...updates,
      id: `${serviceId}_v${(existing.version || 0) + 1}`,
      version: (existing.version || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    newConfig.serviceId = serviceId;

    return this.db.saveServiceConfig(newConfig);
  }

  async deleteService(serviceId) {
    const configs = await this.db.getServiceConfigsByServiceId(serviceId, true);
    if (configs.length === 0) {
      console.log(`No configurations found for service ${serviceId}`);
      return false;
    }

    console.log(`Deleting ${configs.length} configurations for service ${serviceId}`);
    for (const config of configs) {
      await this.db.deleteServiceConfig(config.id);
    }
    return true;
  }

  async deactivateService(serviceId) {
    const config = await this.db.getLatestServiceConfig(serviceId);
    if (!config) {
      throw new Error(`Service ${serviceId} not found`);
    }
    return this.db.deactivateServiceConfig(config.id);
  }

  async activateService(serviceId) {
    const config = await this.db.getLatestServiceConfig(serviceId);
    if (!config) {
      throw new Error(`Service ${serviceId} not found`);
    }
    return this.db.activateServiceConfig(config.id);
  }

  async exportServices() {
    const configs = await this.db.getAllServiceConfigs(true);
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      services: configs
    };
    const json = JSON.stringify(data, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service_configs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return data;
  }

  async importServices(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.services || !Array.isArray(data.services)) {
      throw new Error('Invalid import data. Expected { services: [...] }');
    }

    const results = [];
    for (const config of data.services) {
      const saved = await this.db.saveServiceConfig(config);
      results.push(saved);
    }

    console.log(`Imported ${results.length} service configurations`);
    return results;
  }

  async getStats() {
    return this.db.getStats();
  }

  async cloneService(serviceId, newServiceId) {
    const existing = await this.db.getLatestServiceConfig(serviceId);
    if (!existing) {
      throw new Error(`Service ${serviceId} not found`);
    }

    // Clone name with bilingual format
    const name = existing.name && typeof existing.name === 'object'
      ? { 
          en: (existing.name.en || '') + ' (Clone)', 
          am: (existing.name.am || '') + ' (ቅጂ)' 
        }
      : { en: (existing.name || '') + ' (Clone)', am: (existing.name || '') + ' (ቅጂ)' };

    const clonedConfig = {
      ...existing,
      id: `${newServiceId}_v1`,
      serviceId: newServiceId,
      name: name,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.db.saveServiceConfig(clonedConfig);
  }

  async rollbackService(serviceId, version) {
    const configs = await this.db.getServiceConfigsByServiceId(serviceId, true);
    const target = configs.find(c => c.version === version);
    
    if (!target) {
      throw new Error(`Version ${version} not found for service ${serviceId}`);
    }

    const newConfig = {
      ...target,
      id: `${serviceId}_v${(configs.length + 1)}`,
      version: configs.length + 1,
      updatedAt: new Date().toISOString()
    };

    return this.db.saveServiceConfig(newConfig);
  }

  async getServiceHistory(serviceId) {
    const configs = await this.db.getServiceConfigsByServiceId(serviceId, true);
    configs.sort((a, b) => (a.version || 0) - (b.version || 0));
    
    console.log(`=== History for ${serviceId} ===`);
    configs.forEach(config => {
      const name = getLocalized(config.name);
      console.log(`v${config.version}: ${config.updatedAt} - ${config.isActive !== false ? 'Active' : 'Inactive'} - ${name}`);
    });
    
    return configs;
  }
}

let adminInstance = null;

export async function getServiceConfigAdmin() {
  if (!adminInstance) {
    adminInstance = new ServiceConfigAdmin();
    await adminInstance.init();
  }
  return adminInstance;
}

export default {
  getServiceConfigAdmin,
  ServiceConfigAdmin
};