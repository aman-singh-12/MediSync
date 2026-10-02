import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiChevronDown } from 'react-icons/fi';
import api, { API_BASE_URL, getStoredToken } from '../../services/api';
import styles from './AIChatbot.module.css';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll to newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          content: "Hi! I'm the MediSync Assistant. How can I help you?",
          isWelcome: true
        }
      ]);
    }
    if (isOpen && inputRef.current) {
      // Small timeout to allow animation to complete before focus
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen, messages.length]);

  // Cleanup active stream on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    // Focus the input so the user can edit or send immediately.
    handleSendMessage(question);
  };

  // sendMessage abstracts the API call for streaming RAG responses
  const sendMessage = async (messageText) => {
    setIsLoading(true);
    // Add AI placeholder message to UI for streaming
    const aiMessageId = Date.now().toString() + '_ai';
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'ai',
      content: '',
      sources: []
    }]);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Get the last 6 messages to send as history, excluding system/welcome messages and errors
      const historyToSend = messages
        .filter(m => !m.isWelcome && m.role !== 'error')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const token = getStoredToken();
      if (!token) {
        throw new Error('Please sign in to chat with the MediSync Assistant.');
      }
      
      const streamEndpoint = `${API_BASE_URL}/api/rag/query-stream`;
      
      const response = await fetch(streamEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: messageText,
          chatHistory: historyToSend
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        } else if (response.status >= 500) {
          throw new Error('The MediSync AI service is currently unavailable. Please try again shortly.');
        } else {
          throw new Error(`Request failed (Status ${response.status}). Please try again.`);
        }
      }

      setIsLoading(false); // Stop general loading indicator, start streaming text

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '');
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'sources') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, sources: data.sources } : msg
                  ));
                } else if (data.type === 'chunk') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, content: msg.content + data.content } : msg
                  ));
                } else if (data.type === 'error') {
                  console.error('Stream error:', data.message);
                }
              } catch (e) {
                console.warn('Error parsing stream data', e);
              }
            }
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Chatbot API Error:', error);
      let userFriendlyMessage = "Sorry, I couldn't process that request right now. Please try again.";
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userFriendlyMessage = "Unable to connect to the MediSync AI server. Please check your connection or try again.";
      } else if (error.message) {
        userFriendlyMessage = error.message;
      }

      const errorMessage = {
        id: Date.now().toString() + '_error',
        role: 'error',
        content: userFriendlyMessage
      };
      // Remove empty AI placeholder message and replace with error
      setMessages(prev => [...prev.filter(m => m.id !== aiMessageId || m.content), errorMessage]);
      setIsLoading(false);
    }
  };

  const handleSendMessage = (textOverride) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim() || isLoading) return;

    // Add user message to UI
    const newUserMessage = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: textToSend.trim()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    
    // Call API
    sendMessage(textToSend.trim());
  };

  const quickQuestions = [
    "How do I book an appointment?",
    "What should I know before a fasting blood test?",
    "How can I cancel an appointment?"
  ];

  return (
    <div className={styles.chatbotContainer}>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          className={styles.chatButton} 
          onClick={toggleChat}
          aria-label="Open MediSync Assistant"
        >
          <FiMessageSquare />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <div className={styles.headerTitle}>
              <FiMessageSquare /> MediSync Assistant
            </div>
            <button 
              className={styles.closeButton} 
              onClick={toggleChat}
              aria-label="Close Assistant"
            >
              <FiChevronDown />
            </button>
          </div>

          <div className={styles.chatBody}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.messageRow} ${styles[msg.role === 'error' ? 'ai' : msg.role]}`}>
                <div className={`${styles.messageBubble} ${styles[msg.role]}`}>
                  {msg.content}
                  
                  {msg.isWelcome && (
                    <div className={styles.quickQuestions}>
                      {quickQuestions.map((q, idx) => (
                        <button 
                          key={idx} 
                          className={styles.quickQuestionBtn}
                          onClick={() => handleQuickQuestion(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className={styles.sourcesList}>
                      <div className={styles.sourcesTitle}>Sources:</div>
                      <ul>
                        {msg.sources.map((source, idx) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={`${styles.messageRow} ${styles.ai}`}>
                <div className={`${styles.messageBubble} ${styles.ai}`}>
                  <div className={styles.loadingIndicator}>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chatFooter}>
            <div className={styles.inputGroup}>
              <textarea
                ref={inputRef}
                className={styles.chatInput}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask MediSync anything..."
                rows={1}
                disabled={isLoading}
                aria-label="Type your message"
              />
              <button 
                className={styles.sendButton} 
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send message"
              >
                <FiSend />
              </button>
            </div>
            <div className={styles.disclaimer}>
              AI-generated information is for general guidance and does not replace professional medical advice.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
