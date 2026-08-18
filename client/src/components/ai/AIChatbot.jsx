import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiChevronDown } from 'react-icons/fi';
import api from '../../services/api';
import styles from './AIChatbot.module.css';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
    // Focus the input so the user can edit or we could just send immediately.
    // For a smoother UX, we will send it immediately.
    handleSendMessage(question);
  };

  // sendMessage abstracts the API call for future Multi-step Agent architecture
  const sendMessage = async (messageText) => {
    setIsLoading(true);
    try {
      // Get the last 6 messages to send as history, excluding system/welcome messages and errors
      const historyToSend = messages
        .filter(m => !m.isWelcome && m.role !== 'error')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      // Call the existing RAG endpoint. api.js already attaches the Bearer token.
      const response = await api.post('/api/rag/query', { 
        question: messageText,
        chatHistory: historyToSend
      });
      
      const aiMessage = {
        id: Date.now().toString() + '_ai',
        role: 'ai',
        content: response.data.answer,
        sources: response.data.sources || []
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chatbot API Error:', error);
      const errorMessage = {
        id: Date.now().toString() + '_error',
        role: 'error',
        content: "Sorry, I couldn't process that request right now. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
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
