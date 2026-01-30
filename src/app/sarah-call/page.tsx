'use client';

import { useState, useEffect, useRef } from 'react';

// Trello-like board component (embedded in "screen share")
function TrelloBoard({ cards, features }: { cards: { name: string; list: string }[]; features: { type: string; name: string }[] }) {
  const lists = ['To Do', 'In Progress', 'Review', 'Done'];
  
  return (
    <div className="h-full bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg">Your Workflow Board</h1>
          <span className="bg-white/20 text-white text-xs px-2 py-1 rounded">Public</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white/20 text-white text-sm px-3 py-1.5 rounded hover:bg-white/30">
            Filter
          </button>
          <button className="bg-white/20 text-white text-sm px-3 py-1.5 rounded hover:bg-white/30">
            Share
          </button>
        </div>
      </div>
      
      {/* Features Banner */}
      {features.length > 0 && (
        <div className="mb-4 space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="bg-green-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-slideDown">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span className="text-sm font-medium">
                {feature.type === 'automation' && '⚡ Automation added: '}
                {feature.type === 'dashboard' && '📊 Dashboard added: '}
                {feature.type === 'notification' && '🔔 Notifications enabled: '}
                {feature.type === 'due_dates' && '📅 Due dates tracking: '}
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Lists */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {lists.map((list) => (
          <div 
            key={list}
            className="bg-gray-100 rounded-xl p-3 min-w-[280px] max-w-[280px] flex-shrink-0"
          >
            <h3 className="font-semibold text-gray-700 mb-3 px-1">{list}</h3>
            <div className="space-y-2">
              {cards
                .filter(c => c.list === list)
                .map((card, i) => (
                  <div 
                    key={i}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-cardIn"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <p className="text-sm text-gray-800">{card.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">S</div>
                    </div>
                  </div>
                ))}
              {cards.filter(c => c.list === list).length === 0 && (
                <div className="text-gray-400 text-sm px-1">No cards yet</div>
              )}
            </div>
            <button className="w-full mt-2 text-left text-gray-500 hover:text-gray-700 text-sm px-1 py-1 rounded hover:bg-gray-200">
              + Add a card
            </button>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-cardIn {
          animation: cardIn 0.3s ease-out forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Sarah's video avatar
function SarahAvatar({ speaking, minimized }: { speaking: boolean; minimized: boolean }) {
  return (
    <div 
      className={`relative transition-all duration-500 ease-in-out overflow-hidden ${
        minimized 
          ? 'w-48 h-36 rounded-xl shadow-2xl' 
          : 'w-full h-full rounded-none'
      }`}
      style={{ 
        background: '#b8b5e4',
      }}
    >
      {/* Static image (default state) */}
      <img 
        src="/sarah.png" 
        alt="Sarah"
        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 ${
          speaking && !minimized ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ objectPosition: 'center 20%' }}
      />
      
      {/* Video only plays when speaking (and not minimized) */}
      {!minimized && (
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 ${
            speaking ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectPosition: 'center 20%' }}
        >
          <source src="/sarah-video.mp4" type="video/mp4" />
        </video>
      )}
      
      {/* Speaking indicator overlay */}
      {speaking && (
        <div className={`absolute inset-0 ${minimized ? 'ring-4' : 'ring-8'} ring-green-400 ring-opacity-60 animate-pulse rounded-inherit pointer-events-none`}></div>
      )}
      
      {/* Name tag */}
      <div className={`absolute ${minimized ? 'bottom-2 left-1/2 -translate-x-1/2' : 'bottom-24 left-1/2 -translate-x-1/2'} bg-black/60 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap ${minimized ? 'text-xs px-2' : ''}`}>
        Sarah • AI Sales Engineer
      </div>
      
      {/* Speaking indicator dots */}
      {speaking && !minimized && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          <span className="text-green-400 text-xs ml-1">Speaking</span>
        </div>
      )}
      
      {/* Recording indicator for minimized */}
      {minimized && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-xs">LIVE</span>
        </div>
      )}
    </div>
  );
}

// Zoom-like controls bar
function CallControls({ 
  onEndCall, 
  isScreenSharing,
  isMuted,
  onToggleMute
}: { 
  onEndCall: () => void;
  isScreenSharing: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur px-6 py-4">
      <div className="flex items-center justify-center gap-4">
        {/* Mute */}
        <button 
          onClick={onToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {isMuted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          )}
        </button>
        
        {/* Video (always on for Sarah) */}
        <button className="w-12 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 transition">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        </button>
        
        {/* Screen share indicator */}
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${isScreenSharing ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span className="text-sm font-medium">{isScreenSharing ? 'Screen Sharing' : 'Not Sharing'}</span>
        </div>
        
        {/* End call */}
        <button 
          onClick={onEndCall}
          className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"></path>
          </svg>
        </button>
      </div>
      
      {/* Recording indicator */}
      <div className="absolute top-4 left-6 flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-400 text-sm font-medium">REC</span>
      </div>
      
      {/* Meeting info */}
      <div className="absolute top-4 right-6 text-gray-400 text-sm">
        Hoponai Demo Call
      </div>
    </div>
  );
}

// Chat overlay (like Zoom chat)
function ChatOverlay({ 
  messages, 
  input, 
  onInputChange, 
  onSend, 
  loading 
}: { 
  messages: { role: string; content: string }[];
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  loading: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="w-80 bg-gray-900/95 backdrop-blur-lg flex flex-col border-l border-gray-700">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <span className="text-white font-medium">Meeting Chat</span>
        <span className="text-gray-400 text-sm">Everyone</span>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`${msg.role === 'user' ? 'text-right' : ''}`}>
            <div className="text-xs text-gray-500 mb-1">
              {msg.role === 'sarah' ? 'Sarah (AI Sales Engineer)' : 'You'}
            </div>
            <div 
              className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'sarah' 
                  ? 'bg-gray-700 text-white text-left' 
                  : 'bg-blue-600 text-white'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Sarah (AI Sales Engineer)</div>
            <div className="inline-block bg-gray-700 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="Type message here..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button 
            onClick={onSend}
            disabled={loading}
            className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Lobby screen
function Lobby({ onJoin }: { onJoin: () => void }) {
  const [joining, setJoining] = useState(false);
  
  const handleJoin = () => {
    setJoining(true);
    setTimeout(onJoin, 1500);
  };
  
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Hoponai Demo Call</h1>
          <p className="text-gray-400 mt-2">You're about to meet Sarah, your AI Sales Engineer</p>
        </div>
        
        {/* Preview */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-6 max-w-md mx-auto">
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 ring-4 ring-blue-500/50">
            <img 
              src="/sarah.png" 
              alt="Sarah"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <h2 className="text-white font-semibold text-lg">Sarah</h2>
          <p className="text-gray-400 text-sm">AI Sales Engineer</p>
          <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Ready to meet
          </p>
        </div>
        
        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-75 transition flex items-center gap-3 mx-auto"
        >
          {joining ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              Join Demo Call
            </>
          )}
        </button>
        
        <p className="text-gray-500 text-sm mt-4">No download required • Browser-based</p>
      </div>
    </div>
  );
}

// Main page component
export default function SarahCallPage() {
  const [mode, setMode] = useState<'lobby' | 'call' | 'ended'>('lobby');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cards, setCards] = useState<{ name: string; list: string }[]>([]);
  const [features, setFeatures] = useState<{ type: string; name: string }[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [recommendedPlan, setRecommendedPlan] = useState('pro');

  // Initialize call with Sarah's greeting
  const initCall = async () => {
    setMode('call');
    setLoading(true);
    setSpeaking(true);
    
    const res = await fetch('/api/sarah-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'START_CALL', history: [], isNewSession: true })
    });
    
    const data = await res.json();
    setMessages([{ role: 'sarah', content: data.reply }]);
    setLoading(false);
    
    // Calculate speaking duration based on message length
    const wordCount = data.reply ? data.reply.split(' ').length : 0;
    const speakingDuration = Math.max(2000, Math.min(wordCount * 400, 8000));
    setTimeout(() => setSpeaking(false), speakingDuration);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setSpeaking(true);

    const history = newMessages.map(m => ({
      role: m.role === 'sarah' ? 'assistant' : 'user',
      content: m.content
    }));

    const res = await fetch('/api/sarah-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, history: history.slice(0, -1) })
    });
    
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'sarah', content: data.reply }]);
    
    // Calculate speaking duration based on message length (approx 150 words per minute)
    const wordCount = data.reply ? data.reply.split(' ').length : 0;
    const speakingDuration = Math.max(2000, Math.min(wordCount * 400, 8000)); // 2-8 seconds
    
    // Handle screen share trigger
    if (data.action === 'SHARE_SCREEN') {
      setTimeout(() => {
        setIsScreenSharing(true);
      }, 1000);
    }
    
    // Handle card creation
    if (data.cards && data.cards.length > 0) {
      // Add cards one by one for animation
      for (const card of data.cards) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setCards(prev => [...prev, card]);
      }
    }
    
    // Handle feature addition
    if (data.action === 'ADD_FEATURE' && data.feature) {
      setFeatures(prev => [...prev, data.feature]);
    }
    
    // Handle pricing modal
    if (data.action === 'SHOW_PRICING' && data.pricing) {
      setRecommendedPlan(data.pricing.plan);
      setShowPricing(true);
    }
    
    setLoading(false);
    setTimeout(() => setSpeaking(false), speakingDuration);
  };

  const endCall = () => {
    setMode('ended');
  };

  if (mode === 'lobby') {
    return <Lobby onJoin={initCall} />;
  }

  if (mode === 'ended') {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Demo Completed!</h1>
          <p className="text-gray-400 mb-6">Sarah has created your workflow. Check your Trello board!</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="https://trello.com/b/6NTDvRPC"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              View Your Board
            </a>
            <button 
              onClick={() => {
                setMode('lobby');
                setMessages([]);
                setCards([]);
                setFeatures([]);
                setIsScreenSharing(false);
                setShowPricing(false);
              }}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition"
            >
              Start New Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 animate-scaleIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-2">Start your 14-day free trial. No credit card required.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="border rounded-xl p-6 hover:border-blue-500 transition cursor-pointer">
                <h3 className="font-bold text-lg text-gray-900">Free</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Up to 10 boards
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Basic automations
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    No dashboards
                  </li>
                </ul>
                <button className="w-full mt-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  Current Plan
                </button>
              </div>
              
              {/* Pro Plan */}
              <div className={`border-2 rounded-xl p-6 relative ${recommendedPlan === 'pro' ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
                {recommendedPlan === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                )}
                <h3 className="font-bold text-lg text-gray-900">Pro</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$12</span>
                  <span className="text-gray-500">/user/month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Unlimited boards
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Advanced automations
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Dashboards & reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Priority support
                  </li>
                </ul>
                <button className="w-full mt-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Start Free Trial
                </button>
              </div>
              
              {/* Enterprise Plan */}
              <div className="border rounded-xl p-6 hover:border-blue-500 transition cursor-pointer">
                <h3 className="font-bold text-lg text-gray-900">Enterprise</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold">Custom</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Everything in Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    SSO & security
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Dedicated success manager
                  </li>
                </ul>
                <button className="w-full mt-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  Contact Sales
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowPricing(false)}
              className="mt-6 text-gray-500 hover:text-gray-700 text-sm mx-auto block"
            >
              Maybe later
            </button>
          </div>
          
          <style jsx>{`
            @keyframes scaleIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-scaleIn {
              animation: scaleIn 0.3s ease-out forwards;
            }
          `}</style>
        </div>
      )}
      
      {/* Main video/screen area */}
      <div className="flex-1 relative">
        {/* Screen share content OR Sarah's video */}
        {isScreenSharing ? (
          <>
            {/* Trello board (main area) */}
            <div className="absolute inset-0 bottom-20">
              <TrelloBoard cards={cards} features={features} />
            </div>
            
            {/* Sarah PiP (picture in picture) */}
            <div className="absolute bottom-24 right-4 z-10 shadow-2xl rounded-xl overflow-hidden">
              <SarahAvatar speaking={speaking} minimized={true} />
            </div>
          </>
        ) : (
          /* Full Sarah video */
          <div className="absolute inset-0 bottom-20">
            <SarahAvatar speaking={speaking} minimized={false} />
          </div>
        )}
        
        {/* Call controls */}
        <CallControls 
          onEndCall={endCall}
          isScreenSharing={isScreenSharing}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
        />
      </div>
      
      {/* Chat panel */}
      <ChatOverlay
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSend={sendMessage}
        loading={loading}
      />
    </div>
  );
}