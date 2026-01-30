'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { SimliClient } from 'simli-client';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const simliClientRef = useRef<SimliClient | null>(null);
  const hasInitialized = useRef(false);
  const hasSentStart = useRef(false);
  
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

  const initSimli = useCallback(async () => {
    console.log('🔵 initSimli called');
    
    if (!videoRef.current || !audioRef.current) {
      console.log('❌ Refs not ready');
      return;
    }
    
    if (hasInitialized.current) {
      console.log('❌ Already initialized');
      return;
    }
    
    hasInitialized.current = true;
    setIsConnecting(true);
    setError(null);
    
    try {
      const simliClient = new SimliClient();
      
      simliClient.Initialize({
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY || "",
        faceID: process.env.NEXT_PUBLIC_SIMLI_FACE_ID || "",
        handleSilence: true,
        maxSessionLength: 3600,
        maxIdleTime: 600,
        session_token: "",
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true,
        SimliURL: "",
        maxRetryAttempts: 100,
        retryDelay_ms: 2000,
        videoReceivedTimeout: 15000,
        enableSFU: true,
        model: "",
      });
      
      simliClient.on('connected', () => {
        console.log('✅ Simli connected!');
        setIsConnected(true);
        setIsConnecting(false);
      });
      
      simliClient.on('disconnected', () => {
        console.log('❌ Simli disconnected');
        setIsConnected(false);
        hasInitialized.current = false;
        hasSentStart.current = false;
      });
      
      simliClient.on('failed', (reason: string) => {
        console.error('❌ Simli failed:', reason);
        setError(`Connection failed: ${reason}`);
        setIsConnecting(false);
        hasInitialized.current = false;
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
      console.error('❌ Simli init error:', err);
      setError(`Failed to initialize: ${err}`);
      setIsConnecting(false);
      hasInitialized.current = false;
    }
  }, []);

  // Send START_CALL once when connected
  useEffect(() => {
    if (isConnected && !hasSentStart.current) {
      hasSentStart.current = true;
      console.log('📤 Sending START_CALL');
      sendSarahMessage('START_CALL');
    }
  }, [isConnected]);

  const speakText = async (text: string) => {
    if (!simliClientRef.current) return;
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const audioBuffer = await response.arrayBuffer();
      const audioData = new Uint8Array(audioBuffer);
      simliClientRef.current.sendAudioData(audioData);
      
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

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
        
        if (data.action === 'SHARE_SCREEN') {
          setIsScreenSharing(true);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (data.cards && data.cards.length > 0) {
          setCards(data.cards);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        if (data.feature) {
          setFeatures(prev => [...prev, data.feature]);
        }
        
        if (data.pricing) {
          setShowPricing(true);
        }
        
        await speakText(data.reply);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to communicate with Sarah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendSarahMessage(input);
    setInput('');
  };

  return (
    <div className="h-screen bg-gray-900">
      {/* ALWAYS rendered video/audio */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        muted={false}
        className={`object-cover ${
          isConnected && !isScreenSharing 
            ? "fixed bottom-24 right-[420px] w-96 h-72 rounded-xl border-4 border-purple-500/50 shadow-2xl z-30" 
            : isConnected && isScreenSharing
            ? "fixed bottom-24 right-4 w-64 h-48 rounded-xl border-4 border-white/30 shadow-2xl z-40"
            : "hidden"
        }`}
        style={{ backgroundColor: 'transparent' }}
      />
      <audio ref={audioRef} autoPlay />

      {/* Start screen */}
      {!isConnected && !isConnecting && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-center max-w-md">
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 ring-4 ring-purple-500/50 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <div className="text-6xl">👩‍💼</div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Meet Sarah</h1>
            <p className="text-gray-300 text-lg mb-2">Your AI Sales Engineer</p>
            <p className="text-gray-400 mb-8">Ready to give you a personalized live demo</p>
            
            {error && (
              <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}
            
            <button
              onClick={initSimli}
              disabled={isConnecting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              Start Demo Call
            </button>
          </div>
        </div>
      )}

      {/* Connecting screen */}
      {isConnecting && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-white text-xl mb-2">Connecting to Sarah...</p>
            <p className="text-gray-400 text-sm">Setting up video stream</p>
          </div>
        </div>
      )}

      {/* Main call interface */}
      {isConnected && (
        <div className="h-screen flex relative">
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
          
          <div className="flex-1 relative">
            {/* Board when screen sharing */}
            {isScreenSharing && (
              <div className="absolute inset-0 bottom-20 z-20">
                <TrelloBoard cards={cards} features={features} />
              </div>
            )}

            {/* Speaking indicator */}
            {isSpeaking && (
              <div className={`absolute ${isScreenSharing ? 'bottom-32 right-20' : 'bottom-32 left-1/2 -translate-x-1/2'} z-40 bg-black/60 px-4 py-2 rounded-full`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-green-400 text-sm">Speaking</span>
                </div>
              </div>
            )}

            {/* Sarah label */}
            <div className={`absolute ${isScreenSharing ? 'bottom-32 right-4' : 'bottom-24 left-1/2 -translate-x-1/2'} z-40 bg-black/70 text-white px-4 py-2 rounded-full`}>
              Sarah • AI Sales Engineer
            </div>
            
            {/* Controls bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 px-6 py-4 z-40">
              <div className="flex items-center justify-center gap-4">
                <div className={`px-4 py-2 rounded-full ${isScreenSharing ? 'bg-green-600' : 'bg-gray-700'} text-white text-sm`}>
                  {isScreenSharing ? 'Screen Sharing' : 'Camera Only'}
                </div>
                <button 
                  onClick={() => {
                    simliClientRef.current?.close();
                    window.location.reload();
                  }}
                  className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
              <div className="absolute top-4 left-6 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm">LIVE</span>
              </div>
            </div>
          </div>
          
          {/* Chat panel */}
          <div className="w-96 bg-gray-900 flex flex-col border-l border-gray-700 relative z-30">
            <div className="px-4 py-4 border-b border-gray-700">
              <span className="text-white font-semibold">Meeting Chat</span>
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
                  className="bg-purple-600 text-white px-4 rounded-lg disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}