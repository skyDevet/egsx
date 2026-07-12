(function(){"use strict";let a=null,i=!1;async function c(){console.log("🚀 Loading Qwen...");try{const{pipeline:n,env:e}=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/dist/transformers.min.js");e.useBrowserCache=!0,a=await n("text-generation","onnx-community/Qwen2.5-0.5B-Instruct",{quantized:!0,device:"wasm"}),i=!0,console.log("✅ Qwen ready"),self.postMessage({type:"ready"})}catch(n){console.error("Load failed:",n),i=!0,self.postMessage({type:"ready"})}}function u(n,e){const t=n.steps[e.currentStep];return t?(t.fields||t.subprocess?.fields||[])[e.currentFieldIndex]:null}function d(n,e,t){const s=n.steps[e.currentStep],o=u(n,e),r=s.fields||s.subprocess?.fields||[];return`You are ${n.name} assistant.

Current step: ${e.currentStep}
Step type: ${s.type}
Field: ${o?.name||"unknown"}
Question: "${o?.question||"Enter value"}"
Field ${e.currentFieldIndex+1} of ${r.length}
Waiting for add: ${e.waitingForAdd}
Waiting for continue: ${e.waitingForContinue}
Collected: ${JSON.stringify(e.collectedData)}

User: "${t}"

Return ONLY JSON. Options:
{"action":"save","value":"the value"}
{"action":"yes"}
{"action":"no"}
{"action":"step_complete"}
{"action":"help"}
{"action":"status"}
{"action":"switch_service","service":"iftms"}

Response:`}async function p(n,e,t){if(console.log("Message:",t),!a||!i)return{action:"save",value:t};const s=d(n,e,t);try{const r=(await a(s,{max_new_tokens:80,temperature:.1,do_sample:!1,return_full_text:!1}))[0].generated_text;console.log("Qwen:",r);const l=r.match(/\{[\s\S]*?\}/);if(l)return JSON.parse(l[0])}catch(o){console.error("Error:",o)}return{action:"save",value:t}}self.addEventListener("message",async n=>{const{type:e,data:t,id:s}=n.data;if(e==="predict"){const o=await p(t.serviceConfig,t.currentState,t.userMessage);self.postMessage({type:"response",data:o,id:s})}}),c()})();
