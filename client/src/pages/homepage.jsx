import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faUser, faPaperPlane, faSignOutAlt, faBars, faTimes, faStop } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { InferenceClient } from "@huggingface/inference";

const Homepage = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentRequestIdRef = useRef(null);

  const aiProfile = {
    name: "HanceAI",
    logo: "../logoicon.svg",
  };

  const aiLogo = {
    name: "HanceAI",
    logo: "../Logo.svg",
  };

  // Helper to clean AI response
  const cleanResponse = (text) => {
    if (!text) return '';
    // Remove <think> tags and markdown code block markers
    return text
      .replace(/<think>|<\/think>/g, '')
      .replace(/```markdown\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  };

  // Stop typing animation and abort request
  const stopTyping = async () => {
    // Stop the typing animation
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    
    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Also send abort request to backend if we have a request ID
    if (currentRequestIdRef.current) {
      try {
        await fetch('http://localhost:5000/api/chat/abort', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: currentRequestIdRef.current,
          }),
        });
      } catch (error) {
        console.log('Failed to send abort signal to backend:', error);
      }
      currentRequestIdRef.current = null;
    }
    
    setIsAiTyping(false);
  };

  // Typing animation
  const simulateTyping = (fullText) => {
    let index = 0;
    typingIntervalRef.current = setInterval(() => {
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.sender === 'ai') {
          if (index < fullText.length) {
            const updatedLastMessage = {
              ...lastMessage,
              text: fullText.substring(0, index + 1),
            };
            index++;
            return [...prevMessages.slice(0, -1), updatedLastMessage];
          } else {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
            setIsAiTyping(false);
            return prevMessages;
          }
        }
        return prevMessages;
      });
    }, 30); // typing speed
  };


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
    } else {
      navigate('/login');
    }

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      stopTyping();
    };
  }, [navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    // If AI is typing, stop it first
    if (isAiTyping) {
      await stopTyping();
      return;
    }

    if (inputValue.trim() === '') return;

    const newUserMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
    };

    setMessages(prev => [...prev, newUserMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsAiTyping(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentRequestIdRef.current = requestId;

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          message: userInput,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid response from server');
      }

      const cleanText = cleanResponse(data.response);

      const initialAiMessage = {
        id: Date.now() + 1,
        text: cleanText.charAt(0) || cleanText,
        sender: 'ai',
      };
      setMessages(prev => [...prev, initialAiMessage]);
      
      if (cleanText.length > 1) {
        simulateTyping(cleanText);
      } else {
        setIsAiTyping(false);
        currentRequestIdRef.current = null;
      }
      

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted by user');
        // Remove the loading dots message if it exists
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.sender === 'ai' && lastMessage.text === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setIsAiTyping(false);
        currentRequestIdRef.current = null;
        return;
      }
      
      console.error('Error communicating with AI:', error);
      const aiError = {
        id: Date.now() + 1,
        text: "Oops! Something went wrong connecting to AI. " + error.message,
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiError]);
      setIsAiTyping(false);
      currentRequestIdRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    stopTyping();
    setMessages([]);
    setInputValue('');
    setShowMobileSidebar(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 z-20 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="text-white text-xl"
        >
          <FontAwesomeIcon icon={showMobileSidebar ? faTimes : faBars} />
        </button>
          <div className="h-8 flex items-center justify-center">
            <img src="/Logo.svg" alt="AI" className="h-full w-auto object-contain" />
          </div>
        <button
          className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-300"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <FontAwesomeIcon icon={faUser} className="text-sm" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:static w-64 md:w-24 h-full bg-gray-900 flex flex-col items-center py-6 transition-transform duration-300 ease-in-out z-40`}>
        <div className="mb-16">
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center">
            <img src={aiProfile.logo} alt="AI" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <button 
            className="mb-6 text-gray-400 hover:text-white transition-colors"
            onClick={handleNewChat}
            title="New Chat"
          >
            <div className="text-2xl">
              <FontAwesomeIcon icon={faCommentDots} />
            </div>
          </button>
        </div>
        <div className="mt-auto relative md:block hidden" ref={profileMenuRef}>
          <button
            className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-gray-700 cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-xl">
              <FontAwesomeIcon icon={faUser} />
            </div>
          </button>

          {/* Profile hover menu - Desktop */}
          {showProfileMenu && (
            <div className="absolute bottom-16 left-0 w-48 bg-gray-800 rounded shadow-lg py-2 z-10">
              <div className="px-4 py-2 border-b border-gray-700">
                <p className="text-sm font-medium">Signed in as</p>
                <p className="text-sm font-bold truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email || ''}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center text-sm"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Profile Menu */}
      {showProfileMenu && (
        <div className="md:hidden fixed top-14 right-4 w-48 bg-gray-800 rounded shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-sm font-medium">Signed in as</p>
            <p className="text-sm font-bold truncate">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center text-sm"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            Sign out
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col pt-14 md:pt-0">

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 relative">
          {messages.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
                <img src={aiLogo.logo} alt="HanceAI" className="max-w-full max-h-full object-center" />
              </div>
              {currentUser && (
                <div className="text-center mt-4 text-gray-400 text-sm md:text-base">
                  Welcome back, {currentUser.name}!
                </div>
              )}
            </div>
          )}
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0 mr-2 flex items-center justify-center">
                    <img src={aiProfile.logo} alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base ${
                    message.sender === 'user'
                      ? 'bg-purple-900 bg-opacity-50 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {message.sender === 'ai' ? (
                    <div className="markdown-content">
                      <Markdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2 text-white" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2 text-white" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-2 mb-1 text-white" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-purple-300" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                          code: ({node, inline, ...props}) => 
                            inline ? (
                              <code className="bg-gray-900 px-1.5 py-0.5 rounded text-purple-300 font-mono text-sm" {...props} />
                            ) : (
                              <code className="block bg-gray-900 p-3 rounded-md my-2 overflow-x-auto font-mono text-sm text-green-300" {...props} />
                            ),
                          pre: ({node, ...props}) => <pre className="bg-gray-900 rounded-md my-2 overflow-x-auto" {...props} />,
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-3">
                              <table className="min-w-full border-collapse border border-gray-600 text-sm" {...props}>
                                {props.children}
                              </table>
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-gray-700" {...props} />,
                          tr: ({node, ...props}) => <tr className="border-b border-gray-600" {...props} />,
                          th: ({node, ...props}) => <th className="border border-gray-600 px-3 py-2 text-left font-semibold" {...props} />,
                          td: ({node, ...props}) => <td className="border border-gray-600 px-3 py-2" {...props} />,

                          hr: ({node, ...props}) => <hr className="my-3 border-gray-600" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic my-2 text-gray-300" {...props} />,
                          a: ({node, ...props}) => <a className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                      >
                        {message.text}
                      </Markdown>

                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="mb-6 flex justify-start">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0 mr-2 flex items-center justify-center">
                  <img src={aiProfile.logo} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-2xl px-4 md:px-6 py-3 md:py-4 text-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-center gap-2 md:gap-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAiTyping ? "AI is responding..." : "Enter your prompt here"}
                className="w-full bg-black border border-purple-800 rounded-full py-3 px-4 md:py-4 md:px-6 text-sm md:text-base text-white focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAiTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!isAiTyping && inputValue.trim() === ''}
                className={`${
                  isAiTyping 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed'
                } rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white cursor-pointer flex-shrink-0 transition-colors`}
                title={isAiTyping ? 'Stop generating' : 'Send message'}
              >
                <FontAwesomeIcon 
                  icon={isAiTyping ? faStop : faPaperPlane} 
                  className="text-sm md:text-base" 
                />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Homepage;