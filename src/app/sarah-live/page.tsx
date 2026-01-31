'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SimliClient } from 'simli-client';

// Trello-like board component
function TrelloBoard({ cards, features }: { cards: { name: string; list: string }[]; features: { type: string; name: string }[] }) {
  const lists = ['To Do', 'In Progress', 'Review', 'Done'];
  
  return (
    <div className="h-full bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg">Your Workflow Board</h1>
          <span className="bg-white/20 text-white text-xs px-2 py-1 rounded">Public</span>
        </div>
      </div>
      
      {features.length > 0 && (
        <div className="mb-4 space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="bg-green-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span className="text-sm font-medium">
                {feature.type === 'automation' && '⚡ '}
                {feature.type === 'dashboard' && '📊 '}
                {feature.type === 'notification' && '🔔 '}
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-3 overflow-x-auto pb-4">
        {lists.map((list) => (
          <div key={list} className="bg-gray-100 rounded-xl p-3 min-w-[260px] max-w-[260px] flex-shrink-0">
            <h3 className="font-semibold text-gray-700 mb-3 px-1">{list}</h3>
            <div className="space-y-2">
              {cards
                .filter(c => c.list === list)
                .map((card, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-800">{card.name}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chat message component
function ChatMessage({ role, content }: { role: string; content: string }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        role === 'sarah' 
          ? 'bg-gray-700 text-white' 
          : 'bg-blue-600 text-white'
      }`}>
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

export default function SarahLivePage() {
  // Refs for video/audio elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const simliClientRef = useRef<SimliClient | null>(null);
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cards, setCards] = useState<{ name: string; list: string }[]>([]);
  const [features, setFeatures] = useState<{ type: string; name: string }[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Simli client
  const initSimli = useCallback(async () => {
    if (!videoRef.current || !audioRef.current) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const simliClient = new SimliClient();
      
      simliClient.Initialize({
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY!,
        faceID: process.env.NEXT_PUBLIC_SIMLI_FACE_ID!,
        handleSilence: true,
        maxSessionLength: 3600,
        maxIdleTime: 600,
        videoRef: videoRef.current,
        audioRef: audioRef.current,
      } as any);
      
      simliClient.on('connected', () => {
        console.log('Simli connected!');
        setIsConnected(true);
        setIsConnecting(false);
        // Send initial greeting
        sendSarahMessage('START_CALL');
      });
      
      simliClient.on('disconnected', () => {
        console.log('Simli disconnected');
        setIsConnected(false);
      });
      
      simliClient.on('failed', () => {
        console.error('Simli connection failed');
        setError('Failed to connect to avatar service');
        setIsConnecting(false);
      });
      
      simliClient.on('speaking', () => {
        setIsSpeaking(true);
      });
      
      simliClient.on('silent', () => {
        setIsSpeaking(false);
      });
      
      await simliClient.start();
      simliClientRef.current = simliClient;
      
    } catch (err) {
      console.error('Simli init error:', err);
      setError('Failed to initialize avatar');
      setIsConnecting(false);
    }
  }, []);

  // Convert text to speech and send to Simli
  const speakText = async (text: string) => {
    if (!simliClientRef.current) return;
    
    try {
      // Call ElevenLabs TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('TTS failed');
      }
      
      // Get audio as ArrayBuffer
      const audioBuffer = await response.arrayBuffer();
      const audioData = new Uint8Array(audioBuffer);
      
      // Send to Simli
      simliClientRef.current.sendAudioData(audioData);
      
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  // Send message to Sarah and get response
  const sendSarahMessage = async (userMessage: string) => {
    if (userMessage !== 'START_CALL') {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    }
    
    setIsLoading(true);
    
    try {
      const history = messages.map(m => ({
        role: m.role === 'sarah' ? 'assistant' : 'user',
        content: m.content
      }));
      
      const response = await fetch('/api/sarah-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: userMessage === 'START_CALL' ? [] : history,
          isNewSession: userMessage === 'START_CALL'
        }),
      });
      
      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'sarah', content: data.reply }]);
        // Make Sarah speak
        await speakText(data.reply);
      }
      
      // Handle actions
      if (data.action === 'SHARE_SCREEN') {
        setTimeout(() => setIsScreenSharing(true), 1000);
      }
      
      if (data.cards?.length > 0) {
        for (const card of data.cards) {
          await new Promise(r => setTimeout(r, 400));
          setCards(prev => [...prev, card]);
        }
      }
      
      if (data.action === 'ADD_FEATURE' && data.feature) {
        setFeatures(prev => [...prev, data.feature]);
      }
      
      if (data.action === 'SHOW_PRICING') {
        setShowPricing(true);
      }
      
    } catch (err) {
      console.error('Sarah API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send message
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendSarahMessage(input);
    setInput('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      simliClientRef.current?.close();
    };
  }, []);

  // Lobby screen
  if (!isConnected && !isConnecting) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 ring-4 ring-blue-500/50">
            <img src="/sarah.png" alt="Sarah" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Meet Sarah</h1>
          <p className="text-gray-400 mb-6">Your AI Sales Engineer is ready to give you a personalized demo</p>
          
          {error && (
            <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <button
            onClick={initSimli}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
          >
            Start Demo Call
          </button>
          
          {/* Hidden video/audio elements */}
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <audio ref={audioRef} autoPlay className="hidden" />
        </div>
      </div>
    );
  }

  // Connecting screen
  if (isConnecting) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Connecting to Sarah...</p>
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <audio ref={audioRef} autoPlay className="hidden" />
        </div>
      </div>
    );
  }

  // Main call interface
  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4">
            <h2 className="text-2xl font-bold text-center mb-2">Choose Your Plan</h2>
            <p className="text-gray-600 text-center mb-6">Start your 14-day free trial</p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-xl p-6">
                <h3 className="font-bold">Free</h3>
                <div className="text-3xl font-bold mt-2">$0</div>
                <button className="w-full mt-4 py-2 border rounded-lg">Current</button>
              </div>
              <div className="border-2 border-blue-500 rounded-xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  RECOMMENDED
                </div>
                <h3 className="font-bold">Pro</h3>
                <div className="text-3xl font-bold mt-2">$12<span className="text-sm font-normal">/mo</span></div>
                <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg">Start Trial</button>
              </div>
              <div className="border rounded-xl p-6">
                <h3 className="font-bold">Enterprise</h3>
                <div className="text-3xl font-bold mt-2">Custom</div>
                <button className="w-full mt-4 py-2 border rounded-lg">Contact</button>
              </div>
            </div>
            
            <button onClick={() => setShowPricing(false)} className="mt-4 text-gray-500 text-sm mx-auto block">
              Maybe later
            </button>
          </div>
        </div>
      )}
      
      {/* Main video/screen area */}
      <div className="flex-1 relative">
        {isScreenSharing ? (
          <>
            {/* Trello board */}
            <div className="absolute inset-0 bottom-20">
              <TrelloBoard cards={cards} features={features} />
            </div>
            
            {/* Sarah PiP */}
            <div className="absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl z-10">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className="w-full h-full object-cover"
              />
              {isSpeaking && (
                <div className="absolute inset-0 ring-4 ring-green-400 ring-opacity-75 animate-pulse rounded-xl"></div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                Sarah
              </div>
            </div>
          </>
        ) : (
          /* Full Sarah video */
          <div className="absolute inset-0 bottom-20 bg-[#b8b5e4]">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover object-top"
              style={{ objectPosition: 'center 20%' }}
            />
            {isSpeaking && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="text-green-400 text-xs ml-1">Speaking</span>
              </div>
            )}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              Sarah • AI Sales Engineer
            </div>
          </div>
        )}
        
        {/* Audio element */}
        <audio ref={audioRef} autoPlay className="hidden" />
        
        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${isScreenSharing ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
              <span className="text-sm">{isScreenSharing ? 'Screen Sharing' : 'Not Sharing'}</span>
            </div>
            <button 
              onClick={() => simliClientRef.current?.close()}
              className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"></path>
              </svg>
            </button>
          </div>
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-sm">REC</span>
          </div>
        </div>
      </div>
      
      {/* Chat panel */}
      <div className="w-80 bg-gray-900/95 flex flex-col border-l border-gray-700">
        <div className="px-4 py-3 border-b border-gray-700">
          <span className="text-white font-medium">Meeting Chat</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}