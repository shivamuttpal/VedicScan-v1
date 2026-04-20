import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, User, Sparkles, Calendar, Clock, MapPin, Plus, MessageSquare, Trash2, ChevronLeft, ThumbsUp, ThumbsDown, Minus, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UsageBanner from '../components/UsageBanner';
import BetaBanner from '../components/BetaBanner';
import api from '../utils/api';
import { toast } from 'sonner';
import { formatAIResponse } from '../utils/formatAI';
import { DisclaimerLink } from '../components/DisclaimerModal';

const FEEDBACK_URL = "https://forms.gle/JP3XqV6HPoWaQ34x7";

// Feedback component for AI responses
const ResponseFeedback = ({ messageId, conversationId, onFeedbackSubmit }) => {
  const [submitted, setSubmitted] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const handleFeedback = async (feedback) => {
    if (submitted) return;

    setSelectedFeedback(feedback);
    setSubmitted(true);

    try {
      // TODO: Implement backend route for feedback
      console.info('Feedback recorded locally (backend route pending):', {
        conversationId,
        messageId,
        feedback,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }

    if (onFeedbackSubmit) {
      onFeedbackSubmit(feedback);
    }
  };

  if (submitted) {
    return (
      <div className="mt-3 pt-3 border-t border-gold-soft">
        <p className="text-xs text-saffron">Thank you for your feedback! 🙏</p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gold-soft">
      <p className="text-xs text-vtext-muted mb-2">Did this answer feel clear and grounded?</p>
      <div className="flex space-x-2">
        <button
          onClick={() => handleFeedback('yes')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-vgreen-soft text-vgreen hover:bg-vgreen-soft/80 transition-colors flex items-center space-x-1"
        >
          <ThumbsUp className="w-3 h-3" />
          <span>Yes</span>
        </button>
        <button
          onClick={() => handleFeedback('somewhat')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-saffron-pale text-saffron hover:bg-saffron-soft transition-colors flex items-center space-x-1"
        >
          <Minus className="w-3 h-3" />
          <span>Somewhat</span>
        </button>
        <button
          onClick={() => handleFeedback('no')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-vred-soft text-vred hover:bg-vred-soft/80 transition-colors flex items-center space-x-1"
        >
          <ThumbsDown className="w-3 h-3" />
          <span>No</span>
        </button>
      </div>
      <p className="text-xs text-vtext-dim mt-2 italic">Your feedback helps us improve. It's stored securely and not used to train AI.</p>
    </div>
  );
};

// Vedic book loading animation component - pages flipping through ancient text
const VedicBookLoader = () => (
  <div className="flex justify-start">
    <div className="flex items-start space-x-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron to-maroon flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="bg-gradient-to-br from-saffron-pale to-white border border-gold-soft rounded-2xl px-6 py-5">
        <div className="flex items-center space-x-4">
          {/* 3D Book with flipping pages */}
          <div className="book-container">
            <div className="book">
              <div className="book-cover-back"></div>
              <div className="book-pages-bg"></div>
              <div className="page page-1"></div>
              <div className="page page-2"></div>
              <div className="page page-3"></div>
              <div className="page page-4"></div>
              <div className="page page-5"></div>
              <div className="book-cover-front"></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-saffron-600">Consulting the ancient texts...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Sample questions for Maharshi
const maharshiQuestions = [
  "Am I making decisions with my heart instead of my head?",
  "Do I feel a strong need to assert my emotional needs today?",
  "How's the year 2026 going to look like for me?",
  "What career path aligns best with my planetary positions?",
  "When is a good time for me to make important financial decisions?",
  "What does my birth chart say about my relationships?"
];

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuestion = location.state?.question;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [usage, setUsage] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const typingIndicatorRef = useRef(null);
  const lastUserMessageRef = useRef(null);
  const [shouldScrollToUserMessage, setShouldScrollToUserMessage] = useState(false);

  useEffect(() => {
    fetchProfiles();
    loadChatHistoryFromDB();
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await api.get('/api/subscription/status');
      setUsage(response.data.usage);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const loadChatHistoryFromDB = async () => {
    try {
      const response = await api.get('/api/chat/history');
      if (response.data && response.data.conversations) {
        const formattedHistory = response.data.conversations.map(conv => ({
          id: conv.conversationId,
          title: conv.title || 'New Chat',
          messages: conv.messages || [],
          updatedAt: conv.updatedAt
        }));
        setChatHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error loading chat history from DB:', error);
      // Fallback to localStorage
      loadChatHistoryFromLocal();
    }
  };

  const loadChatHistoryFromLocal = () => {
    try {
      const savedHistory = localStorage.getItem('vedicScanChatHistoryList');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatToHistory = (conversationIdToSave, messagesData) => {
    if (!conversationIdToSave || messagesData.length <= 1) return;

    try {
      // Find first user message for title
      const firstUserMessage = messagesData.find(m => m.role === 'user');
      const title = firstUserMessage ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 'New Chat';

      // Update local state immediately for better UX
      setChatHistory(prevHistory => {
        const existingIndex = prevHistory.findIndex(h => h.id === conversationIdToSave);
        const chatData = {
          id: conversationIdToSave,
          title,
          messages: messagesData,
          updatedAt: new Date().toISOString(),
          profileId: selectedProfile?.id
        };

        let newHistory;
        if (existingIndex >= 0) {
          newHistory = [...prevHistory];
          newHistory[existingIndex] = chatData;
        } else {
          newHistory = [chatData, ...prevHistory];
        }

        // Keep only last 20 conversations
        return newHistory.slice(0, 20);
      });

      // Also save to localStorage as backup
      const savedHistory = localStorage.getItem('vedicScanChatHistoryList');
      let history = savedHistory ? JSON.parse(savedHistory) : [];
      const existingIndex = history.findIndex(h => h.id === conversationIdToSave);
      const chatData = {
        id: conversationIdToSave,
        title,
        messages: messagesData,
        updatedAt: new Date().toISOString(),
        profileId: selectedProfile?.id
      };

      if (existingIndex >= 0) {
        history[existingIndex] = chatData;
      } else {
        history.unshift(chatData);
      }
      history = history.slice(0, 20);
      localStorage.setItem('vedicScanChatHistoryList', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const loadConversationFromHistory = (chat) => {
    setMessages(chat.messages);
    setConversationId(chat.id);
    localStorage.setItem('vedicScanChatHistory', JSON.stringify(chat.messages));
    localStorage.setItem('vedicScanConversationId', chat.id);
    setShowHistory(false);
  };

  const deleteFromHistory = async (chatId, e) => {
    e.stopPropagation();
    try {
      // Delete from database
      await api.delete(`/api/chat/history/${chatId}`);

      // Update local state
      const updatedHistory = chatHistory.filter(h => h.id !== chatId);
      setChatHistory(updatedHistory);
      localStorage.setItem('vedicScanChatHistoryList', JSON.stringify(updatedHistory));

      // If current conversation is deleted, clear it
      if (conversationId === chatId) {
        clearConversationHistory();
      }
    } catch (error) {
      console.error('Error deleting from history:', error);
      // Still update local state even if DB delete fails
      const updatedHistory = chatHistory.filter(h => h.id !== chatId);
      setChatHistory(updatedHistory);
      localStorage.setItem('vedicScanChatHistoryList', JSON.stringify(updatedHistory));
    }
  };

  const loadConversationHistory = () => {
    try {
      const savedConversation = localStorage.getItem('vedicScanChatHistory');
      const savedConversationId = localStorage.getItem('vedicScanConversationId');

      if (savedConversation) {
        const parsedMessages = JSON.parse(savedConversation);
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      }

      if (savedConversationId) {
        setConversationId(savedConversationId);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const saveConversationHistory = (newMessages) => {
    try {
      localStorage.setItem('vedicScanChatHistory', JSON.stringify(newMessages));
      if (conversationId) {
        saveChatToHistory(conversationId, newMessages);
      }
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  };

  const clearConversationHistory = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem('vedicScanChatHistory');
    localStorage.removeItem('vedicScanConversationId');

    // Add welcome message
    const welcomeMsg = getWelcomeMessage();
    setMessages([welcomeMsg]);
  };

  const getWelcomeMessage = () => {
    if (profiles.length === 0) {
      return {
        role: 'assistant',
        content: `Namaste! 🙏 I'm Maharshi, your personal Vedic astrology guide.\n\nTo provide you with personalized insights based on your birth chart, I need your birth details first.\n\nPlease <a href="/profile" class="text-saffron hover:text-saffron-600 font-semibold underline">create a profile</a>, for Maharshi AI to answer your questions.\n\nOnce your profile is ready, come back and I'll provide accurate predictions based on your unique planetary positions! ✨`,
        isHtml: true
      };
    }
    return {
      role: 'assistant',
      content: "Namaste! 🙏 I'm Maharshi, your personal Vedic astrology guide. Ask me anything — I'm here to help."
    };
  };

  useEffect(() => {
    // Add welcome message after profiles are loaded (only if no saved conversation)
    if (!loadingProfiles && messages.length === 0) {
      const welcomeMsg = getWelcomeMessage();
      setMessages([welcomeMsg]);

      if (profiles.length === 1) {
        setSelectedProfile(profiles[0]);
      } else if (profiles.length > 1) {
        setShowProfileSelector(true);
      }

      // If there's an initial question from home page
      if (initialQuestion && profiles.length > 0) {
        setTimeout(() => {
          if (profiles.length === 1) {
            setSelectedProfile(profiles[0]);
            handleQuestionClick(initialQuestion);
          }
        }, 500);
      }
    }
  }, [loadingProfiles, profiles]);

  const fetchProfiles = async () => {
    try {
      const response = await api.get('/api/profiles');
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    setShowProfileSelector(false);
    const newMessage = {
      role: 'assistant',
      content: `Perfect! I'll provide personalized guidance for ${profile.name}. Ask me anything — I'm here to help! ✨`
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveConversationHistory(updatedMessages);
  };

  useEffect(() => {
    // Scroll to typing indicator when typing starts
    if (isTyping && typingIndicatorRef.current) {
      typingIndicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (shouldScrollToUserMessage && lastUserMessageRef.current) {
      // After AI responds, scroll to show the user's question at the top
      lastUserMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToUserMessage(false);
    }
  }, [messages, isTyping, shouldScrollToUserMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuestionClick = (question) => {
    setInput(question);
    handleSendMessage(question);
  };

  const handleSendMessage = async (customMessage = null) => {
    const messageText = customMessage || input;
    if (!messageText.trim()) return;

    // Check if user needs to create profile
    if (profiles.length === 0) {
      const newMessages = [...messages,
      { role: 'user', content: messageText },
      {
        role: 'assistant',
        content: `I'd love to help you with that question! However, I need your birth details to provide accurate Vedic astrology predictions.\n\nPlease <a href="/profile" class="text-saffron hover:text-saffron-600 font-semibold underline">create a profile</a>, for Maharshi AI to answer your questions. 🙏`,
        isHtml: true
      }
      ];
      setMessages(newMessages);
      saveConversationHistory(newMessages);
      setInput('');
      return;
    }

    // Check if user needs to select profile (multiple profiles case)
    if (profiles.length > 1 && !selectedProfile) {
      const newMessages = [...messages,
      { role: 'user', content: messageText },
      {
        role: 'assistant',
        content: "Please select a profile first so I can provide personalized predictions based on the correct birth chart. 🙏"
      }
      ];
      setMessages(newMessages);
      saveConversationHistory(newMessages);
      setInput('');
      setShowProfileSelector(true);
      return;
    }

    // Add user message
    const userMessage = { role: 'user', content: messageText };
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setInput('');
    setIsTyping(true);

    try {
      // Calculate Vedic chart using backend API (high precision Swiss Ephemeris)
      let chartDataString = null;
      if (selectedProfile) {
        try {
          // Call backend API to get accurate chart data
          const chartResponse = await api.post('/api/chart/calculate', {
            dateOfBirth: selectedProfile.dateOfBirth,
            timeOfBirth: selectedProfile.timeOfBirth,
            placeOfBirth: selectedProfile.placeOfBirth,
            timezoneOffset: 5.5  // IST - can be made dynamic based on location
          });

          if (chartResponse.data.success) {
            const moon = chartResponse.data.moon;
            const dasha = chartResponse.data.dasha_data;
            const meta = chartResponse.data.meta;

            chartDataString = `
BIRTH CHART DATA FOR ${selectedProfile.name}:
- Date of Birth: ${selectedProfile.dateOfBirth}
- Time of Birth: ${selectedProfile.timeOfBirth}
- Place of Birth: ${selectedProfile.placeOfBirth}

MOON POSITION (Calculated using Swiss Ephemeris with Lahiri Ayanamsa):
- Rashi (Moon Sign): ${moon.sign_vedic}
- Nakshatra: ${moon.nakshatra}
- Moon Degree: ${moon.degree}°
- Pada: ${moon.pada || 'N/A'}

CURRENT VIMSOTTARI DASHA PERIODS:
- Mahadasha: ${dasha?.current_mahadasha || 'Unknown'} (ends ${dasha?.mahadasha_end_date || 'Unknown'})
- Antardasha: ${dasha?.current_antardasha || 'Unknown'} (ends ${dasha?.antardasha_end_date || 'Unknown'})

CURRENT DATE CONTEXT:
- Today's Date: ${meta?.current_date || 'Unknown'}
- Day: ${meta?.current_weekday || 'Unknown'}

Note: This data is calculated using high-precision astronomical calculations (VedicV2Engine).
`;
            console.log('Generated Vedic Chart from Backend:', chartDataString);
            console.log('DEBUG - Dasha Data:', dasha);
          } else {
            throw new Error('Chart calculation failed');
          }
        } catch (chartError) {
          console.error('Error calculating chart:', chartError);
          // Fallback to basic profile info
          chartDataString = `Name: ${selectedProfile.name}, DOB: ${selectedProfile.dateOfBirth}, Time: ${selectedProfile.timeOfBirth}, Place: ${selectedProfile.placeOfBirth}`;
        }
      }

      const response = await api.post('/api/chat/message', {
        message: messageText,
        conversationId: conversationId,
        userProfile: chartDataString
      });

      // Update conversation ID if new
      if (!conversationId && response.data.conversationId) {
        setConversationId(response.data.conversationId);
        localStorage.setItem('vedicScanConversationId', response.data.conversationId);
      }

      const aiMessage = {
        role: 'assistant',
        content: response.data.response
      };

      const updatedMessages = [...messagesWithUser, aiMessage];
      setMessages(updatedMessages);
      saveConversationHistory(updatedMessages);

      // Trigger scroll to user's question after AI responds
      setShouldScrollToUserMessage(true);

      // Save to chat history
      saveChatToHistory(response.data.conversationId || conversationId, updatedMessages);

      // Refresh usage stats
      await fetchUsageStats();
    } catch (error) {
      console.error('Error sending message:', error);

      // Handle limit reached error
      if (error.response?.status === 429) {
        const errorDetail = error.response.data.detail;
        toast.error(errorDetail.message || 'Daily question limit reached');
        setUsage(errorDetail.usage);

        const errorMessage = {
          role: 'assistant',
          content: `You've reached today's 3-question limit. Upgrade to Premium for more questions!\n\n<div class="mt-4 p-3 bg-saffron-pale border border-saffron-soft rounded-lg"><p class="text-sm text-saffron-600">Have feedback? Help us improve → <a href="${FEEDBACK_URL}" target="_blank" rel="noopener noreferrer" class="font-medium text-saffron hover:text-maroon underline inline-flex items-center">Send Feedback<svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a></p></div>`,
          isHtml: true
        };
        const updatedMessages = [...messagesWithUser, errorMessage];
        setMessages(updatedMessages);
        saveConversationHistory(updatedMessages);
        setShouldScrollToUserMessage(true);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment."
        };
        const updatedMessages = [...messagesWithUser, errorMessage];
        setMessages(updatedMessages);
        saveConversationHistory(updatedMessages);
        setShouldScrollToUserMessage(true);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-vedic-bg flex flex-col font-outfit">
      <BetaBanner />
      <Navbar />

      <div className="flex-1 pt-28 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto h-full flex">
          {/* Chat History Sidebar */}
          <div className={`${showHistory ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden mr-4`}>
            <div className="bg-white rounded-2xl border border-vborder h-full p-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-vtext">Chat History</h3>
                <button onClick={() => setShowHistory(false)} className="text-vtext-muted hover:text-saffron transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-vtext-muted text-center py-4">No previous chats</p>
                ) : (
                  chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => loadConversationFromHistory(chat)}
                      className={`p-3 rounded-xl cursor-pointer hover:bg-saffron-pale border transition-all ${conversationId === chat.id ? 'bg-saffron-pale border-saffron/30' : 'border-vborder'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-vtext truncate">{chat.title}</p>
                          <p className="text-xs text-vtext-muted mt-1">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteFromHistory(chat.id, e)}
                          className="text-vtext-dim hover:text-vred ml-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-saffron to-maroon rounded-t-2xl p-6 text-white shadow-lg relative overflow-hidden">
              {/* Subtle mandala */}
              <div className="absolute right-[-20px] top-[-20px] opacity-10">
                <svg width="100" height="100" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="92" fill="none" stroke="#B8860B" strokeWidth="0.5"/>
                  <circle cx="100" cy="100" r="72" fill="none" stroke="#B8860B" strokeWidth="0.5"/>
                  <circle cx="100" cy="100" r="52" fill="none" stroke="#B8860B" strokeWidth="0.3"/>
                </svg>
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center">
                  {!showHistory && (
                    <button
                      onClick={() => setShowHistory(true)}
                      className="mr-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Chat History"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mr-4 border border-white/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-bold font-playfair">Maharshi — AI Vedic Astrologer</h1>
                    <p className="text-white/70 text-sm">Available 24/7 for personalized guidance</p>
                  </div>
                </div>
                {messages.length > 1 && (
                  <Button
                    onClick={clearConversationHistory}
                    variant="outline"
                    className="bg-white/10 backdrop-blur text-white hover:bg-white/20 border-white/20 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2 rotate-45" />
                    New Chat
                  </Button>
                )}
              </div>
            </div>

            {/* Usage Banner */}
            {usage && (
              <div className="bg-white border-x border-vborder p-4">
                <UsageBanner usage={usage} />
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 bg-vedic-bg-warm border-x border-vborder overflow-y-auto p-6 space-y-6">
              {messages.map((message, index) => {
                // Check if this is the last user message
                const isLastUserMessage = message.role === 'user' &&
                  index === messages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i >= 0).pop();

                return (
                  <div
                    key={index}
                    ref={isLastUserMessage ? lastUserMessageRef : null}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${message.role === 'user'
                          ? 'bg-maroon'
                          : 'bg-gradient-to-br from-saffron to-maroon'
                        }`}>
                        {message.role === 'user' ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <img
                            src="https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png"
                            alt="Maharshi"
                            className="w-10 h-10 object-cover"
                          />
                        )}
                      </div>
                      <div className={`rounded-2xl px-6 py-4 ${message.role === 'user'
                          ? 'bg-saffron-pale border border-saffron/20 text-vtext'
                          : 'bg-white border border-vborder shadow-sm'
                        }`}>
                        <div
                          className={`leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'text-vtext' : 'text-vtext'
                            }`}
                          dangerouslySetInnerHTML={{
                            __html: message.role === 'assistant'
                              ? (message.isHtml ? message.content : formatAIResponse(message.content))
                              : message.content
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && <div ref={typingIndicatorRef}><VedicBookLoader /></div>}
              <div ref={messagesEndRef} />
            </div>

            {/* Profile Selector (shown when multiple profiles exist) */}
            {showProfileSelector && profiles.length > 1 && (
              <div className="bg-white border-x border-vborder px-6 py-4">
                <p className="text-sm text-vtext font-semibold mb-3">Select Profile for Personalized Reading:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile)}
                      className="text-left p-4 bg-saffron-pale hover:bg-saffron-soft/50 border-2 border-gold-border hover:border-saffron rounded-xl transition-all"
                    >
                      <div className="flex items-center mb-2">
                        <User className="w-5 h-5 text-saffron mr-2" />
                        <span className="font-semibold text-vtext">{profile.name}</span>
                      </div>
                      <div className="text-xs text-vtext-muted space-y-1">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(profile.dateOfBirth).toLocaleDateString('en-IN')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {profile.timeOfBirth}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {profile.placeOfBirth}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Profile Display */}
            {selectedProfile && !showProfileSelector && (
              <div className="bg-saffron-pale border-x border-saffron/20 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-saffron mr-2" />
                    <span className="text-sm text-vtext-mid">
                      Reading for: <span className="font-semibold text-vtext">{selectedProfile.name}</span>
                    </span>
                  </div>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => setShowProfileSelector(true)}
                      className="text-xs text-saffron hover:text-saffron-600 font-medium underline transition-colors"
                    >
                      Change Profile
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Questions (shown when chat is empty or few messages) */}
            {messages.length <= 2 && !showProfileSelector && profiles.length > 0 && selectedProfile && (
              <div className="bg-white border-x border-vborder px-6 py-4">
                <p className="text-sm text-vtext-mid font-semibold mb-3">Ask Maharshi:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {maharshiQuestions.slice(0, 6).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionClick(question)}
                      className="text-left p-3 bg-vedic-bg hover:bg-saffron-pale border border-vborder hover:border-saffron/30 rounded-xl text-sm text-vtext-mid transition-all"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* Input Area */}
            <div className="bg-white rounded-b-2xl border border-vborder p-6 shadow-lg">
              {/* Profile creation prompt with embedded link */}
              {profiles.length === 0 && !loadingProfiles && (
                <div className="mb-4 p-3 bg-saffron-pale border border-saffron-soft rounded-xl text-center">
                  <p className="text-sm text-vtext-mid">
                    Please{' '}
                    <button
                      onClick={() => navigate('/profile')}
                      className="text-saffron hover:text-saffron-600 font-semibold underline inline-flex items-center transition-colors"
                    >
                      create a profile
                    </button>
                    , for Maharshi AI to answer your questions.
                  </p>
                </div>
              )}
              <div className="flex space-x-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    profiles.length === 0
                      ? "Create a profile to ask questions..."
                      : profiles.length > 1 && !selectedProfile
                        ? "Please select a profile first..."
                        : "Ask anything about your life, career, love, or timing..."
                  }
                  className="vedic-input flex-1 py-4"
                  disabled={isTyping || profiles.length === 0 || (profiles.length > 1 && !selectedProfile)}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isTyping || profiles.length === 0 || (profiles.length > 1 && !selectedProfile)}
                  className="bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              {/* Disclaimer Link */}
              <div className="mt-3 text-center">
                <DisclaimerLink className="text-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* CSS for 3D book page flipping animation */}
      <style>{`
        .book-container {
          perspective: 1000px;
          width: 50px;
          height: 60px;
        }
        
        .book {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateY(-25deg);
        }
        
        .book-cover-back {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #4A0F27 0%, #7B1A38 100%);
          border-radius: 0 3px 3px 0;
          box-shadow: 2px 2px 8px rgba(0,0,0,0.3);
        }
        
        .book-cover-front {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #7B1A38 0%, #D4760A 100%);
          border-radius: 0 3px 3px 0;
          transform-origin: left;
          transform: rotateY(-160deg);
          box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
        }
        
        .book-pages-bg {
          position: absolute;
          width: 95%;
          height: 95%;
          left: 2%;
          top: 2.5%;
          background: linear-gradient(90deg, #F5E6C8 0%, #FFF7ED 50%, #F5E6C8 100%);
          border-radius: 0 2px 2px 0;
          transform: translateZ(1px);
        }
        
        .page {
          position: absolute;
          width: 90%;
          height: 90%;
          left: 5%;
          top: 5%;
          background: linear-gradient(90deg, #FFF7ED 0%, #FFFBF0 100%);
          border-radius: 0 2px 2px 0;
          transform-origin: left;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* Decorative lines on pages */
        .page::before {
          content: '';
          position: absolute;
          top: 15%;
          left: 10%;
          right: 10%;
          height: 60%;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 4px,
            rgba(212, 118, 10, 0.15) 4px,
            rgba(212, 118, 10, 0.15) 5px
          );
        }
        
        .page-1 { animation: flipPage 2.5s ease-in-out infinite; animation-delay: 0s; z-index: 5; }
        .page-2 { animation: flipPage 2.5s ease-in-out infinite; animation-delay: 0.15s; z-index: 4; }
        .page-3 { animation: flipPage 2.5s ease-in-out infinite; animation-delay: 0.3s; z-index: 3; }
        .page-4 { animation: flipPage 2.5s ease-in-out infinite; animation-delay: 0.45s; z-index: 2; }
        .page-5 { animation: flipPage 2.5s ease-in-out infinite; animation-delay: 0.6s; z-index: 1; }
        
        @keyframes flipPage {
          0%, 20% {
            transform: rotateY(0deg);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          35% {
            transform: rotateY(-90deg);
            box-shadow: -5px 1px 10px rgba(0,0,0,0.15);
          }
          50%, 100% {
            transform: rotateY(-160deg);
            box-shadow: -2px 1px 5px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
