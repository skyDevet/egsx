// ============================================================
// Sidebar.jsx - Fixed Version (No service flows in database.js)
// ============================================================

import { useState, useEffect } from 'preact/hooks'
import { db } from '../services/database.js'
import { getServiceConfigDB } from '../services/serviceConfigDB.js' // IMPORT THIS
import { useLanguage } from '../utils/constants.js'
import { ServiceConfigManager } from './ServiceConfigManager.jsx'
import { ServiceConfigTrainer } from './ServiceConfigTrainer.jsx'

export function Sidebar({ 
  isOpen, 
  onClose, 
  currentSessionId, 
  onSessionChange, 
  onNewChat, 
  sessions: propSessions,
  currentStep,
  language,
  setLanguage,
  t,
  auth,
  onAuthClick,
  isAuthenticated
}) {
  const [sessions, setSessions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfigManager, setShowConfigManager] = useState(false)
  const [showTrainer, setShowTrainer] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('idle') // 'idle' | 'ready' | 'exporting'
  const [trainingStats, setTrainingStats] = useState(null)
  const [showTrainingNotification, setShowTrainingNotification] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadChatHistory()
      checkTrainingStatus()
    }
  }, [isOpen])

  useEffect(() => {
    if (propSessions) {
      setSessions(propSessions)
    }
  }, [propSessions])

  const loadChatHistory = async () => {
    try {
      const history = await db.getChatHistory(200)
      const groupedSessions = groupMessagesBySession(history)
      setSessions(groupedSessions)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const groupMessagesBySession = (messages) => {
    const sessionsMap = new Map()
    
    messages.forEach(message => {
      const sessionId = message.sessionId || 'default'
      
      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          sessionId,
          messages: [],
          timestamp: message.timestamp,
          preview: '',
          messageCount: 0
        })
      }
      
      const session = sessionsMap.get(sessionId)
      session.messages.push(message)
      session.messageCount++
      
      if (new Date(message.timestamp) > new Date(session.timestamp)) {
        session.timestamp = message.timestamp
      }
      
      if (!session.preview && message.type === 'user') {
        session.preview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
      }
    })
    
    return Array.from(sessionsMap.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60 * 1000) return 'Just now'
    else if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
    else if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
    else return date.toLocaleDateString()
  }

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat()
    }
    if (onClose) {
      onClose()
    }
  }

  const handleSessionClick = (sessionId) => {
    if (onSessionChange) {
      onSessionChange(sessionId)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleSignOut = () => {
    if (auth && auth.signOut) {
      auth.signOut()
    }
    if (onClose) {
      onClose()
    }
  }

  // ============================================================
  // FIXED: Check training status using ONLY database.js
  // ============================================================
  
  const checkTrainingStatus = async () => {
    try {
      // Only use database.js methods - NO service flows
      const chatHistory = await db.getChatHistory(50)
      
      // Check if there's any chat history
      if (chatHistory && chatHistory.length > 0) {
        setTrainingStatus('ready')
        setTrainingStats({
          chatMessages: chatHistory.length,
          lastUpdated: new Date().toISOString()
        })
      } else {
        setTrainingStatus('idle')
        setTrainingStats(null)
      }
    } catch (error) {
      console.error('Error checking training status:', error)
      setTrainingStatus('idle')
      setTrainingStats(null)
    }
  }

  // ============================================================
  // FIXED: Export training data using ONLY database.js
  // ============================================================
  
  const handleExportTrainingData = async () => {
    try {
      setTrainingStatus('exporting')
      setShowTrainingNotification(true)
      
      // Get data from database.js ONLY
      const chatHistory = await db.getAllChatHistory()
      
      // Prepare training data
      const trainingData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        chatHistory: chatHistory.map(msg => ({
          id: msg.id,
          sessionId: msg.sessionId,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp,
          role: msg.role || 'user'
        })),
        metadata: {
          totalMessages: chatHistory.length,
          language: 'bilingual'
        }
      }
      
      // Create download
      const blob = new Blob([JSON.stringify(trainingData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `training_data_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setTrainingStatus('ready')
      setTimeout(() => {
        setShowTrainingNotification(false)
      }, 5000)
      
    } catch (error) {
      console.error('Error exporting training data:', error)
      setTrainingStatus('idle')
      alert('Error exporting training data: ' + error.message)
    }
  }

  const filteredSessions = sessions.filter(session => 
    session.preview?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div class={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div class={`sidebar ${isOpen ? 'open' : ''}`}>
        <div class="sidebar-header">
          <div class="sidebar-search">
            <span class="material-symbols-rounded">search</span>
            <input 
              class="sidebar-search-input" 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span 
                class="material-symbols-rounded" 
                style={{cursor: 'pointer', fontSize: '18px', color: 'rgba(255,255,255,0.3)'}}
                onClick={() => setSearchQuery('')}
              >close</span>
            )}
          </div>
          <button class="close-btn material-symbols-rounded" onClick={onClose}>close</button>
        </div>
        
        <div class="sidebar-content">
          <div class="chat-history-list">
            {filteredSessions.length === 0 ? (
              <div class="no-chats">
                {searchQuery ? 'No matching conversations' : 'No chat history yet'}
              </div>
            ) : (
              filteredSessions.map(session => (
                <div 
                  key={session.sessionId}
                  class={`chat-session-item ${currentSessionId === session.sessionId ? 'active' : ''}`}
                  onClick={() => handleSessionClick(session.sessionId)}
                >
                  <div class="session-preview">{session.preview || 'New Chat'}</div>
                  <div class="session-meta">
                    <span class="session-date">{formatDate(session.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div class="sidebar-footer">
            <div class="sidebar-config-selector">
              <button 
                class={`config-btn ${showTrainingNotification ? 'has-notification' : ''}`} 
                onClick={() => setShowConfigManager(true)}
                title="Service Configuration Manager"
              >
                <span class="material-symbols-rounded">settings</span>
              </button>
              
              <button 
                class={`trainer-btn ${trainingStatus === 'ready' ? 'has-data' : ''}`} 
                onClick={() => setShowTrainer(true)}
                title="Training Data Manager"
              >
                <span class="material-symbols-rounded">model_training</span>
                {trainingStatus === 'ready' && (
                  <span class="notification-badge">●</span>
                )}
              </button>

              {trainingStatus === 'ready' && (
                <button 
                  class="export-btn"
                  onClick={handleExportTrainingData}
                  title="Export Training Data for Colab"
                >
                  <span class="material-symbols-rounded">download</span>
                </button>
              )}
            </div>

            {showTrainingNotification && (
              <div class="training-notification">
                <span class="notification-icon">✅</span>
                <span class="notification-text">
                  Training data exported! Ready for Colab.
                </span>
                <button 
                  class="notification-close"
                  onClick={() => setShowTrainingNotification(false)}
                >×</button>
              </div>
            )}

            {trainingStats && (
              <div class="training-stats">
                <span class="stat-item">💬 {trainingStats.chatMessages} messages</span>
                <span class="stat-item">🔄 {new Date(trainingStats.lastUpdated).toLocaleDateString()}</span>
              </div>
            )}

            <div class="sidebar-language-selector">
              <span class="material-symbols-rounded">language</span>
              <select 
                class="language-selector-sidebar" 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="am">አማርኛ</option>
              </select>
            </div>

            <div class="sidebar-auth-section">
              {isAuthenticated ? (
                <button class="sidebar-auth-btn" onClick={handleSignOut}>
                  <span class="material-symbols-rounded">logout</span>
                  <span>Sign Out</span>
                </button>
              ) : (
                <button class="sidebar-auth-btn" onClick={onAuthClick}>
                  <span class="material-symbols-rounded">account_circle</span>
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIG MANAGER */}
      {showConfigManager && (
        <ServiceConfigManager onClose={() => setShowConfigManager(false)} />
      )}

      {/* TRAINER */}
      {showTrainer && (
        <ServiceConfigTrainer 
          onClose={() => {
            setShowTrainer(false)
            checkTrainingStatus()
          }} 
        />
      )}

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: -100%;
          width: 320px;
          height: 100%;
          background: #0d0d1a;
          z-index: 1000;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          border-right: 1px solid #1a1a2e;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
        }

        .sidebar.open {
          left: 0;
        }

        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .sidebar-overlay.active {
          opacity: 1;
          pointer-events: all;
        }

        .sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid #1a1a2e;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #0d0d1a;
          flex-shrink: 0;
        }

        .sidebar-search {
          flex: 1;
          display: flex;
          align-items: center;
          background: #1a1a2e;
          border-radius: 8px;
          padding: 0 12px;
          border: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .sidebar-search:focus-within {
          border-color: #4a6cf7;
        }

        .sidebar-search .material-symbols-rounded {
          color: rgba(255,255,255,0.3);
          font-size: 20px;
          margin-right: 8px;
        }

        .sidebar-search-input {
          flex: 1;
          background: none;
          border: none;
          color: #e0e0e0;
          padding: 8px 0;
          font-size: 14px;
          outline: none;
        }

        .sidebar-search-input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .close-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 4px;
          font-size: 20px;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #ff6b6b;
        }

        .sidebar-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-history-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
        }

        .chat-history-list::-webkit-scrollbar {
          width: 4px;
        }

        .chat-history-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-history-list::-webkit-scrollbar-thumb {
          background: #2a2a4e;
          border-radius: 2px;
        }

        .no-chats {
          text-align: center;
          color: rgba(255,255,255,0.3);
          padding: 40px 20px;
          font-size: 14px;
        }

        .chat-session-item {
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 4px;
          transition: background 0.2s;
          border: 1px solid transparent;
        }

        .chat-session-item:hover {
          background: #1a1a2e;
        }

        .chat-session-item.active {
          background: #1a1a2e;
          border-color: #4a6cf7;
        }

        .session-preview {
          color: #e0e0e0;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .session-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .session-date {
          color: rgba(255,255,255,0.3);
          font-size: 11px;
        }

        .sidebar-footer {
          border-top: 1px solid #1a1a2e;
          padding: 12px 16px;
          background: #0d0d1a;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-config-selector {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
          padding-bottom: 8px;
          border-bottom: 1px solid #1a1a2e;
        }

        .config-btn, .trainer-btn, .export-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .config-btn:hover, .trainer-btn:hover, .export-btn:hover {
          background: #1a1a2e;
          color: #fff;
        }

        .trainer-btn.has-data {
          color: #4a6cf7;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          color: #4a6cf7;
          font-size: 8px;
        }

        .training-notification {
          background: #1a3a2e;
          border: 1px solid #2d5a3d;
          border-radius: 6px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideIn 0.3s ease;
        }

        .notification-icon {
          font-size: 16px;
        }

        .notification-text {
          flex: 1;
          font-size: 12px;
          color: #81c784;
        }

        .notification-close {
          background: none;
          border: none;
          color: #81c784;
          cursor: pointer;
          font-size: 16px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .training-stats {
          display: flex;
          gap: 12px;
          justify-content: center;
          padding: 4px 0;
        }

        .training-stats .stat-item {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
        }

        .sidebar-language-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          background: #1a1a2e;
        }

        .sidebar-language-selector .material-symbols-rounded {
          color: rgba(255,255,255,0.5);
          font-size: 18px;
        }

        .language-selector-sidebar {
          background: none;
          border: none;
          color: #e0e0e0;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 0;
          outline: none;
        }

        .language-selector-sidebar option {
          background: #0d0d1a;
          color: #e0e0e0;
        }

        .sidebar-auth-section {
          margin-top: 4px;
        }

        .sidebar-auth-btn {
          width: 100%;
          padding: 8px 12px;
          background: #1a1a2e;
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-size: 13px;
          transition: all 0.2s;
        }

        .sidebar-auth-btn:hover {
          background: #2a2a4e;
          color: #fff;
        }

        .sidebar-auth-btn .material-symbols-rounded {
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 280px;
          }
        }
      `}</style>
    </div>
  )
}