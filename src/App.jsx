import { useState, useEffect, useRef } from 'preact/hooks'
import { ChatUI } from './components/ChatUI.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { AuthModal } from './components/AuthModal.jsx'
// In App.jsx, add this state and import
import { ServiceConfigManager } from './components/ServiceConfigManager.jsx';


// Add button in header

//import { modelDownloader } from './services/modelDownloader.js'
//import { loadModels } from './services/nlpProcessor.js'
import { db } from './services/database.js'
import { nlpProcessor } from './services/nlpProcessor.js'
import { pdfAnalyzerF } from './services/pdfAnalyzer.js'
import { pdfAnalyzerD } from './services/pdfAnalyzer2.js'
import { teSsAna } from './services/tess.js'
import { auth } from './services/auth.js'
import { pwa } from './services/pwa.js'
import { googleSearch } from './services/duck.js'
import { useLanguage } from './utils/constants.js'
//import { initQAWorker } from './services/nlpP.js'

export function App() {
  const [initialized, setInitialized] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [ocrStatus, setOcrStatus] = useState('idle')
  const { language, setLanguage, t } = useLanguage()
  
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadError, setDownloadError] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [downloadCompleted, setDownloadCompleted] = useState(false) // Add this state
  
// Add state
const [showConfigManager, setShowConfigManager] = useState(false);
  const authPollInterval = useRef(null)

  useEffect(() => {
    initializeApp()
    loadSessions()
    
    authPollInterval.current = setInterval(() => {
      checkAuthState()
    }, 1000)

    return () => {
      if (authPollInterval.current) {
        clearInterval(authPollInterval.current)
      }
      if (teSsAna.destroy) teSsAna.destroy()
    }
  }, [])

 /* const downloadAndLoadModels = async () => {
    setIsDownloading(true)
    setDownloadError(null)
    setDownloadCompleted(false) // Reset completed state
    
    try {
      const isAndroid = await modelDownloader.detectPlatform()
      
      if (!isAndroid) {
        console.log('💻 Running on browser/PC - models not required')
        setIsDownloading(false)
        setDownloadCompleted(true)
        return true
      }
      
      console.log('🤖 Android detected - downloading Xenova QA model...')
      
      const success = await modelDownloader.downloadQAModel((percent, loaded, total) => {
        setDownloadProgress(percent)
        console.log(`Download: ${Math.round(percent)}% (${(loaded / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB)`)
      })
      
      // Check if download was successful
      if (success) {
        console.log('✅ Download completed successfully')
        
        const qaModel = await modelDownloader.loadModel('question-answering')
        
        if (qaModel && typeof loadModels === 'function') {
          await loadModels(qaModel)
          console.log('✅ QA model loaded into NLP processor')
        }
        
        await modelDownloader.verifyModelSaved()
        
        // Mark as completed before setting isDownloading to false
        setDownloadCompleted(true)
        setIsDownloading(false)
        
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('Model download failed:', error)
      setDownloadError(error.message)
      setDownloadCompleted(false)
      setIsDownloading(false)
      return false
    }
  }

  const verifyModels = async () => {
    console.log('\n🔍 VERIFYING QA MODEL...')
    console.log('='.repeat(50))
    
    const isAndroid = await modelDownloader.detectPlatform()
    console.log(`Platform: ${isAndroid ? 'Android' : 'Browser'}`)
    
    if (isAndroid) {
      const verified = await modelDownloader.verifyModelSaved()
      const status = await modelDownloader.getModelStatus()
      console.log('Model Status:', status)
      setVerificationResult(verified ? '✅ QA Model verified successfully!' : '❌ Verification failed - check console')
      
      // If verification is successful, we can consider download as completed
      if (verified && !downloadCompleted) {
        setDownloadCompleted(true)
        setIsDownloading(false)
      }
    } else {
      setVerificationResult('Not on Android - models not required')
      setDownloadCompleted(true)
      setIsDownloading(false)
    }
    
    console.log('='.repeat(50))
  }*/

  const initializeOCR = async () => {
    try {
      setOcrStatus('loading')
      await teSsAna.init()
      await teSsAna.initializeTesseract()
      setOcrStatus('ready')
    } catch (error) {
      console.error('OCR initialization failed:', error)
      setOcrStatus('error')
    }
  }

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting AGIG App...')
      
      //await downloadAndLoadModels()
      
      await db.init()
      console.log('✅ Database initialized')
      
      await nlpProcessor.init()
      console.log('✅ NLP Processor initialized')
      
      await pdfAnalyzerF.init()
      await pdfAnalyzerD.init()
     // await initializeOCR()
      await googleSearch.init()
      await pwa.init()
      // initQAWorker()
      if (auth && auth.init) {
        auth.init()
      }
      
      setInitialized(true)
      console.log('🎉 AGIG initialized successfully!')
      
    } catch (error) {
      console.error('App initialization failed:', error)
      setInitialized(true)
      setIsDownloading(false) // Ensure downloading state is cleared on error
    }
  }

  // Add a function to manually complete the download and proceed
  const proceedToApp = () => {
    setIsDownloading(false)
    setDownloadCompleted(true)
    if (!initialized) {
      initializeApp()
    }
  }

  // Check if we should show download screen
  if (isDownloading && !downloadCompleted) {
    return (
      <div class="download-screen">
        <div class="download-card">
          <div class="download-icon">🤖</div>
          <h2>Downloading Xenova QA Model for Android</h2>
          <p>DistilBERT Question Answering Model (66 MB)</p>
          
          <div class="model-progress">
            <div class="model-row">
              <div class="model-name">DistilBERT QA Model Q8</div>
              <div class="model-size">~66 MB</div>
              <div class="model-percent">{Math.round(downloadProgress)}%</div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style={{ width: `${downloadProgress}%` }}></div>
            </div>
          </div>
          
          <div class="total-progress">
            <div class="total-label">Download Progress</div>
            <div class="progress-bar">
              <div class="progress-fill" style={{ width: `${downloadProgress}%` }}></div>
            </div>
          </div>
          
          <div class="button-group">
            <button 
              onClick={verifyModels}
              style={{ marginTop: '20px', background: '#666' }}
              class="verify-btn"
            >
              🔍 Verify Download (Check Console)
            </button>
            
            {/* Add proceed button for when download is stuck but actually complete */}
            {downloadProgress >= 100 && (
              <button 
                onClick={proceedToApp}
                style={{ marginTop: '20px', background: '#4caf50' }}
                class="proceed-btn"
              >
                ✓ Proceed to App (Download Complete)
              </button>
            )}
          </div>
          
          <p class="download-note">Model will be saved permanently to device storage</p>
        </div>
      </div>
    )
  }

  if (downloadError) {
    return (
      <div class="download-screen error">
        <div class="download-card">
          <div class="error-icon">⚠️</div>
          <h2>Download Failed</h2>
          <p>{downloadError}</p>
          <button onClick={() => window.location.reload()} class="retry-btn">
            Retry Download
          </button>
        </div>
      </div>
    )
  }

  if (!initialized) {
    return (
      <div class="loading-screen">
        <div class="spinner"></div>
        <p>Initializing AGIG...</p>
        {ocrStatus === 'loading' && <p>Loading OCR engine...</p>}
      </div>
    )
  }

  return (
    <div class="app">
      <header class="header-bar">
        <div class="header-content">
          <button class="logo-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <img src=".img/1752692028961-removebg-preview.png" alt="AGIG" class="logo" />
            <span style={{color:'gold'}} class="app-name">Mesobwork</span>
          </button>
          
          <button class="new-chat-header-btn" onClick={() => {
            const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            setCurrentSessionId(newSessionId)
          }}>
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>
      </header>

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentSessionId={currentSessionId}
        onSessionChange={setCurrentSessionId}
        onNewChat={() => {
          const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          setCurrentSessionId(newSessionId)
        }}
        sessions={sessions}
        language={language}
        setLanguage={setLanguage}
        t={t}
        auth={auth}
        onAuthClick={() => setAuthModalOpen(!authModalOpen)}
        isAuthenticated={auth.getIsAuthenticated?.() || false}
      />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={() => {
          setTimeout(() => checkAuthState(), 500)
          setAuthModalOpen(false)
        }}
      />

      <div class="container">
        <header class="app-header">
  
          <h1 class="heading">AGIG PWA</h1>
          <h4 class="sub-heading">
            {auth.getIsAuthenticated?.() ? 'Welcome back!' : 'Your AI Document Assistant'}
          </h4>
          {verificationResult && <p style={{fontSize: '12px', color: '#666'}}>{verificationResult}</p>}
        </header>
       
        <ChatUI 
          currentSessionId={currentSessionId} 
          onNewSession={() => {
            const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            setCurrentSessionId(newSessionId)
          }}
          ocrEngine={teSsAna}
          language={language}
        />
      </div>
    </div>
  )
}