import React, { useEffect, useMemo, useRef, useState } from 'react';
import aiAPI from '../services/ai';

const STARTERS = [
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    text: 'Summarize my deadlines this week.' 
  },
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    ),
    text: 'Help me draft a formal request email to administration.' 
  },
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5h16M6 12.5h12M6 5.5h12"></path>
      </svg>
    ),
    text: 'Show my PFE subject and defense status.' 
  },
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
    ),
    text: 'Explain the appeal process for disciplinary decisions.' 
  },
];

export default function AIAssistantPage() {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const emptyState = useMemo(() => history.length === 0, [history.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const normalizeAssistantText = (text) =>
    String(text || '')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .replace(/`{1,3}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const sendPrompt = async (text) => {
    const content = text.trim();
    if (!content || isTyping) return;

    setHistory((prev) => [...prev, { role: 'user', content }]);
    setPrompt('');
    setIsTyping(true);

    try {
      const apiHistory = history.slice(-10).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await aiAPI.chat({
        message: content,
        history: apiHistory,
      });

      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: normalizeAssistantText(response?.data?.reply || 'No response returned from AI service.'),
        },
      ]);
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error?.message || 'AI service is unavailable right now.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendPrompt(prompt);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Conversation Hub - Centered, Scrollable */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '768px',
          width: '100%',
          margin: '0 auto',
          padding: '0 16px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Messages Container - Only this scrolls, not the whole page */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            gap: '16px',
            paddingRight: '8px',
            paddingBottom: '16px',
          }}
        >
          {emptyState ? (
            /* Zero-State: Starter Card Grid */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '32px',
                minHeight: 'min(600px, 60vh)',
              }}
            >
              {/* Welcome Message */}
              <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                    margin: 0,
                  }}
                >
                  Welcome to AI Assistant
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-ink-secondary)',
                    marginTop: '8px',
                    margin: 0,
                  }}
                >
                  Ask me about your studies, deadlines, PFE, or any academic questions
                </p>
              </div>

              {/* Starter Cards Grid - 2x2 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  width: '100%',
                }}
              >
                {STARTERS.map((starter, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendPrompt(starter.text)}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-edge-subtle)',
                      background: 'var(--color-surface)',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease-out',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '12px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-edge-strong)';
                      e.currentTarget.style.background = 'var(--color-surface-200)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-edge-subtle)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        color: 'var(--color-brand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                      }}
                    >
                      {starter.icon}
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--color-ink)',
                        margin: 0,
                        lineHeight: '1.4',
                      }}
                    >
                      {starter.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation Thread */
            history.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'slideIn 0.3s ease-out',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {/* Metadata */}
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-ink-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                      paddingX: '12px',
                      textAlign: item.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    {item.role === 'user' ? 'You' : 'Assistant'}
                  </p>

                  {/* Message Bubble */}
                  <div
                    style={{
                      borderRadius: '12px',
                      padding: '12px 16px',
                      background:
                        item.role === 'user'
                          ? 'var(--color-brand)'
                          : 'var(--color-surface-200)',
                      border:
                        item.role === 'user'
                          ? 'none'
                          : '1px solid var(--color-edge-subtle)',
                      boxShadow:
                        item.role === 'user'
                          ? '0 2px 8px rgba(29, 78, 216, 0.15)'
                          : 'none',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color:
                          item.role === 'user'
                            ? '#ffffff'
                            : 'var(--color-ink)',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <div
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--color-edge-subtle)',
                  background: 'var(--color-surface-200)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-ink-tertiary)',
                    animation: 'pulse 1.4s infinite',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-ink-tertiary)',
                    animation: 'pulse 1.4s infinite',
                    animationDelay: '0.2s',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-ink-tertiary)',
                    animation: 'pulse 1.4s infinite',
                    animationDelay: '0.4s',
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-ink-secondary)',
                    marginLeft: '8px',
                  }}
                >
                  Assistant is typing...
                </span>
              </div>
            </div>
          )}

          {/* Scroll Anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Command Bar - Glassmorphic Pill */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          maxWidth: '768px',
          width: 'calc(100% - 32px)',
          padding: '16px',
          background: 'rgba(248, 249, 251, 0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(var(--color-edge-subtle-rgb, 0, 0, 0), 0.1)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
        }}
      >
          {/* Textarea with integrated icons */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              borderRadius: '12px',
              border: '1px solid var(--color-edge)',
              background: 'var(--color-surface)',
              padding: '10px 12px',
              gap: '8px',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Attachment Icon */}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                opacity: 0.5,
                transition: 'opacity 150ms ease-out',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
            >
              📎
            </button>

            {/* Input Field */}
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit(e);
                }
              }}
              placeholder="Ask me anything about your studies..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '13px',
                color: 'var(--color-ink)',
                maxHeight: '100px',
                fontFamily: 'inherit',
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                verticalAlign: 'middle',
              }}
              rows={1}
            />

            {/* Voice Icon */}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                opacity: 0.5,
                transition: 'opacity 150ms ease-out',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
            >
              🎤
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isTyping}
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(29, 78, 216, 0.3)',
              background: prompt.trim() && !isTyping 
                ? 'rgba(29, 78, 216, 0.4)' 
                : 'rgba(169, 174, 184, 0.15)',
              backdropFilter: 'blur(8px)',
              color: prompt.trim() && !isTyping ? '#ffffff' : 'var(--color-ink-muted)',
              padding: '8px 16px',
              fontSize: '12px',
              cursor: prompt.trim() && !isTyping ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease-out',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (prompt.trim() && !isTyping) {
                e.currentTarget.style.background = 'rgba(29, 78, 216, 0.6)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (prompt.trim() && !isTyping) {
                e.currentTarget.style.background = 'rgba(29, 78, 216, 0.4)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            ➤
          </button>
      </form>

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }

        @supports (backdrop-filter: blur(1px)) {
          form {
            backdrop-filter: blur(12px);
          }
        }

        textarea::-webkit-scrollbar {
          width: 4px;
        }

        textarea::-webkit-scrollbar-track {
          background: transparent;
        }

        textarea::-webkit-scrollbar-thumb {
          background: var(--color-edge);
          border-radius: 2px;
        }

        textarea::-webkit-scrollbar-thumb:hover {
          background: var(--color-edge-strong);
        }

        /* Dark mode support */
        .dark form {
          background: rgba(26, 29, 37, 0.1);
        }

        /* Ensure form doesn't scroll with page content */
        form {
          will-change: transform;
        }
      `}</style>
    </div>
  );
}

