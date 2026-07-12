// ============================================================
// ServiceConfigManager.jsx - Complete Service Config UI
// ============================================================

import { useState, useEffect } from 'preact/hooks';
import { getServiceConfigDB, getLocalized } from '../services/serviceConfigDB.js';
import { nlpProcessor } from '../services/nlpProcessor.js';

// Helper to get bilingual display value
function getDisplayValue(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj !== null) {
    try {
      const lang = localStorage.getItem('agig_language') === 'am' ? 'am' : 'en';
      return obj[lang] !== undefined && obj[lang] !== '' ? obj[lang] : obj.en || '';
    } catch (e) {
      return obj.en || '';
    }
  }
  return obj;
}

// Helper to create bilingual object from string
function createBilingual(str) {
  if (!str) return { en: '', am: '' };
  if (typeof str === 'object') return str;
  return { en: str, am: str };
}

export function ServiceConfigManager({ onClose }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    name: { en: '', am: '' },
    description: { en: '', am: '' },
    initStep: 1,
    steps: {
      1: {
        type: 'form',
        title: { en: '', am: '' },
        prompt: { en: '', am: '' },
        fields: [],
        onValid: { nextStep: 2 }
      }
    }
  });
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState({
    stepId: 1,
    type: 'form',
    title: { en: '', am: '' },
    prompt: { en: '', am: '' },
    fields: [],
    onValid: { nextStep: 2 }
  });
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    question: { en: '', am: '' },
    validation: 'text',
    regex: '',
    example: { en: '', am: '' },
    error: { en: '', am: '' },
    options: { en: [], am: [] },
    autoFill: false
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const db = await getServiceConfigDB();
      const configs = await db.getAllServiceConfigs();
      setServices(configs || []);
      setMessage('Services loaded successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Error loading services:', error);
      setMessage('Error loading services: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function refreshFromDB() {
    await loadServices();
    await nlpProcessor.refreshServices?.();
  }

  function handleCreateNew() {
    setIsCreating(true);
    setEditingService(null);
    setFormData({
      serviceId: '',
      name: { en: '', am: '' },
      description: { en: '', am: '' },
      initStep: 1,
      steps: {
        1: {
          type: 'form',
          title: { en: '', am: '' },
          prompt: { en: '', am: '' },
          fields: [],
          onValid: { nextStep: 2 }
        }
      }
    });
  }

  function handleEditService(service) {
    setIsCreating(false);
    setEditingService(service);
    
    // Ensure bilingual format
    const name = typeof service.name === 'string' 
      ? { en: service.name, am: service.name }
      : service.name || { en: '', am: '' };
    
    const description = typeof service.description === 'string'
      ? { en: service.description, am: service.description }
      : service.description || { en: '', am: '' };
    
    // Process steps to ensure bilingual fields
    const steps = { ...(service.steps || {}) };
    Object.keys(steps).forEach(key => {
      const step = steps[key];
      if (step.title && typeof step.title === 'string') {
        step.title = { en: step.title, am: step.title };
      }
      if (step.prompt && typeof step.prompt === 'string') {
        step.prompt = { en: step.prompt, am: step.prompt };
      }
      if (step.fields) {
        step.fields = step.fields.map(f => {
          const field = { ...f };
          if (field.question && typeof field.question === 'string') {
            field.question = { en: field.question, am: field.question };
          }
          if (field.error && typeof field.error === 'string') {
            field.error = { en: field.error, am: field.error };
          }
          if (field.example && typeof field.example === 'string') {
            field.example = { en: field.example, am: field.example };
          }
          if (field.options && Array.isArray(field.options)) {
            field.options = { en: field.options, am: field.options };
          }
          return field;
        });
      }
    });

    setFormData({
      serviceId: service.serviceId || service.id,
      name: name,
      description: description,
      initStep: service.initStep || 1,
      steps: steps
    });
  }

  async function handleSaveService() {
    try {
      setLoading(true);
      const db = await getServiceConfigDB();
      
      // Validate
      if (!formData.serviceId || !formData.name || (!formData.name.en && !formData.name.am)) {
        setMessage('Service ID and Name are required');
        setMessageType('error');
        setLoading(false);
        return;
      }

      const config = {
        id: `${formData.serviceId}_v${Date.now()}`,
        serviceId: formData.serviceId,
        name: formData.name,
        description: formData.description || { en: '', am: '' },
        initStep: formData.initStep || 1,
        collectedData: {},
        steps: formData.steps || {},
        isActive: true,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.saveServiceConfig(config);
      await refreshFromDB();
      
      const nameDisplay = getDisplayValue(formData.name);
      setMessage(`Service "${nameDisplay}" saved successfully!`);
      setMessageType('success');
      setIsCreating(false);
      setEditingService(null);
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving service:', error);
      setMessage('Error saving service: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteService(serviceId) {
    if (!confirm(`Delete service "${serviceId}" and all its versions?`)) return;
    
    try {
      setLoading(true);
      const db = await getServiceConfigDB();
      const configs = await db.getServiceConfigsByServiceId(serviceId, true);
      
      for (const config of configs) {
        await db.deleteServiceConfig(config.id);
      }
      
      await refreshFromDB();
      setMessage(`Service "${serviceId}" deleted successfully`);
      setMessageType('success');
      
      if (editingService?.serviceId === serviceId) {
        setEditingService(null);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setMessage('Error deleting service: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  function handleAddStep() {
    const stepIds = Object.keys(formData.steps).map(Number);
    const newStepId = stepIds.length > 0 ? Math.max(...stepIds) + 1 : 1;
    
    setStepForm({
      stepId: newStepId,
      type: 'form',
      title: { en: `Step ${newStepId}`, am: `ደረጃ ${newStepId}` },
      prompt: { en: '', am: '' },
      fields: [],
      onValid: { nextStep: newStepId + 1 }
    });
    setEditingStep(newStepId);
    setShowStepEditor(true);
  }

  function handleEditStep(stepId) {
    const step = formData.steps[stepId];
    if (step) {
      const title = step.title && typeof step.title === 'object' 
        ? step.title 
        : { en: step.title || `Step ${stepId}`, am: step.title || `ደረጃ ${stepId}` };
      
      const prompt = step.prompt && typeof step.prompt === 'object'
        ? step.prompt
        : { en: step.prompt || '', am: step.prompt || '' };

      setStepForm({
        stepId: stepId,
        type: step.type || 'form',
        title: title,
        prompt: prompt,
        fields: step.fields || [],
        onValid: step.onValid || { nextStep: stepId + 1 },
        subprocess: step.subprocess || null,
        isFinal: step.isFinal || false,
        actions: step.actions || []
      });
      setEditingStep(stepId);
      setShowStepEditor(true);
    }
  }

  function handleSaveStep() {
    const updatedSteps = { ...formData.steps };
    
    const stepData = {
      type: stepForm.type,
      title: stepForm.title,
      prompt: stepForm.prompt || { en: '', am: '' },
      fields: stepForm.fields || [],
      onValid: stepForm.onValid || { nextStep: stepForm.stepId + 1 }
    };
    
    if (stepForm.type === 'subprocess') {
      stepData.subprocess = stepForm.subprocess || {
        itemName: { en: 'Item', am: 'ንጥል' },
        addPrompt: { en: 'Add another? (yes/no)', am: 'ሌላ ማከል? (አዎ/አይ)' },
        continuePrompt: { en: 'Continue? (yes/no)', am: 'መቀጠል? (አዎ/አይ)' },
        fields: []
      };
    }
    
    if (stepForm.isFinal) {
      stepData.isFinal = true;
      stepData.actions = stepForm.actions || [];
      stepData.type = 'summary';
    }
    
    updatedSteps[stepForm.stepId] = stepData;
    
    setFormData({ ...formData, steps: updatedSteps });
    setShowStepEditor(false);
    setEditingStep(null);
    setMessage(`Step ${stepForm.stepId} saved`);
    setMessageType('success');
  }

  function handleDeleteStep(stepId) {
    if (!confirm(`Delete step ${stepId}?`)) return;
    const updatedSteps = { ...formData.steps };
    delete updatedSteps[stepId];
    setFormData({ ...formData, steps: updatedSteps });
  }

  function handleAddField() {
    const fields = stepForm.fields || [];
    setFieldForm({
      name: `field${fields.length + 1}`,
      question: { en: `Question ${fields.length + 1}?`, am: `ጥያቄ ${fields.length + 1}?` },
      validation: 'text',
      regex: '',
      example: { en: '', am: '' },
      error: { en: '', am: '' },
      options: { en: [], am: [] },
      autoFill: false
    });
    setEditingField('new');
  }

  function handleEditField(index) {
    const field = stepForm.fields[index];
    if (field) {
      setFieldForm({
        ...field,
        question: field.question && typeof field.question === 'object' 
          ? field.question 
          : { en: field.question || '', am: field.question || '' },
        error: field.error && typeof field.error === 'object'
          ? field.error
          : { en: field.error || '', am: field.error || '' },
        example: field.example && typeof field.example === 'object'
          ? field.example
          : { en: field.example || '', am: field.example || '' },
        options: field.options && typeof field.options === 'object'
          ? field.options
          : { en: field.options || [], am: field.options || [] }
      });
      setEditingField(index);
    }
  }

  function handleSaveField() {
    const fields = [...(stepForm.fields || [])];
    
    // Ensure bilingual format for text fields
    const fieldToSave = { ...fieldForm };
    if (fieldToSave.question && typeof fieldToSave.question === 'string') {
      fieldToSave.question = { en: fieldToSave.question, am: fieldToSave.question };
    }
    if (fieldToSave.error && typeof fieldToSave.error === 'string') {
      fieldToSave.error = { en: fieldToSave.error, am: fieldToSave.error };
    }
    if (fieldToSave.example && typeof fieldToSave.example === 'string') {
      fieldToSave.example = { en: fieldToSave.example, am: fieldToSave.example };
    }
    if (fieldToSave.options && Array.isArray(fieldToSave.options)) {
      fieldToSave.options = { en: fieldToSave.options, am: fieldToSave.options };
    }
    
    if (editingField === 'new') {
      fields.push(fieldToSave);
    } else {
      fields[editingField] = fieldToSave;
    }
    
    setStepForm({ ...stepForm, fields });
    setEditingField(null);
  }

  function handleDeleteField(index) {
    if (!confirm('Delete this field?')) return;
    const fields = [...(stepForm.fields || [])];
    fields.splice(index, 1);
    setStepForm({ ...stepForm, fields });
  }

  function renderMessage() {
    if (!message) return null;
    return (
      <div class={`message ${messageType}`}>
        {message}
        <button onClick={() => setMessage('')} class="message-close">×</button>
      </div>
    );
  }

  function renderBilingualInput(label, value, onChange, placeholderEn, placeholderAm) {
    const lang = localStorage.getItem('agig_language') === 'am' ? 'am' : 'en';
    
    return (
      <div class="form-group">
        <label>{label}</label>
        <div class="bilingual-inputs">
          <div class="lang-input">
            <span class="lang-label">EN</span>
            <input
              type="text"
              value={value?.en || ''}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
              placeholder={placeholderEn || 'English text'}
            />
          </div>
          <div class="lang-input">
            <span class="lang-label">አማ</span>
            <input
              type="text"
              value={value?.am || ''}
              onChange={(e) => onChange({ ...value, am: e.target.value })}
              placeholder={placeholderAm || 'አማርኛ ጽሑፍ'}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderBilingualTextarea(label, value, onChange, placeholderEn, placeholderAm) {
    return (
      <div class="form-group">
        <label>{label}</label>
        <div class="bilingual-inputs">
          <div class="lang-input">
            <span class="lang-label">EN</span>
            <textarea
              value={value?.en || ''}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
              placeholder={placeholderEn || 'English text'}
              rows="2"
            />
          </div>
          <div class="lang-input">
            <span class="lang-label">አማ</span>
            <textarea
              value={value?.am || ''}
              onChange={(e) => onChange({ ...value, am: e.target.value })}
              placeholder={placeholderAm || 'አማርኛ ጽሑፍ'}
              rows="2"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderFieldEditor() {
    if (editingField === null && editingField !== 'new') return null;

    return (
      <div class="field-editor-modal">
        <div class="modal-content">
          <h3>{editingField === 'new' ? 'Add Field' : 'Edit Field'}</h3>
          
          <div class="form-group">
            <label>Field Name</label>
            <input
              type="text"
              value={fieldForm.name}
              onChange={(e) => setFieldForm({...fieldForm, name: e.target.value})}
              placeholder="e.g., businessLicenseNumber"
            />
          </div>

          {renderBilingualInput(
            'Question',
            fieldForm.question,
            (val) => setFieldForm({...fieldForm, question: val}),
            'English question',
            'አማርኛ ጥያቄ'
          )}

          <div class="form-group">
            <label>Validation Type</label>
            <select
              value={fieldForm.validation}
              onChange={(e) => setFieldForm({...fieldForm, validation: e.target.value})}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="choice">Choice</option>
              <option value="license">License</option>
              <option value="phone">Phone</option>
              <option value="plate">Plate</option>
              <option value="vin">VIN</option>
              <option value="year">Year</option>
            </select>
          </div>

          {fieldForm.validation === 'choice' && (
            <div class="form-group">
              <label>Options</label>
              <div class="bilingual-inputs">
                <div class="lang-input">
                  <span class="lang-label">EN</span>
                  <input
                    type="text"
                    value={fieldForm.options?.en?.join(', ') || ''}
                    onChange={(e) => setFieldForm({
                      ...fieldForm, 
                      options: { 
                        ...fieldForm.options,
                        en: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                      }
                    })}
                    placeholder="Option1, Option2, Option3"
                  />
                </div>
                <div class="lang-input">
                  <span class="lang-label">አማ</span>
                  <input
                    type="text"
                    value={fieldForm.options?.am?.join(', ') || ''}
                    onChange={(e) => setFieldForm({
                      ...fieldForm, 
                      options: { 
                        ...fieldForm.options,
                        am: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                      }
                    })}
                    placeholder="አማርኛ አማራጮች"
                  />
                </div>
              </div>
            </div>
          )}

          <div class="form-group">
            <label>Regex Pattern</label>
            <input
              type="text"
              value={fieldForm.regex}
              onChange={(e) => setFieldForm({...fieldForm, regex: e.target.value})}
              placeholder="/^[0-9]{6,10}$/"
            />
          </div>

          {renderBilingualInput(
            'Example Value',
            fieldForm.example,
            (val) => setFieldForm({...fieldForm, example: val}),
            'English example',
            'አማርኛ ምሳሌ'
          )}

          {renderBilingualInput(
            'Error Message',
            fieldForm.error,
            (val) => setFieldForm({...fieldForm, error: val}),
            'Invalid format',
            'ልክ ያልሆነ ቅርጸት'
          )}

          <div class="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={fieldForm.autoFill}
                onChange={(e) => setFieldForm({...fieldForm, autoFill: e.target.checked})}
              />
              Auto-fill from VIN
            </label>
          </div>

          <div class="modal-actions">
            <button onClick={handleSaveField} class="btn-primary">Save Field</button>
            <button onClick={() => setEditingField(null)} class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  function renderStepEditor() {
    if (!showStepEditor) return null;

    return (
      <div class="step-editor-modal">
        <div class="modal-content">
          <h3>Edit Step {stepForm.stepId}</h3>
          
          <div class="form-group">
            <label>Step Type</label>
            <select
              value={stepForm.type}
              onChange={(e) => setStepForm({...stepForm, type: e.target.value})}
            >
              <option value="form">Form</option>
              <option value="subprocess">Subprocess</option>
              <option value="file_upload">File Upload</option>
              <option value="summary">Summary</option>
              <option value="result">Result</option>
            </select>
          </div>

          {renderBilingualInput(
            'Title',
            stepForm.title,
            (val) => setStepForm({...stepForm, title: val}),
            'Step title',
            'የደረጃ ርዕስ'
          )}

          {renderBilingualTextarea(
            'Prompt',
            stepForm.prompt,
            (val) => setStepForm({...stepForm, prompt: val}),
            'Step prompt',
            'የደረጃ መመሪያ'
          )}

          {stepForm.type === 'subprocess' && (
            <div class="form-group">
              {renderBilingualInput(
                'Item Name',
                stepForm.subprocess?.itemName || { en: 'Item', am: 'ንጥል' },
                (val) => setStepForm({
                  ...stepForm,
                  subprocess: {
                    ...stepForm.subprocess,
                    itemName: val,
                    addPrompt: stepForm.subprocess?.addPrompt || { en: 'Add another? (yes/no)', am: 'ሌላ ማከል? (አዎ/አይ)' },
                    continuePrompt: stepForm.subprocess?.continuePrompt || { en: 'Continue? (yes/no)', am: 'መቀጠል? (አዎ/አይ)' },
                    fields: stepForm.subprocess?.fields || []
                  }
                }),
                'e.g., Vehicle',
                'ለምሳሌ: ተሽከርካሪ'
              )}
              
              {renderBilingualInput(
                'Add Prompt',
                stepForm.subprocess?.addPrompt || { en: 'Add another? (yes/no)', am: 'ሌላ ማከል? (አዎ/አይ)' },
                (val) => setStepForm({
                  ...stepForm,
                  subprocess: {
                    ...stepForm.subprocess,
                    addPrompt: val,
                    itemName: stepForm.subprocess?.itemName || { en: 'Item', am: 'ንጥል' },
                    continuePrompt: stepForm.subprocess?.continuePrompt || { en: 'Continue? (yes/no)', am: 'መቀጠል? (አዎ/አይ)' },
                    fields: stepForm.subprocess?.fields || []
                  }
                }),
                'Add prompt',
                'የመጨመር መመሪያ'
              )}
              
              {renderBilingualInput(
                'Continue Prompt',
                stepForm.subprocess?.continuePrompt || { en: 'Continue? (yes/no)', am: 'መቀጠል? (አዎ/አይ)' },
                (val) => setStepForm({
                  ...stepForm,
                  subprocess: {
                    ...stepForm.subprocess,
                    continuePrompt: val,
                    itemName: stepForm.subprocess?.itemName || { en: 'Item', am: 'ንጥል' },
                    addPrompt: stepForm.subprocess?.addPrompt || { en: 'Add another? (yes/no)', am: 'ሌላ ማከል? (አዎ/አይ)' },
                    fields: stepForm.subprocess?.fields || []
                  }
                }),
                'Continue prompt',
                'የመቀጠል መመሪያ'
              )}
            </div>
          )}

          {stepForm.type === 'summary' && (
            <div class="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={stepForm.isFinal || false}
                  onChange={(e) => setStepForm({...stepForm, isFinal: e.target.checked})}
                />
                Final Step
              </label>
            </div>
          )}

          {stepForm.type !== 'file_upload' && stepForm.type !== 'summary' && (
            <div>
              <h4>Fields</h4>
              <div class="fields-list">
                {(stepForm.fields || []).map((field, index) => (
                  <div key={index} class="field-item">
                    <span>{field.name}: {getDisplayValue(field.question)}</span>
                    <div class="field-actions">
                      <button onClick={() => handleEditField(index)}>Edit</button>
                      <button onClick={() => handleDeleteField(index)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleAddField} class="btn-secondary">+ Add Field</button>
            </div>
          )}

          {renderFieldEditor()}

          <div class="form-group">
            <label>Next Step</label>
            <input
              type="number"
              value={stepForm.onValid?.nextStep || stepForm.stepId + 1}
              onChange={(e) => setStepForm({
                ...stepForm,
                onValid: { nextStep: parseInt(e.target.value) || 1 }
              })}
            />
          </div>

          <div class="modal-actions">
            <button onClick={handleSaveStep} class="btn-primary">Save Step</button>
            <button onClick={() => {
              setShowStepEditor(false);
              setEditingStep(null);
            }} class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  function renderServiceForm() {
    if (!isCreating && !editingService) return null;

    const nameDisplay = getDisplayValue(formData.name);
    const descDisplay = getDisplayValue(formData.description);

    return (
      <div class="service-form">
        <h2>{editingService ? 'Edit Service' : 'Create New Service'}</h2>
        
        <div class="form-group">
          <label>Service ID (unique)</label>
          <input
            type="text"
            value={formData.serviceId}
            onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
            placeholder="e.g., iftms"
            disabled={!!editingService}
          />
        </div>

        {renderBilingualInput(
          'Service Name',
          formData.name,
          (val) => setFormData({...formData, name: val}),
          'e.g., IFTMS - Freight Transport',
          'ለምሳሌ: IFTMS - የጭነት ትራንስፖርት'
        )}

        {renderBilingualTextarea(
          'Description',
          formData.description,
          (val) => setFormData({...formData, description: val}),
          'Service description',
          'የአገልግሎት መግለጫ'
        )}

        <div class="form-group">
          <label>Initial Step</label>
          <input
            type="number"
            value={formData.initStep}
            onChange={(e) => setFormData({...formData, initStep: parseInt(e.target.value) || 1})}
            min="1"
          />
        </div>

        <div class="steps-section">
          <h3>Steps</h3>
          <div class="steps-list">
            {Object.entries(formData.steps || {}).map(([stepId, step]) => (
              <div key={stepId} class="step-item">
                <div class="step-info">
                  <strong>Step {stepId}:</strong> {getDisplayValue(step.title) || step.type}
                  <span class="step-type">({step.type})</span>
                  <span class="step-fields">
                    {step.fields ? `${step.fields.length} fields` : ''}
                  </span>
                </div>
                <div class="step-actions">
                  <button onClick={() => handleEditStep(parseInt(stepId))}>Edit</button>
                  <button onClick={() => handleDeleteStep(parseInt(stepId))}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleAddStep} class="btn-secondary">+ Add Step</button>
        </div>

        {renderStepEditor()}

        <div class="form-actions">
          <button onClick={handleSaveService} class="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Service'}
          </button>
          <button onClick={() => {
            setIsCreating(false);
            setEditingService(null);
          }} class="btn-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  function renderServiceList() {
    if (isCreating || editingService) return null;

    return (
      <div class="service-list">
        <div class="list-header">
          <h2>Service Configurations</h2>
          <button onClick={handleCreateNew} class="btn-primary">+ New Service</button>
          <button onClick={refreshFromDB} class="btn-secondary">↻ Refresh</button>
        </div>

        {loading ? (
          <div class="loading">Loading...</div>
        ) : services.length === 0 ? (
          <div class="empty-state">
            <p>No services found in database.</p>
            <button onClick={handleCreateNew} class="btn-primary">Create First Service</button>
          </div>
        ) : (
          <div class="services-grid">
            {services.map((service) => {
              const name = getDisplayValue(service.name);
              const desc = getDisplayValue(service.description);
              return (
                <div key={service.id} class="service-card">
                  <div class="service-header">
                    <h3>{name}</h3>
                    <span class={`status ${service.isActive !== false ? 'active' : 'inactive'}`}>
                      {service.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div class="service-body">
                    <p><strong>ID:</strong> {service.serviceId}</p>
                    <p><strong>Version:</strong> {service.version || 1}</p>
                    <p><strong>Steps:</strong> {Object.keys(service.steps || {}).length}</p>
                    <p><strong>Updated:</strong> {new Date(service.updatedAt).toLocaleString()}</p>
                    {desc && <p><strong>Description:</strong> {desc}</p>}
                  </div>
                  <div class="service-actions">
                    <button onClick={() => handleEditService(service)} class="btn-secondary">Edit</button>
                    <button onClick={() => handleDeleteService(service.serviceId)} class="btn-danger">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div class="service-config-manager">
      <div class="manager-header">
        <h1>⚙️ Service Configuration Manager</h1>
        <button onClick={onClose} class="close-btn">×</button>
      </div>

      {renderMessage()}

      <div class="manager-body">
        {renderServiceList()}
        {renderServiceForm()}
      </div>

      <style>{`
        .service-config-manager {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          z-index: 9999;
          overflow-y: auto;
          padding: 20px;
          color: #e0e0e0;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1a1a2e;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .manager-header h1 {
          margin: 0;
          font-size: 24px;
          color: #fff;
        }

        .close-btn {
          background: none;
          border: none;
          color: #fff;
          font-size: 28px;
          cursor: pointer;
          padding: 0 10px;
        }

        .close-btn:hover {
          color: #ff6b6b;
        }

        .message {
          padding: 12px 20px;
          border-radius: 6px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .message.success {
          background: #2d4a2d;
          color: #81c784;
          border: 1px solid #4caf50;
        }

        .message.error {
          background: #4a2d2d;
          color: #ff6b6b;
          border: 1px solid #f44336;
        }

        .message-close {
          background: none;
          border: none;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
        }

        .list-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .list-header h2 {
          margin: 0;
          flex: 1;
          color: #fff;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .service-card {
          background: #1a1a2e;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #2a2a4e;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .service-header h3 {
          margin: 0;
          color: #fff;
          font-size: 16px;
        }

        .status {
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        }

        .status.active {
          background: #2d4a2d;
          color: #81c784;
        }

        .status.inactive {
          background: #4a2d2d;
          color: #ff6b6b;
        }

        .service-body {
          font-size: 13px;
          color: #aaa;
          margin-bottom: 12px;
        }

        .service-body p {
          margin: 4px 0;
        }

        .service-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #2a2a4e;
        }

        .service-form {
          background: #1a1a2e;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .service-form h2 {
          color: #fff;
          margin-top: 0;
        }

        .form-group {
          margin-bottom: 14px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          color: #ccc;
          font-size: 13px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #2a2a4e;
          border-radius: 4px;
          background: #0d0d1a;
          color: #e0e0e0;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4a6cf7;
        }

        .bilingual-inputs {
          display: flex;
          gap: 10px;
        }

        .lang-input {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lang-input .lang-label {
          font-size: 11px;
          font-weight: bold;
          color: #4a6cf7;
          min-width: 30px;
          text-align: center;
        }

        .lang-input input,
        .lang-input textarea {
          flex: 1;
        }

        .form-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .form-group.checkbox input {
          width: auto;
        }

        .steps-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #2a2a4e;
        }

        .steps-section h3 {
          color: #fff;
          margin-top: 0;
        }

        .steps-list {
          margin-bottom: 12px;
        }

        .step-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #0d0d1a;
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .step-info {
          font-size: 13px;
          color: #ccc;
        }

        .step-type {
          color: #888;
          font-size: 11px;
          margin-left: 8px;
        }

        .step-fields {
          color: #4a6cf7;
          font-size: 11px;
          margin-left: 8px;
        }

        .step-actions,
        .field-actions {
          display: flex;
          gap: 6px;
        }

        .step-actions button,
        .field-actions button {
          padding: 2px 10px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
          background: #2a2a4e;
          color: #ccc;
        }

        .step-actions button:hover,
        .field-actions button:hover {
          background: #3a3a6e;
        }

        .fields-list {
          margin: 8px 0;
        }

        .field-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background: #0d0d1a;
          border-radius: 3px;
          margin-bottom: 4px;
          font-size: 12px;
          color: #aaa;
        }

        .form-actions,
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #2a2a4e;
        }

        .btn-primary {
          padding: 8px 20px;
          background: #4a6cf7;
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary:hover {
          background: #5a7cf7;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 8px 20px;
          background: #2a2a4e;
          border: none;
          border-radius: 4px;
          color: #ccc;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-secondary:hover {
          background: #3a3a6e;
        }

        .btn-danger {
          padding: 6px 14px;
          background: #4a2d2d;
          border: none;
          border-radius: 4px;
          color: #ff6b6b;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-danger:hover {
          background: #5a3d3d;
        }

        .step-editor-modal,
        .field-editor-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background: #1a1a2e;
          padding: 24px;
          border-radius: 8px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          color: #fff;
          margin-top: 0;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #888;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #888;
        }

        .empty-state p {
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
          
          .list-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .modal-content {
            max-width: 100%;
            margin: 10px;
          }

          .bilingual-inputs {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}