/**
 * AI Chat Assistant — context-aware churn analytics chatbot.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Zap, RotateCcw } from 'lucide-react'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'

const SUGGESTIONS = [
  "Why is churn increasing?",
  "Who are my high-risk customers?",
  "How can I reduce churn?",
  "What is the revenue impact?",
  "Show retention strategies",
  "How accurate is the AI model?",
]

function MessageBubble({ msg, isLast }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        marginBottom: '1rem',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser
          ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
          : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isUser ? '0 0 10px rgba(30,111,255,0.3)' : '0 0 10px rgba(139,92,246,0.3)',
      }}>
        {isUser ? <User size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        background: isUser
          ? 'linear-gradient(135deg, var(--color-primary), #1A5FD4)'
          : 'var(--color-bg-card)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        color: isUser ? '#fff' : 'var(--color-text-primary)',
        fontSize: '0.875rem', lineHeight: 1.6,
        boxShadow: isUser ? '0 4px 12px rgba(30,111,255,0.25)' : '0 2px 8px rgba(0,0,0,0.2)',
        whiteSpace: 'pre-wrap',
      }}>
        {/* Render markdown-style bold */}
        {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} style={{ color: isUser ? '#fff' : 'var(--color-accent)' }}>{part.slice(2, -2)}</strong>
            : part
        )}
      </div>
    </motion.div>
  )
}

export default function ChatAssistant() {
  const { showToast } = useToast()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hello! I'm your AI Churn Analytics Assistant.\n\nI can help you understand churn patterns, explain predictions, suggest retention strategies, and analyze your customer data.\n\nWhat would you like to know?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await predictionsAPI.chat(msg, history)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, suggestions: res.suggestions }])
    } catch (err) {
      showToast('Chat failed. Please try again.', 'error')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! How can I help you with your churn analytics?",
    }])
  }

  const lastMsg = messages[messages.length - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(30,111,255,0.06))',
          border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(139,92,246,0.4)',
          }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>AI Analytics Assistant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 6px var(--color-success)', animation: 'pulse 2s infinite' }} />
              Online · Powered by ChurnPredictor AI
            </div>
          </div>
        </div>
        <button onClick={clearChat} className="btn-secondary" style={{ padding: '0.4375rem 0.875rem', fontSize: '0.8125rem' }}>
          <RotateCcw size={13} /> Clear
        </button>
      </motion.div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem 1.25rem',
        background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} isLast={i === messages.length - 1} />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} color="#fff" />
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '4px 18px 18px 18px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6' }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion chips */}
        {!loading && lastMsg?.role === 'assistant' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {(lastMsg.suggestions || SUGGESTIONS.slice(0, 3)).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)',
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                  color: '#A78BFA', fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.16)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
        padding: '0.875rem 1rem',
        background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about churn patterns, retention strategies, or customer insights…"
          rows={1}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--color-text-primary)', fontSize: '0.9375rem',
            fontFamily: 'var(--font-sans)', resize: 'none', lineHeight: 1.5,
            maxHeight: 120, overflowY: 'auto',
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
              : 'var(--color-bg-surface)',
            border: `1px solid ${input.trim() && !loading ? 'transparent' : 'var(--color-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            boxShadow: input.trim() && !loading ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
          }}
        >
          <Send size={16} color={input.trim() && !loading ? '#fff' : 'var(--color-text-muted)'} />
        </button>
      </div>

      {/* Quick suggestions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => sendMessage(s)}
            style={{
              padding: '0.3125rem 0.75rem', borderRadius: 'var(--radius-full)',
              background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)', fontSize: '0.75rem', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#A78BFA' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
