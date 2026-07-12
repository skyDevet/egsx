// ============================================================
// ChatUI.jsx - Complete with Markdown Integration
// ============================================================

import { useState, useEffect, useRef } from 'preact/hooks'
import { db } from '../services/database.js'
import { nlpProcessor, chat } from '../services/nlpProcessor.js'
import { pdfAnalyzerF } from '../services/pdfAnalyzer.js'
import { teSsAna } from '../services/tess.js'
import { teSsAnaC } from '../services/tessC.js'
import { useLanguage } from '../utils/constants.js'
import AuthModalX from './AuthModalx.jsx'
import { pdfAnalyzerD } from '../services/pdfAnalyzer2.js'
import { MarkdownRenderer } from './MarkdownRenderer.jsx'
//import {IftmsLogin} from './IftmsLogin'

export function ChatUI(props) {
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const [state, setState] = useState({
    messages: [],
    inputText: '',
    isProcessing: false,
    isTyping: false,
    currentFiles: [],
    currentFile: null,
    showCancelFile: false,
    fileNames: [],
    fileName: '',
    botResponding: false,
    responseStopped: false,
    partialResponse: '',
    uploadedImages: []
  })
  
  const currentTypingInterval = useRef(null)
  const promptForm = useRef(null)
  const fileInput = useRef(null)
  const prevSessionId = useRef(null)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    loadSessionMessages()
    setupSuggestionListeners()
    
    if (!sessionStorage.getItem('currentStep')) {
      sessionStorage.setItem('currentStep', '1')
    }
    
    return () => {
      if (currentTypingInterval.current) {
        clearInterval(currentTypingInterval.current)
      }
      document.body.classList.remove("chats-active", "bot-responding")
    }
  }, [])

  useEffect(() => {
    if (prevSessionId.current !== props.currentSessionId) {
      prevSessionId.current = props.currentSessionId
      loadSessionMessages()
    }
  }, [props.currentSessionId])

  useEffect(() => {
    if (state.botResponding) {
      document.body.classList.add("chats-active", "bot-responding")
    } else {
      document.body.classList.remove("bot-responding")
    }
    
    if (state.messages.length > 0) {
      document.body.classList.add("chats-active")
    } else {
      document.body.classList.remove("chats-active")
    }

    if (state.messages.length === 0) {
      setTimeout(() => setupSuggestionListeners(), 100)
    } else {
      setTimeout(() => setupActionButtonListeners(), 100)
    }
    
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [state.botResponding, state.messages])

  const setupSuggestionListeners = () => {
    setTimeout(() => {
      const suggestionItems = document.querySelectorAll('.suggestions-item')
      suggestionItems.forEach((item) => {
        const newItem = item.cloneNode(true)
        item.parentNode.replaceChild(newItem, item)
        
        newItem.addEventListener('click', async (e) => {
          e.preventDefault()
          e.stopPropagation()
          await handleSuggestionClick(newItem)
        })
      })
    }, 100)
  }

  const setupActionButtonListeners = () => {
    const actionButtons = document.querySelectorAll('.action-btn')
    actionButtons.forEach((button) => {
      const newButton = button.cloneNode(true)
      button.parentNode.replaceChild(newButton, button)
      
      newButton.addEventListener('click', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        await handleActionButtonClick(newButton)
      })
    })
  }

  const handleSuggestionClick = async (suggestionItem) => {
    const textElement = suggestionItem.querySelector('.text')
    if (!textElement) return

    const text = textElement.textContent
    console.log('Suggestion clicked:', text)
    
    if (state.messages.length === 0) {
      if (!props.currentSessionId && props.onNewSession) {
        props.onNewSession()
        setTimeout(() => {
          sendMessage(text, 'user')
          setTimeout(() => generateAIResponse(text), 500)
        }, 100)
      } else {
        await sendMessage(text, 'user')
        setTimeout(() => generateAIResponse(text), 500)
      }
    } else {
      await sendMessage(text, 'user')
      setTimeout(() => generateAIResponse(text), 500)
    }
  }

  const handleActionButtonClick = async (button) => {
    const action = button.dataset.action || button.textContent.trim()
    const service = button.dataset.service || 'iftms'
    const currentStep = parseInt(button.dataset.step || '1')
    const nextStep = parseInt(button.dataset.nextStep || (currentStep + 1))
    
    console.log('Action clicked:', action, 'Service:', service, 'Step:', currentStep, '→', nextStep)
    
    sessionStorage.setItem('currentStep', nextStep.toString())
    sessionStorage.setItem('intnt', service)
    
    await sendMessage(`User selected: ${action}`, 'user')
    
    if (service === 'iftms' && nextStep === 2) {
      setShowAuth(true)
      localStorage.setItem('sSo', nextStep.toString())
      return
    }
    
    await generateAIResponse(action)
  }

  const loadSessionMessages = async () => {
    const { currentSessionId } = props
    if (!currentSessionId) {
      setState(prev => ({ ...prev, messages: [] }))
      return
    }

    try {
      const allMessages = await db.getAllChatHistory()
      const sessionMessages = allMessages.filter(msg => 
        msg.sessionId === currentSessionId && msg.type !== 'system'
      )
      setState(prev => ({ ...prev, messages: sessionMessages }))
    } catch (error) {
      console.error('Failed to load session messages:', error)
    }
  }

  const handleInputChange = (e) => {
    setState(prev => ({ ...prev, inputText: e.target.value }))
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    
    const { inputText, isProcessing } = state
    const { currentSessionId } = props
    
    if (!inputText.trim() || isProcessing) return

    if (!currentSessionId && props.onNewSession) {
      props.onNewSession()
      setTimeout(() => {
        sendMessage(inputText, 'user')
        setState(prev => ({ ...prev, inputText: '' }))
        setTimeout(() => generateAIResponse(inputText), 500)
      }, 100)
    } else {
      await sendMessage(inputText, 'user')
      setState(prev => ({ ...prev, inputText: '' }))
      setTimeout(() => generateAIResponse(inputText), 500)
    }
  }

  const sendMessage = async (content, type = 'user') => {
    const { currentSessionId } = props
    const sessionId = currentSessionId

    if (!sessionId) {
      console.error('No session ID available')
      return
    }

    const message = {
      type,
      content,
      timestamp: new Date().toISOString(),
      sessionId: sessionId
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      isProcessing: type === 'user'
    }))

    try {
      await db.saveChatMessage(message)
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  const generateAIResponse = async (userMessage) => {
    setState(prev => ({ 
      ...prev,
      botResponding: true
    }))
    
    try {
      const nlpResult = await nlpProcessor.chat(userMessage)
      
      if (nlpResult.currentStep === 1 && nlpResult.intentResult?.includes('iftms')) {
        setShowAuth(true)
        localStorage.setItem('sSo', nlpResult.currentStep.toString())
        await typeMessage("Please authenticate to continue with the IFTMS service...", 'bot')
        return
      }
      
      // Use markdown or HTML content
      let responseContent = nlpResult.markdown || nlpResult.html || nlpResult.text || nlpResult
      
      // If it's plain text, wrap in markdown code block for better formatting
      if (typeof responseContent === 'string' && 
          !responseContent.includes('<') && 
          !responseContent.includes('```') &&
          !responseContent.includes('**')) {
        responseContent = responseContent
      }
      
      await typeMessage(responseContent, 'bot')
      
    } catch (error) {
      console.error('NLP processing failed:', error)
      await typeMessage("I'm sorry, I encountered an error processing your request.", 'bot')
    }
  }

  const typeMessage = async (content, type) => {
    setState(prev => ({ 
      ...prev,
      isTyping: true, 
      botResponding: true
    }))
    
    const message = {
      type,
      content: '',
      timestamp: new Date().toISOString(),
      sessionId: props.currentSessionId
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }))

    let index = 0
    clearInterval(currentTypingInterval.current)
    currentTypingInterval.current = setInterval(() => {
      if (index < content.length) {
        const newContent = content.substring(0, index + 1)
        updateLastMessage(newContent)
        index++
      } else {
        finishTyping(content, type)
      }
    }, 10) // Faster typing speed
  }

  const finishTyping = (content, type) => {
    if (currentTypingInterval.current) {
      clearInterval(currentTypingInterval.current)
      currentTypingInterval.current = null
    }
    
    setState(prev => ({ 
      ...prev,
      isProcessing: false, 
      isTyping: false,
      botResponding: false,
      responseStopped: false
    }))
    
    saveFinalMessage(content, type)
  }

  const updateLastMessage = (content) => {
    setState(prevState => {
      const messages = [...prevState.messages]
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content
        }
      }
      return { ...prevState, messages }
    })
  }

  const saveFinalMessage = async (content, type) => {
    try {
      const message = {
        type,
        content,
        timestamp: new Date().toISOString(),
        sessionId: props.currentSessionId
      }
      await db.saveChatMessage(message)
    } catch (error) {
      console.error('Failed to save final message:', error)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setState(prev => ({ 
      ...prev,
      currentFiles: files, 
      isProcessing: true,
      showCancelFile: true,
      fileNames: files.map(f => f.name),
      botResponding: true
    }))

    try {
      await sendMessage(`📎 Uploading ${files.length} file(s)...`, 'user')
      
      for (const file of files) {
        try {
          const result = await nlpProcessor.chat(null, file)
          
          let responseContent = result?.markdown || result?.html || result?.text || 
            (typeof result === 'string' ? result : `📄 Processed: ${file.name}`)
          
          await typeMessage(responseContent, 'bot')
          
        } catch (error) {
          console.error('Error processing file:', error)
          await typeMessage(`❌ Error processing ${file.name}: ${error.message}`, 'bot')
        }
      }
      
    } catch (error) {
      await typeMessage(`❌ Error: ${error.message}`, 'bot')
    } finally {
      setState(prev => ({ 
        ...prev,
        isProcessing: false, 
        currentFiles: [],
        fileNames: []
      }))
      e.target.value = ''
    }
  }

  const displayAnalysisResults = (analysis) => {
    const docType = analysis.documentType || 'Document'
    const typeClass = getDocumentTypeClass(docType)
    const confidence = analysis.confidence || 0
    const pages = analysis.pages || 1
    const wordCount = analysis.wordCount || 0
    const summary = analysis.summary || 'No summary available'
    const topics = analysis.topics || []
    
    const resultsMarkdown = `
## 📊 Document Analysis Complete

### Document Type
**${docType}** *(${Math.round(confidence * 100)}% confidence)*

### Document Size
📄 ${pages} page${pages !== 1 ? 's' : ''} • 📝 ${wordCount.toLocaleString()} words

### 📋 Summary
${summary}

${topics.length > 0 ? `
### 🏷️ Key Topics
${topics.map(topic => `- \`${escapeHtml(topic)}\``).join('\n')}
` : ''}

---
✅ Analysis completed successfully
    `
    
    typeMessage(resultsMarkdown, 'bot')
  }

  const getDocumentTypeClass = (docType) => {
    const typeMap = {
      'Research': 'type-research',
      'Legal': 'type-legal',
      'Financial': 'type-financial',
      'Certificate': 'type-certificate',
      'ID': 'type-id',
      'Contract': 'type-legal',
      'Report': 'type-research',
      'Invoice': 'type-financial'
    }
    return typeMap[docType] || 'type-other'
  }

  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('agig-user', JSON.stringify(userData))
    setShowAuth(false)
    
    const nextStep = parseInt(localStorage.getItem('sSo') || '2')
    sessionStorage.setItem('currentStep', nextStep.toString())
    
    setTimeout(() => {
      generateAIResponse(`Continuing from step ${nextStep}`)
    }, 500)
  }

  const triggerFileInput = () => {
    fileInput.current.click()
  }

  const stopResponse = () => {
    if (currentTypingInterval.current) {
      clearInterval(currentTypingInterval.current)
      currentTypingInterval.current = null
    }
    
    setState(prev => ({ 
      ...prev,
      isTyping: false, 
      isProcessing: false,
      botResponding: false,
      responseStopped: true,
      showCancelFile: false
    }))
    
    sendMessage('Response stopped by user.', 'info')
  }

  const continueResponse = async () => {
    setState(prev => ({
      ...prev,
      responseStopped: false,
      botResponding: true
    }))

    await generateAIResponse("Continuing...")
  }

  const cancelFileUpload = () => {
    stopResponse()
    
    setState(prev => ({
      ...prev,
      currentFile: null,
      showCancelFile: false,
      fileName: '',
      isProcessing: false
    }))
    
    if (fileInput.current) {
      fileInput.current.value = ''
    }
  }

  const renderSuggestions = () => {
    const suggestions = [
      t.vidgen,
      t.acpprvd,
      t.iftmscard,
      t.vgovdoc,
      t.analgdoc
    ]

    return (
      <div class="suggestions-container">
        <ul class="suggestions">
          {suggestions.map((text, index) => (
            <li key={index} class="suggestions-item">
              <div class="suggestion-content">
                <span class="icon material-symbols-rounded">
                  {index === 0 ? 'description' : 
                   index === 1 ? 'local_shipping' : 
                   index === 2 ? 'verified' : 
                   'analytics'}
                </span>
                <p class="text">{text}</p>
              </div>
              <span class="arrow-icon material-symbols-rounded">arrow_forward</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const { 
    messages, 
    inputText, 
    isProcessing, 
    isTyping, 
    showCancelFile, 
    fileName, 
    botResponding, 
    responseStopped 
  } = state

  return (
    <div class="chat-ui">
      {showAuth && (
        <AuthModalX 
          onClose={() => setShowAuth(false)}
          onLogin={handleLogin}
          language={language}
        />
      )}
      
      {messages.length === 0 && renderSuggestions()}
      
      <div class="chats-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index} class={`message ${message.type}-message`}>
            {message.type === 'bot' && (
              <img class="avatar" src=".img/1752692028961-removebg-preview.png" alt="AI Assistant" />
            )}
            <div class="message-content">
              <MarkdownRenderer content={message.content} />
            </div>
            {message.type === 'bot' && !message.content.includes('action-btn') && (
              <div class="message-actions">
                <button class="copy-btn material-symbols-rounded" 
                  onClick={() => {
                    const text = message.content.replace(/<[^>]*>/g, '')
                    navigator.clipboard.writeText(text)
                  }}>
                  content_copy
                </button>
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div class="message bot-message">
            <img class="avatar" src=".img/1752692028961-removebg-preview.png" alt="AI Assistant" />
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {responseStopped && (
          <div class="message info-message">
            <div class="message-content">
              <div class="continue-prompt">
                <p>Response was stopped. Would you like to continue?</p>
                <button class="continue-btn" onClick={continueResponse}>
                  <span class="material-symbols-rounded">play_arrow</span>
                  Continue Response
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(showCancelFile || botResponding) && (
        <div class="file-upload-wrapper active">
          <div class="file-info">
            <span class="file-name" id="loading">
              {fileName || 'Processing...'}
            </span>
            <button 
              id="cancel-file-btn" 
              class="cancel-file material-symbols-rounded"
              onClick={cancelFileUpload}
              title="Cancel operation"
            >
              close
            </button>
          </div>
        </div>
      )}

      <div class="prompt-container">
        <div class="prompt-wrapper">
          <form class="prompt-form" ref={promptForm} onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Request AGS services..." 
              class="prompt-input" 
              value={inputText}
              onInput={handleInputChange}
              required 
              disabled={isProcessing || botResponding}
            />
            <div class="prompt-actions">
              {(botResponding && !responseStopped) ? (
                <button 
                  type="button"
                  id="stop-response-btn" 
                  class="stop-response material-symbols-rounded" 
                  title="Stop Response"
                  onClick={stopResponse}
                >
                  stop_circle
                </button>
              ) : (
                <>
                  <input 
                    type="file" 
                    ref={fileInput}
                    onChange={handleFileSelect}
                    accept=".pdf,image/*,.txt,.doc,.docx" 
                    style={{ display: 'none' }} 
                  />
                  <button 
                    type="button" 
                    class="material-symbols-rounded" 
                    onClick={triggerFileInput}
                    disabled={isProcessing || botResponding}
                  >
                    attach_file
                  </button>
                  <button 
                    type="submit" 
                    class="material-symbols-rounded" 
                    disabled={isProcessing || botResponding || !inputText.trim()}
                  >
                    arrow_upward
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
        <p class="disclaimer-text">Advanced Government Services powered by AI - may occasionally produce errors</p>
      </div>

      <style>{`
        /* Markdown styles */
        .markdown-content {
          font-size: 14px;
          line-height: 1.7;
          color: #e0e0e0;
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          margin: 1.2em 0 0.6em;
          font-weight: 600;
          color: #fff;
        }

        .markdown-content h1 { font-size: 1.8em; }
        .markdown-content h2 { font-size: 1.5em; border-bottom: 1px solid #2a2a4e; padding-bottom: 0.3em; }
        .markdown-content h3 { font-size: 1.2em; }

        .markdown-content p {
          margin: 0.6em 0;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin: 0.6em 0;
          padding-left: 1.8em;
        }

        .markdown-content li {
          margin: 0.3em 0;
        }

        .markdown-content code {
          background: #1a1a2e;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
          color: #4a6cf7;
        }

        .markdown-content pre {
          background: #0d0d1a;
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1em 0;
        }

        .markdown-content pre code {
          background: none;
          padding: 0;
          color: #e0e0e0;
        }

        .markdown-content blockquote {
          border-left: 3px solid #4a6cf7;
          padding-left: 1em;
          margin: 1em 0;
          color: #aaa;
          font-style: italic;
        }

        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }

        .markdown-content table th,
        .markdown-content table td {
          padding: 0.6em 1em;
          border: 1px solid #2a2a4e;
          text-align: left;
        }

        .markdown-content table th {
          background: #1a1a2e;
          color: #fff;
          font-weight: 600;
        }

        .markdown-content table tr:nth-child(even) {
          background: #0d0d1a;
        }

        .markdown-content a {
          color: #4a6cf7;
          text-decoration: none;
        }

        .markdown-content a:hover {
          text-decoration: underline;
        }

        .markdown-content img {
          max-width: 100%;
          border-radius: 6px;
          margin: 0.6em 0;
        }

        .markdown-content .table-wrapper {
          overflow-x: auto;
        }

        .markdown-content .action-btn {
          display: inline-block;
          padding: 8px 16px;
          margin: 4px 6px 4px 0;
          background: #2a2a4e;
          border: none;
          border-radius: 4px;
          color: #e0e0e0;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }

        .markdown-content .action-btn:hover {
          background: #3a3a6e;
        }

        .markdown-content .error {
          color: #ff6b6b;
          background: #4a2d2d;
          padding: 0.8em 1em;
          border-radius: 6px;
          border-left: 3px solid #ff6b6b;
        }

        .markdown-content .success {
          color: #81c784;
          background: #2d4a2d;
          padding: 0.8em 1em;
          border-radius: 6px;
          border-left: 3px solid #4caf50;
        }

        .markdown-content .warning {
          color: #ffd54f;
          background: #4a3d2d;
          padding: 0.8em 1em;
          border-radius: 6px;
          border-left: 3px solid #ffc107;
        }
      `}</style>
    </div>
  )
}