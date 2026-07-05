// ============================================================
// ServiceConfigTrainer.jsx - CORRECTED DATA SOURCES
// ============================================================

import { useState, useEffect } from 'preact/hooks';
import { db } from '../services/database.js'; // ← ONLY for chat history
import { getServiceConfigDB, getLocalized } from '../services/serviceConfigDB.js'; // ← ONLY for services

// ============================================================
// DATA MASKING UTILITIES
// ============================================================

class DataMasker {
  constructor() {
    this.maskPatterns = {
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(\+?251|0)?[79][0-9]{8}/g,
      license: /[A-Z]{2,3}-?[0-9]{3,6}/g,
      password: /password["']?\s*[:=]\s*["'][^"']*["']/gi,
      vin: /[A-HJ-NPR-Z0-9]{10,17}/g,
      plate: /[A-Z]{2,3}-?[0-9]{3,4}/gi,
      businessLicense: /[0-9]{6,10}/g,
      name: /(?:name|operator|driver|owner)["']?\s*[:=]\s*["'][^"']*["']/gi,
      location: /(?:lat|lng|latitude|longitude|gps)["']?\s*[:=]\s*[0-9.-]+/gi,
      idNumber: /[A-Z]{0,2}[0-9]{5,12}/g
    };
    
    this.maskChars = {
      default: '█',
      email: '📧',
      phone: '📱',
      password: '🔒',
      license: '🪪',
      vin: '🚗',
      plate: '🚘'
    };
  }

  maskData(text, maskTypes = ['all']) {
    let masked = text;
    const appliedMasks = [];
    
    if (maskTypes.includes('all')) {
      maskTypes = Object.keys(this.maskPatterns);
    }
    
    for (const type of maskTypes) {
      if (this.maskPatterns[type]) {
        const matches = text.match(this.maskPatterns[type]);
        if (matches) {
          const char = this.maskChars[type] || '█';
          masked = masked.replace(this.maskPatterns[type], (match) => {
            appliedMasks.push({ type, original: match, masked: char.repeat(match.length) });
            return char.repeat(match.length);
          });
        }
      }
    }
    
    return { 
      maskedText: masked, 
      appliedMasks,
      originalText: text 
    };
  }

  getMaskedStats(text) {
    const stats = {};
    for (const [type, pattern] of Object.entries(this.maskPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        stats[type] = matches.length;
      }
    }
    return stats;
  }

  getMaskedPreview(text, maxLength = 200) {
    const { maskedText, appliedMasks } = this.maskData(text);
    const preview = maskedText.length > maxLength 
      ? maskedText.substring(0, maxLength) + '...' 
      : maskedText;
    return { preview, appliedMasks };
  }
}

// ============================================================
// MAIN UI COMPONENT
// ============================================================

export function ServiceConfigTrainer({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [maskSettings, setMaskSettings] = useState({
    enabled: true,
    types: ['all'],
    customPatterns: []
  });
  const [previewMode, setPreviewMode] = useState('masked');
  const [exportFormat, setExportFormat] = useState('jsonl');
  const [colabScript, setColabScript] = useState('');
  const [showColabScript, setShowColabScript] = useState(false);
  const [maskedPreview, setMaskedPreview] = useState(null);
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const masker = new DataMasker();

  // ============================================================
  // LOAD DATA FROM CORRECT SOURCES
  // ============================================================
  
  const loadData = async () => {
    try {
      setLoading(true);
      setMessage('Loading data...');
      setMessageType('info');
      
      // ✅ 1. Load services from ServiceConfigDB ONLY
      console.log('📁 Loading services from ServiceConfigDB...');
      const serviceDB = await getServiceConfigDB();
      const serviceConfigs = await serviceDB.getAllServiceConfigs();
      console.log(`✅ Loaded ${serviceConfigs.length} services from ServiceConfigDB`);
      setServices(serviceConfigs || []);
      
      // ✅ 2. Load chat history from database.js ONLY
      console.log('💬 Loading chat history from database.js...');
      const chatHistoryData = await db.getAllChatHistory();
      console.log(`✅ Loaded ${chatHistoryData.length} chat messages from database.js`);
      setChatHistory(chatHistoryData || []);
      
      // ✅ 3. Combine data to generate training samples
      if (serviceConfigs.length > 0 && chatHistoryData.length > 0) {
        console.log('🔄 Generating training data from both sources...');
        const samples = generateTrainingData(serviceConfigs, chatHistoryData);
        setTrainingData(samples);
        updateStats(samples);
        setMessage(`✅ Loaded ${serviceConfigs.length} services and ${chatHistoryData.length} messages`);
        setMessageType('success');
      } else {
        setMessage(`⚠️ Need data from both sources. Services: ${serviceConfigs.length}, Messages: ${chatHistoryData.length}`);
        setMessageType('warning');
        setTrainingData([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setMessage('❌ Error loading data: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GENERATE TRAINING DATA - COMBINES BOTH SOURCES
  // ============================================================
  
  const generateTrainingData = (servicesData, chatData) => {
    const samples = [];
    
    chatData.forEach(msg => {
      const content = msg.content || '';
      if (!content) return;
      
      // Try to find service by serviceId from the message
      let service = servicesData.find(s => s.serviceId === msg.serviceId);
      
      // If not found, try to detect from content
      if (!service) {
        for (const s of servicesData) {
          const serviceName = getLocalized(s.name)?.toLowerCase() || '';
          const serviceId = s.serviceId?.toLowerCase() || '';
          const contentLower = content.toLowerCase();
          
          if (contentLower.includes(serviceName) || contentLower.includes(serviceId)) {
            service = s;
            break;
          }
        }
      }
      
      // If still no service, use a default
      if (!service) {
        service = {
          serviceId: 'general',
          name: { en: 'General Chat', am: 'አጠቃላይ ውይይት' },
          description: { en: 'General conversation', am: 'አጠቃላይ ውይይት' },
          steps: {}
        };
      }
      
      // Mask the content
      const masked = masker.maskData(content, maskSettings.types);
      const intent = detectIntent(content, service);
      const language = detectLanguage(content);
      
      samples.push({
        id: msg.id || Date.now(),
        serviceId: service.serviceId,
        serviceName: getLocalized(service.name) || 'Unknown',
        prompt: content,
        maskedPrompt: maskSettings.enabled ? masked.maskedText : content,
        intent: intent,
        language: language,
        step: msg.step || 1,
        timestamp: msg.timestamp || new Date().toISOString(),
        sessionId: msg.sessionId || 'default',
        type: msg.type || 'user',
        role: msg.role || 'user'
      });
    });
    
    return samples;
  };

  const detectIntent = (prompt, service) => {
    const promptLower = prompt.toLowerCase();
    const steps = service?.steps || {};
    
    for (const [stepId, step] of Object.entries(steps)) {
      const fields = step.fields || [];
      for (const field of fields) {
        if (field.name && promptLower.includes(field.name.toLowerCase())) {
          return `collect_${field.name}`;
        }
      }
    }
    
    if (promptLower.includes('register') || promptLower.includes('add') || promptLower.includes('create')) {
      return 'start_service';
    }
    if (promptLower.includes('continue') || promptLower.includes('next')) {
      return 'continue_flow';
    }
    if (promptLower.includes('yes') || promptLower.includes('no')) {
      return 'boolean_response';
    }
    if (promptLower.includes('cancel') || promptLower.includes('stop')) {
      return 'end_service';
    }
    return 'general_chat';
  };

  const detectLanguage = (text) => {
    return /[\u1200-\u137F]/.test(text) ? 'am' : 'en';
  };

  const updateStats = (samples) => {
    const stats = {
      total: samples.length,
      byService: {},
      byIntent: {},
      byLanguage: { en: 0, am: 0 },
      maskedCount: 0,
      bySession: {}
    };
    
    samples.forEach(s => {
      stats.byService[s.serviceId] = (stats.byService[s.serviceId] || 0) + 1;
      stats.byIntent[s.intent] = (stats.byIntent[s.intent] || 0) + 1;
      stats.byLanguage[s.language] = (stats.byLanguage[s.language] || 0) + 1;
      stats.bySession[s.sessionId] = (stats.bySession[s.sessionId] || 0) + 1;
      if (s.maskedPrompt !== s.prompt) stats.maskedCount++;
    });
    
    setStats(stats);
  };

  const handleMaskToggle = (type) => {
    setMaskSettings(prev => {
      const types = prev.types.includes('all') ? [] : [...prev.types];
      
      if (types.includes(type)) {
        return { ...prev, types: types.filter(t => t !== type) };
      } else {
        return { ...prev, types: [...types, type] };
      }
    });
  };

  const handlePreviewSample = (sample) => {
    if (!sample) return;
    
    const masked = masker.maskData(sample.prompt, maskSettings.types);
    const stats = masker.getMaskedStats(sample.prompt);
    
    setMaskedPreview({
      original: sample.prompt,
      masked: masked.maskedText,
      stats: stats,
      appliedMasks: masked.appliedMasks
    });
  };

  // ============================================================
  // EXPORT - USES BOTH SOURCES
  // ============================================================
  
  const exportTrainingData = async () => {
    try {
      setLoading(true);
      
      // Get fresh data from correct sources
      const serviceDB = await getServiceConfigDB();
      const freshServices = await serviceDB.getAllServiceConfigs();
      const freshChatHistory = await db.getAllChatHistory();
      
      // Generate fresh training data
      const freshSamples = generateTrainingData(freshServices, freshChatHistory);
      
      const exportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        maskSettings: maskSettings,
        // From ServiceConfigDB
        services: freshServices,
        // From database.js
        chatHistory: freshChatHistory.map(msg => ({
          ...msg,
          content: maskSettings.enabled ? masker.maskData(msg.content, maskSettings.types).maskedText : msg.content
        })),
        // Combined training samples
        trainingSamples: freshSamples.map(s => ({
          ...s,
          prompt: maskSettings.enabled ? s.maskedPrompt : s.prompt
        })),
        metadata: {
          totalMessages: freshChatHistory.length,
          totalServices: freshServices.length,
          totalTrainingSamples: freshSamples.length,
          sources: {
            chatHistory: 'database.js',
            services: 'serviceConfigDB.js'
          },
          language: 'bilingual'
        }
      };
      
      let content;
      let filename;
      
      if (exportFormat === 'jsonl') {
        content = exportData.trainingSamples.map(s => JSON.stringify(s)).join('\n');
        filename = `training_data_${Date.now()}.jsonl`;
      } else {
        content = JSON.stringify(exportData, null, 2);
        filename = `training_data_${Date.now()}.json`;
      }
      
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage(`✅ Training data exported as ${filename}`);
      setMessageType('success');
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage('❌ Error exporting data: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GENERATE COLAB SCRIPT
  // ============================================================
  
  const generateColabScript = () => {
    const script = `# -*- coding: utf-8 -*-
"""TRAINING SCRIPT - Combines database.js + ServiceConfigDB"""

import json
import os
from google.colab import files, drive

# Mount Drive
drive.mount('/content/drive')

# Upload training data
print("📤 Upload training data...")
uploaded = files.upload()
data_file = list(uploaded.keys())[0]

# Parse data
with open(data_file, 'r') as f:
    if data_file.endswith('.jsonl'):
        samples = [json.loads(line) for line in f]
    else:
        data = json.load(f)
        samples = data.get('trainingSamples', [])
        services = data.get('services', [])
        chat_history = data.get('chatHistory', [])

print(f"✅ Loaded {len(samples)} samples from {len(services)} services")

# Save to Drive
DRIVE_PATH = "/content/drive/MyDrive/llama_models"
os.makedirs(DRIVE_PATH, exist_ok=True)

# Create training data
with open(f"{DRIVE_PATH}/training_data.jsonl", 'w') as f:
    for sample in samples:
        f.write(json.dumps(sample, ensure_ascii=False) + '\\n')

print(f"✅ Saved to {DRIVE_PATH}/training_data.jsonl")
print(f"📊 {len(samples)} samples ready for training")`;

    setColabScript(script);
    setShowColabScript(true);
  };

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const renderMaskSettings = () => (
    <div class="mask-settings">
      <h3>🔒 Data Masking Settings</h3>
      
      <div class="mask-toggle">
        <label>
          <input
            type="checkbox"
            checked={maskSettings.enabled}
            onChange={(e) => setMaskSettings({ ...maskSettings, enabled: e.target.checked })}
          />
          Enable Data Masking
        </label>
      </div>
      
      <div class="mask-types">
        <label>Mask Types:</label>
        <div class="mask-checkboxes">
          {['all', 'email', 'phone', 'password', 'license', 'vin', 'plate', 'businessLicense', 'name', 'location', 'idNumber'].map(type => (
            <label key={type}>
              <input
                type="checkbox"
                checked={maskSettings.types.includes(type)}
                onChange={() => handleMaskToggle(type)}
                disabled={!maskSettings.enabled}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div>
      
      <div class="data-sources">
        <span class="source-badge">📊 database.js</span>
        <span class="source-badge">📁 ServiceConfigDB</span>
      </div>
    </div>
  );

  const renderStats = () => (
    <div class="stats-panel">
      <h3>📊 Training Data Stats</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Samples</span>
          <span class="stat-value">{stats.total || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Services</span>
          <span class="stat-value">{services.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Messages</span>
          <span class="stat-value">{chatHistory.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Masked</span>
          <span class="stat-value">{stats.maskedCount || 0}</span>
        </div>
      </div>
      
      <div class="stat-section">
        <h4>By Service</h4>
        {Object.entries(stats.byService || {}).map(([service, count]) => (
          <div key={service} class="stat-bar">
            <span class="stat-bar-label">{service}</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style={{ width: `${(count / (stats.total || 1)) * 100}%` }} />
            </div>
            <span class="stat-bar-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTrainingSamples = () => (
    <div class="training-samples">
      <h3>📝 Training Samples</h3>
      
      <div class="sample-controls">
        <select onChange={(e) => setPreviewMode(e.target.value)} value={previewMode}>
          <option value="masked">Masked View</option>
          <option value="original">Original View</option>
        </select>
        
        <button onClick={() => handlePreviewSample(trainingData[0])}>
          Preview Sample
        </button>
      </div>
      
      {maskedPreview && previewMode === 'masked' && (
        <div class="preview-panel">
          <h4>🔍 Masked Preview</h4>
          <div class="preview-content">
            <div class="preview-original">
              <strong>Original:</strong>
              <pre>{maskedPreview.original}</pre>
            </div>
            <div class="preview-masked">
              <strong>Masked:</strong>
              <pre>{maskedPreview.masked}</pre>
            </div>
          </div>
        </div>
      )}
      
      <div class="samples-list">
        {trainingData.slice(0, 20).map((sample, index) => (
          <div key={index} class="sample-item">
            <div class="sample-header">
              <span class="sample-service">{sample.serviceName}</span>
              <span class="sample-intent">{sample.intent}</span>
              <span class="sample-language">{sample.language === 'am' ? 'አማርኛ' : 'English'}</span>
            </div>
            <div class="sample-content">
              {previewMode === 'masked' ? sample.maskedPrompt : sample.prompt}
            </div>
            <div class="sample-meta">
              <span>Step: {sample.step}</span>
              <span>{new Date(sample.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
      
      {trainingData.length > 20 && (
        <div class="sample-more">
          Showing 20 of {trainingData.length} samples
        </div>
      )}
    </div>
  );

  return (
    <div class="service-trainer">
      <div class="trainer-header">
        <h1>🎯 Training Data Manager</h1>
        <button onClick={onClose} class="close-btn">×</button>
      </div>
      
      {message && (
        <div class={`message ${messageType}`}>
          {message}
          <button onClick={() => setMessage('')} class="message-close">×</button>
        </div>
      )}
      
      <div class="trainer-body">
        <div class="trainer-sidebar">
          {renderMaskSettings()}
          {renderStats()}
          
          <div class="trainer-actions">
            <button onClick={loadData} class="btn-secondary" disabled={loading}>
              ↻ Refresh Data
            </button>
            
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              class="format-select"
            >
              <option value="jsonl">JSONL (Training)</option>
              <option value="json">JSON (Full Export)</option>
            </select>
            
            <button 
              onClick={exportTrainingData} 
              class="btn-primary" 
              disabled={loading || trainingData.length === 0}
            >
              💾 Export Training Data
            </button>
            
            <button onClick={generateColabScript} class="btn-accent">
              🤖 Generate Colab Script
            </button>
          </div>
        </div>
        
        <div class="trainer-main">
          {loading ? (
            <div class="loading">Loading...</div>
          ) : trainingData.length === 0 ? (
            <div class="empty-state">
              <p>No training data available</p>
              <button onClick={loadData} class="btn-primary">🔄 Load Data</button>
            </div>
          ) : (
            renderTrainingSamples()
          )}
        </div>
      </div>
      
      {showColabScript && (
        <div class="colab-modal">
          <div class="modal-content">
            <h2>🤖 Colab Training Script</h2>
            <div class="script-container">
              <pre>{colabScript}</pre>
            </div>
            <div class="modal-actions">
              <button onClick={() => {
                navigator.clipboard.writeText(colabScript);
                setMessage('✅ Script copied!');
              }} class="btn-primary">📋 Copy</button>
              <button onClick={() => setShowColabScript(false)} class="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .service-trainer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.95);
          z-index: 10000;
          overflow-y: auto;
          padding: 20px;
          color: #e0e0e0;
        }

        .trainer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1a1a2e;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .trainer-header h1 { margin: 0; color: #fff; }
        .close-btn { background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; }
        .close-btn:hover { color: #ff6b6b; }

        .trainer-body {
          display: flex;
          gap: 20px;
          height: calc(100vh - 120px);
        }

        .trainer-sidebar {
          flex: 0 0 350px;
          background: #1a1a2e;
          border-radius: 8px;
          padding: 20px;
          overflow-y: auto;
        }

        .trainer-main {
          flex: 1;
          background: #1a1a2e;
          border-radius: 8px;
          padding: 20px;
          overflow-y: auto;
        }

        .message {
          padding: 12px 20px;
          border-radius: 6px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
        }
        .message.success { background: #1a3a2e; color: #81c784; }
        .message.error { background: #3a1a1a; color: #ff6b6b; }
        .message.info { background: #1a2a3a; color: #4a8cf7; }
        .message.warning { background: #3a3a1a; color: #f7c84a; }

        .mask-settings { margin-bottom: 20px; border-bottom: 1px solid #2a2a4e; padding-bottom: 20px; }
        .mask-settings h3 { color: #fff; margin-top: 0; }
        .mask-checkboxes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
        .mask-checkboxes label { font-size: 13px; color: #aaa; cursor: pointer; }

        .data-sources { margin-top: 12px; display: flex; gap: 8px; }
        .source-badge { 
          font-size: 11px; 
          padding: 2px 10px; 
          border-radius: 10px; 
          background: #2a2a4e; 
          color: #aaa; 
        }

        .stats-panel { margin-bottom: 20px; }
        .stats-panel h3 { color: #fff; margin-top: 0; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .stat-item { background: #0d0d1a; padding: 10px; border-radius: 6px; text-align: center; }
        .stat-label { display: block; font-size: 11px; color: #888; }
        .stat-value { display: block; font-size: 20px; font-weight: bold; color: #4a6cf7; }

        .stat-section h4 { color: #ccc; margin: 12px 0 8px; font-size: 14px; }
        .stat-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .stat-bar-label { font-size: 12px; color: #aaa; min-width: 80px; }
        .stat-bar-track { flex: 1; height: 16px; background: #0d0d1a; border-radius: 8px; overflow: hidden; }
        .stat-bar-fill { height: 100%; background: linear-gradient(90deg, #4a6cf7, #6a8cf7); border-radius: 8px; }

        .trainer-actions { display: flex; flex-direction: column; gap: 10px; }
        .btn-primary { padding: 10px 20px; background: #4a6cf7; border: none; border-radius: 6px; color: #fff; cursor: pointer; }
        .btn-secondary { padding: 10px 20px; background: #2a2a4e; border: none; border-radius: 6px; color: #ccc; cursor: pointer; }
        .btn-accent { padding: 10px 20px; background: #6c5ce7; border: none; border-radius: 6px; color: #fff; cursor: pointer; }
        .format-select { padding: 10px; background: #0d0d1a; border: 1px solid #2a2a4e; border-radius: 6px; color: #e0e0e0; cursor: pointer; }

        .sample-controls { display: flex; gap: 10px; margin-bottom: 16px; }
        .sample-controls select { padding: 8px 12px; background: #0d0d1a; border: 1px solid #2a2a4e; border-radius: 4px; color: #e0e0e0; }

        .preview-panel { background: #0d0d1a; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
        .preview-content { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .preview-original, .preview-masked { background: #1a1a2e; padding: 12px; border-radius: 4px; }
        .preview-original pre, .preview-masked pre { margin: 8px 0 0; white-space: pre-wrap; word-break: break-all; font-size: 13px; color: #aaa; max-height: 100px; overflow-y: auto; }

        .samples-list { display: flex; flex-direction: column; gap: 8px; }
        .sample-item { background: #0d0d1a; border-radius: 6px; padding: 12px; }
        .sample-header { display: flex; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
        .sample-service { font-weight: bold; color: #4a6cf7; font-size: 13px; }
        .sample-intent { color: #6c5ce7; font-size: 12px; background: #1a1a2e; padding: 2px 8px; border-radius: 10px; }
        .sample-language { font-size: 12px; color: #888; }
        .sample-content { font-size: 13px; color: #aaa; margin-bottom: 4px; max-height: 60px; overflow: hidden; text-overflow: ellipsis; }
        .sample-meta { display: flex; gap: 12px; font-size: 11px; color: #555; }

        .loading { text-align: center; padding: 60px 20px; color: #888; }
        .empty-state { text-align: center; padding: 60px 20px; color: #888; }

        .colab-modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.95);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .colab-modal .modal-content {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 24px;
          max-width: 800px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
        }
        .colab-modal .modal-content h2 { color: #fff; margin-top: 0; }
        .script-container { background: #0d0d1a; border-radius: 6px; padding: 16px; margin: 12px 0; max-height: 400px; overflow-y: auto; }
        .script-container pre { margin: 0; white-space: pre-wrap; word-break: break-all; font-size: 13px; color: #aaa; }
        .modal-actions { display: flex; gap: 10px; margin-top: 16px; }

        @media (max-width: 1024px) {
          .trainer-body { flex-direction: column; height: auto; }
          .trainer-sidebar { flex: none; width: 100%; }
          .trainer-main { height: 500px; }
        }
        @media (max-width: 768px) {
          .preview-content { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default ServiceConfigTrainer;