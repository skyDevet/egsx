// ============================================================
// modelWorker.js - COMPLETE WORKING FILE
// ============================================================

let generator = null;
let isReady = false;

async function loadModel() {
  console.log("🚀 Loading Qwen...");
  
  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/dist/transformers.min.js');
    
    env.useBrowserCache = true;
    
    generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', { 
        quantized: true,
        device: 'wasm'
    });
    
    isReady = true;
    console.log("✅ Qwen ready");
    self.postMessage({ type: 'ready' });
    
  } catch (error) {
    console.error("Load failed:", error);
    isReady = true;
    self.postMessage({ type: 'ready' });
  }
}

function getCurrentField(serviceConfig, currentState) {
  const step = serviceConfig.steps[currentState.currentStep];
  if (!step) return null;
  const fields = step.fields || step.subprocess?.fields || [];
  return fields[currentState.currentFieldIndex];
}

function buildPrompt(serviceConfig, currentState, userMessage) {
  const step = serviceConfig.steps[currentState.currentStep];
  const currentField = getCurrentField(serviceConfig, currentState);
  const fields = step.fields || step.subprocess?.fields || [];
  
  let context = `You are ${serviceConfig.name} assistant.

Current step: ${currentState.currentStep}
Step type: ${step.type}
Field: ${currentField?.name || 'unknown'}
Question: "${currentField?.question || 'Enter value'}"
Field ${currentState.currentFieldIndex + 1} of ${fields.length}
Waiting for add: ${currentState.waitingForAdd}
Waiting for continue: ${currentState.waitingForContinue}
Collected: ${JSON.stringify(currentState.collectedData)}

User: "${userMessage}"

Return ONLY JSON. Options:
{"action":"save","value":"the value"}
{"action":"yes"}
{"action":"no"}
{"action":"step_complete"}
{"action":"help"}
{"action":"status"}
{"action":"switch_service","service":"iftms"}

Response:`;

  return context;
}

async function predictNextStep(serviceConfig, currentState, userMessage) {
  console.log("Message:", userMessage);
  
  if (!generator || !isReady) {
    return { action: 'save', value: userMessage };
  }
  
  const prompt = buildPrompt(serviceConfig, currentState, userMessage);
  
  try {
    const result = await generator(prompt, {
      max_new_tokens: 80,
      temperature: 0.1,
      do_sample: false,
      return_full_text: false
    });
    
    const output = result[0].generated_text;
    console.log("Qwen:", output);
    
    const jsonMatch = output.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error("Error:", err);
  }
  
  return { action: 'save', value: userMessage };
}

self.addEventListener('message', async (e) => {
  const { type, data, id } = e.data;
  
  if (type === 'predict') {
    const result = await predictNextStep(data.serviceConfig, data.currentState, data.userMessage);
    self.postMessage({ type: 'response', data: result, id });
  }
});

loadModel();