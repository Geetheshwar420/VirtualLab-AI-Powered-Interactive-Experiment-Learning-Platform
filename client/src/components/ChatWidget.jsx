import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function ChatWidget({ experimentId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [, forceTick] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Tick while cooling down so countdown can update
  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Prevent sending during cooldown (e.g., after 429)
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const remain = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setMessages(prev => [...prev, { type: 'ai', text: `Please wait ${remain}s before sending another message.` }]);
      return;
    }

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      if (!experimentId) {
        setMessages(prev => [...prev, { type: 'ai', text: 'Please go to an experiment page to ask questions about that specific experiment. I can help you better with experiment-specific context!' }]);
        setLoading(false);
        return;
      }

      const response = await axios.post(
        '/api/ai/chat',
        { experiment_id: experimentId, message: userMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setMessages(prev => [...prev, { type: 'ai', text: response.data.response }]);
    } catch (err) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.error;
      if (status === 429) {
        const waitMs = 30000; // 30 seconds
        setCooldownUntil(Date.now() + waitMs);
        setMessages(prev => [...prev, { type: 'ai', text: apiMsg || 'Rate limit reached. Please wait 30 seconds and try again.' }]);
      } else if (status === 401 || status === 403) {
        setMessages(prev => [...prev, { type: 'ai', text: apiMsg || 'AI service not authorized. Please check configuration.' }]);
      } else {
        setMessages(prev => [...prev, { type: 'ai', text: apiMsg || 'Error: Could not get response. Try again in a moment.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 5px 40px rgba(0, 0, 0, 0.16)',
          width: '380px',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px 12px 0 0',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🤖 AI Tutor</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#999',
                fontSize: '14px',
                padding: '20px 10px'
              }}>
                {experimentId ? '👋 Hi! Ask me anything about this experiment.' : '👋 Hi! Go to an experiment page to ask questions about it.'}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '8px'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: msg.type === 'user' ? '#667eea' : '#e8eaf6',
                    color: msg.type === 'user' ? 'white' : '#333',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    wordWrap: 'break-word'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '18px 18px 18px 4px',
                  backgroundColor: '#e8eaf6',
                  color: '#667eea'
                }}>
                  ⏳ Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '12px',
            borderTop: '1px solid #eee',
            backgroundColor: 'white'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && !(cooldownUntil && Date.now() < cooldownUntil) && handleSendMessage()}
              placeholder="Type your question..."
              disabled={loading || (cooldownUntil && Date.now() < cooldownUntil)}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim() || (cooldownUntil && Date.now() < cooldownUntil)}
              style={{
                padding: '10px 16px',
                borderRadius: '20px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                cursor: (loading || !input.trim() || (cooldownUntil && Date.now() < cooldownUntil)) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: (loading || !input.trim() || (cooldownUntil && Date.now() < cooldownUntil)) ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? '...' : (cooldownUntil && Date.now() < cooldownUntil) ? 'Wait' : '→'}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isOpen ? '#764ba2' : '#667eea',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '28px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          zIndex: 999,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          hover: {
            transform: 'scale(1.1)'
          }
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        💬
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default ChatWidget;
