import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faUser, faPaperPlane, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

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
    return text.replace(/<think>|<\/think>/g, '').trim();
  };

  // Typing animation
  const simulateTyping = (fullText) => {
    let index = 0;
    const typingInterval = setInterval(() => {
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
            clearInterval(typingInterval);
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
    };
  }, [navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const newUserMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsAiTyping(true);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-r1:7b",
          prompt: inputValue,
          stream: false,
        }),
      });

      const data = await response.json();
      const cleanText = cleanResponse(data.response);

      const initialAiMessage = {
        id: Date.now() + 1,
        text: cleanText.charAt(0),
        sender: 'ai',
      };
      setMessages(prev => [...prev, initialAiMessage]);
      simulateTyping(cleanText);
      

    } catch (error) {
      console.error('Error communicating with AI:', error);
      const aiError = {
        id: Date.now() + 1,
        text: "Oops! Something went wrong connecting to AI.",
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiError]);
      setIsAiTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-black text-white">

      {/* Sidebar */}
      <div className="w-24 bg-gray-900 flex flex-col items-center py-6">
        <div className="mb-16">
          <div className="w-10 h-10 rounded-full flex-shrink-0 mr-2 flex items-center justify-center">
            <img src={aiProfile.logo} alt="AI" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <button className="mb-6 text-gray-400 hover:text-white">
            <div className="text-2xl">
              <FontAwesomeIcon icon={faCommentDots} />
            </div>
          </button>
        </div>
        <div className="mt-auto relative" ref={profileMenuRef}>
          <button
            className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-gray-700 cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-xl">
              <FontAwesomeIcon icon={faUser} />
            </div>
          </button>

          {/* Profile hover menu */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col">

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 relative">
          {messages.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-48 h-48 flex items-center justify-center">
                <img src={aiLogo.logo} alt="HanceAI" className="max-w-80 max-h-80 object-center" />
              </div>
              {currentUser && (
                <div className="text-center mt-4 text-gray-400">
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
                  <div className="w-8 h-8 rounded-full flex-shrink-0 mr-2 flex items-center justify-center">
                    <img src={aiProfile.logo} alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-purple-900 bg-opacity-50 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="mb-6 flex justify-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 mr-2 flex items-center justify-center">
                  <img src={aiProfile.logo} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-2xl px-6 py-4 text-gray-100">
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
        <div className="p-6">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-center gap-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your prompt here"
                className="w-full bg-black border border-purple-800 rounded-full py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                onClick={handleSendMessage}
                className="bg-purple-700 hover:bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center text-white cursor-pointer"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Homepage;
