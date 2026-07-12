// nlpProcessor.js
// Rebuilt with DistilBERT (distilbert-base-uncased-finetuned-sst-2-english via @xenova/transformers)
// for zero-shot intent classification. All existing logic preserved.

import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'

import nlp from 'compromise'
import { pipeline, env } from '@xenova/transformers'
import { apiHandler } from './API'
import { db } from './database.js'
import { teSsAna } from "./tess.js"
import { teSsAnaC } from "./tessC.js"
import { pdfAnalyzerF } from './pdfAnalyzer.js'
import { pdfAnalyzerD } from '../services/pdfAnalyzer2.js'
import { generateSearchBasedResponse, simulateSearchResults } from './duck.js'
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers';

import {
  isActionButtonText,
  setupIntentPatterns,
  processStepInput,
  generateContinuationHTML,
  isContinuationMessage,
  handleBusinessLicenseInput,
  extractIntents,
  isResumeButton,
  extractEntities,
  extractTextFromPDF,
  extractLicenseNumber,
  analyzeSentiment,
  shouldRequestFileUpload,
  determineResponseType,
  generateContextualResponse,
  setupStepResponses,
  getIftmsResponse,
  getGreetingResponse,
  getHelpResponse,
  getThanksResponse,
  getGeneralResponse,
  addSentimentTone,
  handleActionButton,
  isBusinessLicenseNumber,
  analyzeDocumentContent,
  validateNationalIdDetailed,
  isVehicleChassisNumber,
  isNationalId
} from "./nlpP.js"

// ─── PDF.js worker ────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// ─── DistilBERT Intent Classifier ────────────────────────────────────────────
// We use zero-shot classification via facebook/bart-large-mnli (126MB) OR
// the lighter distilbert-base-uncased-finetuned-sst-2-english (~67MB) for
// binary sentiment. For TRUE intent classification at ~44MB we use
// Xenova/distilbert-base-uncased-mnli which supports zero-shot multi-label.
//
// Model: Xenova/distilbert-base-uncased-mnli  (~44 MB quantized)
// Task : zero-shot-classification

// Configure transformers.js to use the remote CDN cache
env.allowRemoteModels = true
env.useBrowserCache   = true   // cache in IndexedDB after first download

const DISTILBERT_MODEL = 'Xenova/distilbert-base-uncased-mnli'

// These are the candidate intent labels sent to the model.
// Keep them human-readable — they're used directly as NLI hypotheses.
const INTENT_LABELS = [
  'freight transport license application',    // iftms
  'renew business license',                   // renewDoc
  'analyze research paper',                   // analyzeResearch
  'analyze legal document',                   // analyzeLegal
  'verify government document',               // analyzeGovernment
  'analyze financial document',               // analyzeFinancial
  'classify document type',                   // classifyDocument
  'generate video slideshow',                 // generateVideo
  'greeting or salutation',                   // greeting
  'thank you message',                        // thanks
  'help or capabilities request',             // help
  'check application status',                 // status
  'general conversation',                     // general
]

// Map from label string → internal intent key
const LABEL_TO_INTENT = {
  'freight transport license application': 'iftms',
  'renew business license':               'renewDoc',
  'analyze research paper':               'analyzeResearch',
  'analyze legal document':               'analyzeLegal',
  'verify government document':           'analyzeGovernment',
  'analyze financial document':           'analyzeFinancial',
  'classify document type':              'classifyDocument',
  'generate video slideshow':             'generateVideo',
  'greeting or salutation':              'greeting',
  'thank you message':                   'thanks',
  'help or capabilities request':        'help',
  'check application status':            'status',
  'general conversation':                'general',
}

// Priority groups (same as nlpP.js intentCategories)
const PRIMARY_INTENTS   = new Set(['iftms','renewDoc','analyzeResearch','analyzeLegal','analyzeGovernment','analyzeFinancial','classifyDocument','generateVideo'])
const SECONDARY_INTENTS = new Set(['greeting','thanks','help'])
const TERTIARY_INTENTS  = new Set(['status'])

// Singleton classifier — loaded once, reused
let _classifier = null
let _classifierLoading = false
let _classifierReady = false

async function getClassifier() {
  if (_classifierReady) return _classifier
  if (_classifierLoading) {
    // Wait until loading finishes
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (_classifierReady) { clearInterval(check); resolve() }
      }, 100)
    })
    return _classifier
  }

  _classifierLoading = true
  console.log('🤖 Loading DistilBERT zero-shot classifier (~44MB)…')
  try {
    _classifier = await pipeline('zero-shot-classification', DISTILBERT_MODEL)
    _classifierReady = true
    console.log('✅ DistilBERT classifier ready')
  } catch (err) {
    console.error('❌ Failed to load DistilBERT:', err)
    _classifier = null
    _classifierReady = true   // mark ready so we fall back gracefully
  }
  _classifierLoading = false
  return _classifier
}

/**
 * classifyIntentWithBERT(text)
 * Returns an object matching the shape returned by nlpP.js extractIntents():
 * { primary, secondary, tertiary, all, main, isPrimary, isSecondary, isTertiary }
 *
 * Falls back to compromise-based extractIntents() if BERT unavailable or
 * confidence is below threshold.
 */
const CONFIDENCE_THRESHOLD = 0.45   // tweak as needed

async function classifyIntentWithBERT(text, doc) {
  const clf = await getClassifier()

  if (!clf) {
    console.warn('⚠️  BERT unavailable — falling back to rule-based intent')
    return extractIntents(doc)
  }

  let result
  try {
    result = await clf(text, INTENT_LABELS, { multi_label: false })
  } catch (err) {
    console.error('BERT classification error:', err)
    return extractIntents(doc)
  }

  // result.labels is sorted by score descending
  const topLabel  = result.labels[0]
  const topScore  = result.scores[0]
  const topIntent = LABEL_TO_INTENT[topLabel] || 'general'

  console.log(`🎯 BERT top intent: ${topIntent} (${(topScore * 100).toFixed(1)}% confidence) — label: "${topLabel}"`)

  // If confidence too low, fall back to rule-based
  if (topScore < CONFIDENCE_THRESHOLD) {
    console.log('📉 BERT confidence below threshold — using rule-based fallback')
    return extractIntents(doc)
  }

  // Build the same structure as extractIntents()
  const intentsObj = {
    primary:     [],
    secondary:   [],
    tertiary:    [],
    all:         [],
    main:        topIntent,
    isPrimary:   false,
    isSecondary: false,
    isTertiary:  false,
  }

  if (PRIMARY_INTENTS.has(topIntent)) {
    intentsObj.primary.push(topIntent)
    intentsObj.all.push(topIntent)
    intentsObj.isPrimary = true

    // Update session storage (mirrors nlpP.js behaviour)
    sessionStorage.setItem('intnt', topIntent)
    sessionStorage.setItem('currentService', topIntent)
    const currentStep = sessionStorage.getItem('currentStep')
    if (!currentStep || currentStep === '0' || currentStep === 'null') {
      sessionStorage.setItem('currentStep', '1')
    }

  } else if (SECONDARY_INTENTS.has(topIntent)) {
    intentsObj.secondary.push(topIntent)
    intentsObj.all.push(topIntent)
    intentsObj.isSecondary = true

    // Don't override existing service intent
    const existing = sessionStorage.getItem('intnt')
    if (!existing || existing === 'general') {
      sessionStorage.setItem('intnt', topIntent)
    }

  } else if (TERTIARY_INTENTS.has(topIntent)) {
    intentsObj.tertiary.push(topIntent)
    intentsObj.all.push(topIntent)
    intentsObj.isTertiary = true
  } else {
    // general — keep existing service
    intentsObj.all.push('general')
    intentsObj.main = sessionStorage.getItem('intnt') || 'general'
  }

  console.log(`📊 BERT intents: primary=${intentsObj.primary}, secondary=${intentsObj.secondary}, tertiary=${intentsObj.tertiary}`)
  return intentsObj
}

// ─── State variables ───────────────────────────────────────────────────────────
let initialized          = false
let currentIntent        = null
let currentStep          = null
let awaitingBusinessLicense = null
let awaitingVehicleInfo  = null
let awaitingInsInfo      = null
let isLibreValidated     = null
let awaitingDriverInfo   = null
let awaitingOTP          = false
let isDriverValidated    = null
let iSbizValid           = null
let isInsValidated       = null
let isIftmsInit          = false
let ocrBackend           = true
let intentPatterns       = {}
let stepResponses        = {}

// ─── Init ──────────────────────────────────────────────────────────────────────
export async function initNLPProcessor() {
  if (initialized) return

  console.log('🔄 Initializing NLP Processor…')
  setupIntentPatterns()
  setupStepResponses()
  initialized = true
  console.log('✅ NLP Processor initialized')
  console.log('📋 Intent patterns loaded:', Object.keys(intentPatterns))

  // Kick off BERT model loading in the background so it's warm for first query
  getClassifier().catch(console.error)
}

function ensureInitialized() {
  if (!initialized) initNLPProcessor()
}

// ─── chat() ───────────────────────────────────────────────────────────────────
export async function chat(msg, file) {
  ensureInitialized()

  if (file) {
    if (file.type.startsWith('image/')) {
      console.log('🖼️ Image file detected, initialising OCR…')
      const result = await teSsAnaC.analyzeDocument(file)
      if (result.detectedDocument['Insurance Certificate']) {
        // handled downstream
      } else if (result.detectedDocument['Vehicle Registration Document']) {
        if (awaitingVehicleInfo) {
          const currentStepVal = parseInt(sessionStorage.getItem('currentStep')) || 1
          const nextStep       = currentStepVal + 1
          sessionStorage.setItem('currentStep', nextStep.toString())
          sessionStorage.setItem('isLibreValidated', 'true')
          return await processMessage(`continue to step ${nextStep}`, null, false, false)
        }
      }
      return teSsAnaC.analyzeDocument(file)

    } else if (file.type === 'application/pdf') {
      return await pdfAnalyzerF.analyzeDocument(file)

    } else {
      throw new Error('Unsupported file type. Please use image files (JPEG, PNG, etc.)')
    }

  } else if (msg && typeof msg === 'string') {
    console.log('🔍 Checking message:', msg)

    if (isBusinessLicenseNumber(msg)) {
      console.log('✅ Business license detected')
      if (awaitingBusinessLicense) {
        const nextStep = 2
        sessionStorage.setItem('currentStep', nextStep.toString())
        sessionStorage.setItem('licenseValidated', 'true')
        return await processMessage(`continue to step ${nextStep}`, null, false, false)
      } else {
        return await processMessage(`continue to step ${currentStep}`, null, false, false)
      }

    } else if (isVehicleChassisNumber(msg)) {
      console.log('✅ Vehicle chassis detected')
      if (awaitingVehicleInfo) {
        const currentStepVal = parseInt(sessionStorage.getItem('currentStep')) || 1
        const nextStep       = currentStepVal + 1
        sessionStorage.setItem('currentStep', nextStep.toString())
        sessionStorage.setItem('isLibreValidated', 'true')
        return await processMessage(`continue to step ${nextStep}`, null, false, false)
      } else {
        return await processMessage(`continue to step ${currentStep}`, null, false, false)
      }

    } else if (isNationalId(msg).isValid) {
      console.log('✅ National ID detected')
      const currentStepVal = parseInt(sessionStorage.getItem('currentStep')) || 1
      const nextStep       = currentStepVal + 1
      sessionStorage.setItem('currentStep', nextStep.toString())
      sessionStorage.setItem('isDriverValidated', 'true')
      return await processMessage(`continue to step ${nextStep}`, null, false, false)

    } else {
      console.log('📝 Processing regular message…')
      return await processMessage(msg, null, false, false)
    }
  }
}

// ─── processMessage() ─────────────────────────────────────────────────────────
export async function processMessage(message, text, isFile, isImg) {
  ensureInitialized()

  // File / image bookkeeping
  if (isFile) {
    const rslt = await extractLicenseNumber(text)
    iSbizValid = true
    console.log(rslt, text)
  }
  if (isImg) {
    sessionStorage.setItem('isLibreV', true)
  }

  // ── Continuation messages ──────────────────────────────────────────────────
  if (message && isContinuationMessage(message)) {
    console.log('🔄 CONTINUATION MESSAGE:', message)

    const stepMatch  = message.match(/step\s*(\d+)/i)
    const stepNumber = stepMatch
      ? parseInt(stepMatch[1])
      : (parseInt(sessionStorage.getItem('currentStep')) || 1)

    currentStep = stepNumber
    sessionStorage.setItem('currentStep', stepNumber.toString())

    const currentService = sessionStorage.getItem('currentService') || 'iftms'
    const stepR = await processStepInput(
      [currentService], currentStep, 'neutral', '',
      localStorage.getItem('agig-language') || 'en', false
    )

    return {
      text:         stepR.text,
      html:         generateContinuationHTML(stepR, currentStep, localStorage.getItem('agig-language') || 'en'),
      isStructured: true,
      responseType: 'continuation',
      stepData:     stepR,
    }
  }

  // ── Action buttons ─────────────────────────────────────────────────────────
  if (message && isActionButtonText(message)) {
    console.log('🔘 ACTION BUTTON:', message)
    return handleActionButton(message)
  }

  // ── Resume button ──────────────────────────────────────────────────────────
  if (message && isResumeButton(message)) {
    console.log('▶️ RESUME BUTTON:', message)
    return {
      text:         'Continuing from where we left off…',
      html:         `<div class="continue-message">Continuing from where we left off…</div>`,
      isStructured: false,
      responseType: 'continue',
    }
  }

  // ── Business license typed ─────────────────────────────────────────────────
  if (message && isBusinessLicenseNumber(message)) {
    awaitingBusinessLicense = false
    iSbizValid = true
    return handleActionButton('verify and continue')
  }

  // ── Vehicle chassis typed ──────────────────────────────────────────────────
  if (message && isVehicleChassisNumber(message)) {
    awaitingVehicleInfo  = false
    isLibreValidated     = true
    return handleActionButton('Upload Driver Documents')
  }

  // ── Normal NLP processing (with DistilBERT) ────────────────────────────────
  if (message) {
    console.log('🔍 Processing with DistilBERT + compromise NLP:', message)

    const doc       = nlp(message)
    const entities  = extractEntities(doc)
    const sentiment = analyzeSentiment(doc)

    // ── DistilBERT intent classification ──────────────────────────────────
    const intentResult = await classifyIntentWithBERT(message, doc)

    console.log('🎯 Intent result:', {
      primary:   intentResult.primary,
      secondary: intentResult.secondary,
      tertiary:  intentResult.tertiary,
      main:      intentResult.main,
      isPrimary: intentResult.isPrimary,
    })

    currentStep = sessionStorage.getItem('currentStep')

    const existingServiceIntent =
      sessionStorage.getItem('currentIntent') ||
      sessionStorage.getItem('intnt') ||
      'general'

    let primaryIntent = intentResult.main

    // Don't switch service for secondary / tertiary intents
    if (intentResult.isSecondary || intentResult.isTertiary) {
      primaryIntent = existingServiceIntent
      console.log(`💬 Secondary/tertiary — keeping existing service: ${primaryIntent}`)
    } else if (intentResult.isPrimary) {
      console.log(`🎯 Primary intent — switching to: ${primaryIntent}`)
    } else {
      primaryIntent = existingServiceIntent
    }

    // Update current intent if changed AND it's primary
    if (currentIntent !== primaryIntent && intentResult.isPrimary) {
      console.log(`🔄 Intent changed: ${currentIntent} → ${primaryIntent}`)
      currentIntent = primaryIntent
      sessionStorage.setItem('currentIntent', currentIntent)
      sessionStorage.setItem('currentService', currentIntent)

      if (primaryIntent === 'iftms') {
        currentStep = 1
        sessionStorage.setItem('currentStep', currentStep)
        isIftmsInit          = true
        awaitingOTP          = false
        awaitingBusinessLicense = true
      }
    }

    // Get current step from session
    const storedStep = sessionStorage.getItem('currentStep')
    if (storedStep) currentStep = parseInt(storedStep)

    // ── Secondary intent handling (greeting / thanks / help) ──────────────
    if (intentResult.isSecondary) {
      const secondaryIntent = intentResult.secondary[0]
      switch (secondaryIntent) {
        case 'greeting':
          return {
            text:         getGreetingResponse(sentiment),
            html:         `<div class="greeting-response">${getGreetingResponse(sentiment)}</div>`,
            isStructured: false,
            responseType: 'greeting',
          }
        case 'thanks':
          return {
            text:         getThanksResponse(),
            html:         `<div class="thanks-response">${getThanksResponse()}</div>`,
            isStructured: false,
            responseType: 'thanks',
          }
        case 'help':
          return {
            text:         getHelpResponse(),
            html:         getHelpResponse(),
            isStructured: true,
            responseType: 'help',
          }
        default:
          break
      }
    }

    // ── IFTMS flow ─────────────────────────────────────────────────────────
    if (currentIntent === 'iftms') {
      console.log('🚛 IFTMS flow active, step:', currentStep)

      const licenseValidated  = sessionStorage.getItem('licenseValidated') === 'true'
      const isDriverValidatedS = sessionStorage.getItem('isDriverValidated') === 'true'
      const isLibreValidatedS  = sessionStorage.getItem('isLibreValidated') === 'true'

      if (!isIftmsInit && !awaitingBusinessLicense) {
        isIftmsInit          = true
        awaitingBusinessLicense = true
        currentStep          = 1
        sessionStorage.setItem('currentStep', currentStep)
      }

      if (!awaitingBusinessLicense && iSbizValid && !isLibreValidatedS) {
        if (currentStep < 2) {
          currentStep = 2
          sessionStorage.setItem('currentStep', currentStep)
          awaitingVehicleInfo = true
        }
      }

      if (iSbizValid && awaitingVehicleInfo) {
        if (currentStep < 3) {
          currentStep = 3
          sessionStorage.setItem('currentStep', currentStep)
        }
      }

      if (isDriverValidatedS && !isInsValidated) {
        if (currentStep < 4) {
          currentStep          = 4
          sessionStorage.setItem('currentStep', currentStep)
          awaitingBusinessLicense = false
          awaitingVehicleInfo  = false
          awaitingDriverInfo   = false
        }
      }

      const iftmsResponse = await getIftmsResponse(
        currentIntent, currentStep, sentiment, message,
        localStorage.getItem('agig-language') || 'en', isFile
      )

      return generateContextualResponse({
        currentStep:  currentStep,
        intents:      [currentIntent],
        sentiment:    sentiment,
        processedText: message,
        awaitingInput: true,
        language:     localStorage.getItem('agig-language') || 'en',
        shouldUploadFile: false,
        responseType: 'iftms',
        customResponse: iftmsResponse,
      })

    } else {
      // ── Non-IFTMS flow ─────────────────────────────────────────────────
      const responseType = determineResponseType(intentResult.all)

      if (responseType && (intentResult.all.length === 0 || intentResult.all.includes('general'))) {
        return generateSearchBasedResponse(
          responseType, message, localStorage.getItem('agig-language') || 'en'
        )
      }

      return generateContextualResponse({
        intents:      Array.isArray(intentResult) ? intentResult : [intentResult],
        currentStep:  null,
        entities:     entities,
        sentiment:    sentiment,
        processedText: message,
        shouldUploadFile: false,
        responseType: responseType,
        awaitingInput: false,
      })
    }
  }

  // ── Default fallback ────────────────────────────────────────────────────────
  return {
    text:         'How can I help you?',
    html:         '<div>How can I help you?</div>',
    isStructured: false,
    responseType: 'default',
  }
}

// ─── Backward-compat export ───────────────────────────────────────────────────
export const nlpProcessor = {
  init: initNLPProcessor,
  chat,
  processMessage,
}
