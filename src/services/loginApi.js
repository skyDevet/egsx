// ============================================================
// loginApi.js - Calls Python Server for Session
// ============================================================

const PYTHON_SERVER = 'http://192.168.23.63:5001';

// ============================================================
// API FUNCTIONS THAT CALL PYTHON SERVER
// ============================================================

async function getSession() {
  console.log('📋 Getting session from Python server...');
  
  try {
    const response = await fetch(`${PYTHON_SERVER}/api/ifmts/session`);
    
    if (!response.ok) {
      console.warn('⚠️ Not authenticated. Please login.');
      return { success: false, error: 'Not authenticated' };
    }
    
    const data = await response.json();
    console.log('✅ Session loaded successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to get session:', error.message);
    return { success: false, error: error.message };
  }
}

async function triggerLogin() {
  console.log('🔐 Triggering login via Python server...');
  
  try {
    const response = await fetch(`${PYTHON_SERVER}/api/ifmts/login`, {
      method: 'POST'
    });
    
    const data = await response.json();
    console.log('✅ Login triggered:', data.message);
    return data;
  } catch (error) {
    console.error('❌ Failed to trigger login:', error.message);
    return { success: false, error: error.message };
  }
}

async function getStatus() {
  try {
    const response = await fetch(`${PYTHON_SERVER}/api/ifmts/status`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { isAuthenticated: false, error: error.message };
  }
}

async function refreshSession() {
  try {
    const response = await fetch(`${PYTHON_SERVER}/api/ifmts/refresh`, {
      method: 'POST'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function logout() {
  try {
    const response = await fetch(`${PYTHON_SERVER}/api/ifmts/logout`, {
      method: 'POST'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// CONFIGURATION
// ============================================================

const isDev = import.meta.env.DEV;

const CONFIG = {
  API_BASE: isDev ? '/api-auth' : 'https://api.iftms.motl.gov.et',
  PYTHON_SERVER: PYTHON_SERVER,
};

console.log('🔧 ===== IFMTS API CONFIG =====');
console.log(`🌐 Python Server: ${CONFIG.PYTHON_SERVER}`);
console.log(`🌐 API Base: ${CONFIG.API_BASE}`);
console.log('🔧 =============================');

// ============================================================
// IFMTS API CLASS - Uses Python Server Session
// ============================================================

class IFMTSAPI {
  constructor() {
    this.token = null;
    this.userId = null;
    this.licenseApplicationId = null;
    this.cookies = null;
    this._isAuthenticated = false;
    this.sessionData = null;
    console.log('🏗️ IFMTSAPI instance created');
  }

  isAuthenticated() {
    return this._isAuthenticated && this.token !== null;
  }

  // ============================================================
  // 1. LOAD SESSION FROM PYTHON SERVER
  // ============================================================
  
  async loadSession() {
    console.log('🔐 ===== LOADING SESSION =====');
    
    const result = await getSession();
    
    if (!result.success || !result.session) {
      console.log('ℹ️ No session available. Please login.');
      return { success: false, error: result.error || 'No session' };
    }
    
    const session = result.session;
    this.token = session.token;
    this.userId = session.userId;
    this.licenseApplicationId = session.licenseApplicationId;
    this.cookies = session.cookies;
    this._isAuthenticated = session.isAuthenticated;
    this.sessionData = session;
    
    console.log('✅ Session loaded successfully');
    console.log(`👤 User ID: ${this.userId}`);
    console.log(`📋 License App ID: ${this.licenseApplicationId}`);
    
    return { success: true };
  }

  // ============================================================
  // 2. LOGIN - Triggers Python Selenium
  // ============================================================
  
  async login(username, password) {
    console.log('🔐 ===== LOGIN VIA PYTHON =====');
    console.log(`📱 Username: ${username}`);
    
    // Trigger login
    const result = await triggerLogin();
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Wait for login to complete (poll status)
    console.log('⏳ Waiting for login to complete...');
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const status = await getStatus();
      if (status.isAuthenticated) {
        console.log('✅ Login completed!');
        return await this.loadSession();
      }
      attempts++;
    }
    
    return { success: false, error: 'Login timeout' };
  }

  // ============================================================
  // 3. GET USER INFO
  // ============================================================
  
  async getUserInfo() {
    console.log('👤 ===== GET USER INFO =====');
    console.log(`🌐 API URL: ${CONFIG.API_BASE}/auth/me`);
    
    if (!this.isAuthenticated()) {
      console.warn('⚠️ Not authenticated');
      return null;
    }
    
    try {
      const headers = {
        'Accept': 'application/json, text/plain, */*',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.cookies) {
        const cookieString = Object.entries(this.cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        headers['Cookie'] = cookieString;
      }

      const response = await fetch(`${CONFIG.API_BASE}/auth/me`, {
        method: 'GET',
        headers: headers,
        credentials: 'include',
      });

      console.log(`📥 Response status: ${response.status}`);

      if (response.status === 401 || response.status === 403) {
        console.warn('⚠️ Unauthorized - session expired');
        this._isAuthenticated = false;
        return null;
      }

      if (!response.ok) {
        console.error('❌ Failed to get user info:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('📥 User info received');
      
      this.userData = data;
      this.userId = data.id;
      
      if (data.licenseApplication) {
        this.licenseData = data.licenseApplication;
        this.licenseApplicationId = data.licenseApplication.id;
        console.log(`✅ License App ID: ${this.licenseApplicationId}`);
        console.log(`✅ Operator: ${data.licenseApplication.operator_name}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get user info:', error.message);
      return null;
    }
  }

  // ============================================================
  // 4. ADD VEHICLE
  // ============================================================
  
  async addVehicle(vehicleData) {
    console.log('🚗 ===== ADD VEHICLE =====');
    console.log(`📋 Plate: ${vehicleData.plateNumber || 'N/A'}`);
    
    if (!this.isAuthenticated()) {
      console.error('❌ Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.cookies) {
        const cookieString = Object.entries(this.cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        headers['Cookie'] = cookieString;
      }

      const response = await fetch(`${CONFIG.API_BASE}/vehicles`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          plateNumber: vehicleData.plateNumber || '',
          plateCode: vehicleData.plateCode || '',
          motorNumber: vehicleData.motorNumber || '',
          vinNumber: vehicleData.vinNumber || '',
          chassisNumber: vehicleData.chassisNumber || '',
          manufacturer: vehicleData.manufacturer || '',
          vehicleModel: vehicleData.vehicleModel || '',
          manufactureYear: vehicleData.manufactureYear || '',
          vehicleType: vehicleData.vehicleType || '',
          bodyPartType: vehicleData.bodyPartType || '',
          engineInfo: vehicleData.engineInfo || '',
          engineCapacity: vehicleData.engineCapacity || '',
          cylinderCount: vehicleData.cylinderCount || '',
          fuelType: vehicleData.fuelType || '',
          serviceType: vehicleData.serviceType || '',
          totalWeight: vehicleData.totalWeight || '',
          unladenWeight: vehicleData.unladenWeight || '',
          loadCapacity: vehicleData.loadCapacity || '',
          cargoVolume: vehicleData.cargoVolume || '',
          tonnage: vehicleData.tonnage || '',
          gvw: vehicleData.gvw || '',
          payload: vehicleData.payload || '',
          seatingCapacity: vehicleData.seatingCapacity || '',
          wheelbase: vehicleData.wheelbase || '',
          axelCount: vehicleData.axelCount || '',
          color: vehicleData.color || '',
          bodyColor: vehicleData.bodyColor || '',
          interiorColor: vehicleData.interiorColor || '',
          assemblyPlant: vehicleData.assemblyPlant || '',
          gpsInfo: vehicleData.gpsInfo || '',
          licenseApplicationId: this.licenseApplicationId,
          userId: this.userId
        }),
        credentials: 'include',
      });

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Failed:', response.status, errorData);
        return { success: false, error: `Vehicle add failed: ${response.status}`, details: errorData };
      }

      const result = await response.json();
      console.log('✅ Vehicle added! ID:', result.id || 'unknown');
      return { success: true, id: result.id, data: result, message: 'Vehicle added' };
    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // 5. ADD DRIVER
  // ============================================================
  
  async addDriver(driverData) {
    console.log('👤 ===== ADD DRIVER =====');
    console.log(`📋 Name: ${driverData.driverName || 'N/A'}`);
    
    if (!this.isAuthenticated()) {
      console.error('❌ Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.cookies) {
        const cookieString = Object.entries(this.cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        headers['Cookie'] = cookieString;
      }

      const response = await fetch(`${CONFIG.API_BASE}/drivers`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          driverName: driverData.driverName || '',
          driverLicense: driverData.driverLicense || '',
          phoneNumber: driverData.phoneNumber || '',
          email: driverData.email || '',
          address: driverData.address || '',
          licenseApplicationId: this.licenseApplicationId,
          userId: this.userId
        }),
        credentials: 'include',
      });

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Failed:', response.status, errorData);
        return { success: false, error: `Driver add failed: ${response.status}`, details: errorData };
      }

      const result = await response.json();
      console.log('✅ Driver added! ID:', result.id || 'unknown');
      return { success: true, id: result.id, data: result, message: 'Driver added' };
    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // 6. UPDATE OPERATOR
  // ============================================================
  
  async updateOperator(operatorData) {
    console.log('🏢 ===== UPDATE OPERATOR =====');
    console.log(`📋 Name: ${operatorData.operatorName || 'N/A'}`);
    
    if (!this.isAuthenticated()) {
      console.error('❌ Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.cookies) {
        const cookieString = Object.entries(this.cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        headers['Cookie'] = cookieString;
      }

      const response = await fetch(`${CONFIG.API_BASE}/license-applications/${this.licenseApplicationId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          operator_name: operatorData.operatorName || this.licenseData?.operator_name || '',
          tin_number: operatorData.businessLicenseNumber || this.licenseData?.tin_number || '',
          mobile_number: operatorData.phoneNumber || this.licenseData?.mobile_number || '',
          trade_registration_number: this.licenseData?.trade_registration_number || '',
          established_date: this.licenseData?.established_date || new Date().toISOString(),
          manager_first_name: this.licenseData?.manager_first_name || '',
          manager_father_name: this.licenseData?.manager_father_name || '',
          manager_grand_father_name: this.licenseData?.manager_grand_father_name || '',
          woreda: this.licenseData?.woreda || '',
          kebele: this.licenseData?.kebele || '',
          house_number: this.licenseData?.house_number || '',
          office_phone_number: this.licenseData?.office_phone_number || '',
          email: this.licenseData?.email || '',
          p_o_box: this.licenseData?.p_o_box || '',
          district_id: this.licenseData?.district_id || 33,
          license_application_type_id: this.licenseData?.license_application_type_id || 3,
          organization_type_id: this.licenseData?.organization_type_id || 1,
          service_type_id: this.licenseData?.service_type_id || 1,
          requested_license_level_category_id: this.licenseData?.requested_license_level_category_id || 12,
          initial_vehicle_count: this.licenseData?.initial_vehicle_count || 0,
          initial_load_capacity: this.licenseData?.initial_load_capacity || 0
        }),
        credentials: 'include',
      });

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Failed:', response.status, errorData);
        return { success: false, error: `Operator update failed: ${response.status}`, details: errorData };
      }

      const result = await response.json();
      console.log('✅ Operator updated! ID:', result.id || 'unknown');
      return { success: true, id: result.id, data: result, message: 'Operator updated' };
    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  
  getToken() { return this.token; }
  getUserId() { return this.userId; }
  getLicenseApplicationId() { return this.licenseApplicationId; }
  getLicenseData() { return this.licenseData; }
}

// ============================================================
// SINGLETON
// ============================================================

let apiInstance = null;

function getApiInstance() {
  if (!apiInstance) {
    apiInstance = new IFMTSAPI();
  }
  return apiInstance;
}

// ============================================================
// EXPORTED FUNCTIONS
// ============================================================

export async function login(username, password) {
  console.log('🔐 ===== LOGIN =====');
  
  try {
    const api = getApiInstance();
    const result = await api.login(username, password);
    if (result.success) {
      await api.loadSession();
    }
    return {
      success: result.success,
      userId: api.getUserId(),
      licenseApplicationId: api.getLicenseApplicationId(),
      token: api.getToken(),
      api: api,
      licenseData: api.getLicenseData(),
      ...result
    };
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function processIfmtsData(collectedData, credentials) {
  console.log('📋 ===== PROCESS IFMTS DATA =====');
  
  try {
    const api = getApiInstance();
    
    if (!api.isAuthenticated()) {
      console.log('🔄 Not authenticated, loading session...');
      const loadResult = await api.loadSession();
      if (!loadResult.success) {
        console.log('🔄 No session, triggering login...');
        await api.login(credentials?.username, credentials?.password);
      }
    }

    const results = { success: true, operator: null, vehicles: [], drivers: [], errors: [] };

    if (collectedData.operator) {
      const result = await api.updateOperator(collectedData.operator);
      result.success ? results.operator = result : results.errors.push({ type: 'operator', error: result.error });
    }

    if (collectedData.vehicles?.length > 0) {
      for (const vehicle of collectedData.vehicles) {
        const result = await api.addVehicle(vehicle);
        result.success ? results.vehicles.push(result) : results.errors.push({ type: 'vehicle', error: result.error });
      }
    }

    if (collectedData.drivers?.length > 0) {
      for (const driver of collectedData.drivers) {
        const result = await api.addDriver(driver);
        result.success ? results.drivers.push(result) : results.errors.push({ type: 'driver', error: result.error });
      }
    }

    results.success = results.errors.length === 0;
    return results;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function performIfmtsAction(action, data) {
  console.log(`🎯 ===== ACTION: ${action} =====`);
  
  try {
    const api = getApiInstance();
    if (!api.isAuthenticated()) {
      return { success: false, error: 'Not authenticated', requiresLogin: true };
    }

    let result;
    switch (action) {
      case 'add_vehicle': result = await api.addVehicle(data); break;
      case 'add_driver': result = await api.addDriver(data); break;
      case 'register_operator': result = await api.updateOperator(data); break;
      default: throw new Error(`Unknown action: ${action}`);
    }
    return result;
  } catch (error) {
    return { success: false, action, error: error.message };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export const loginApi = {
  login,
  performIfmtsAction,
  processIfmtsData,
  CONFIG,
  getApiInstance,
  // Expose Python server functions
  getSession,
  triggerLogin,
  getStatus,
  refreshSession,
  logout
};

console.log('✅ ===== loginApi.js LOADED =====');
console.log(`✅ Python Server: ${CONFIG.PYTHON_SERVER}`);
console.log('✅ =============================');

export default loginApi;