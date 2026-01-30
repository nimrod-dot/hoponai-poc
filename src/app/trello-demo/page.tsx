'use client';

import { useState, useEffect } from 'react';

// --- TYPES ---
interface TrelloCard { id: string; idList: string; name: string; }
interface TrelloList { id: string; name: string; }
interface TrelloBoardData {
  cards: TrelloCard[];
  lists: TrelloList[];
  prefs?: { backgroundImage?: string; backgroundColor?: string; };
}

export default function TrelloDemoPage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  
  // STATE
  const [loading, setLoading] = useState(false);
  const [boardData, setBoardData] = useState<TrelloBoardData | null>(null);
  const [usingSimulation, setUsingSimulation] = useState(false);

  const BOARD_ID = '6NTDvRPC'; 

  // --- SIMULATION DATA ---
  const getSimulationData = (topic: string): TrelloBoardData => {
    const text = topic.toLowerCase();
    
    // 1. RISK MANAGEMENT
    if (text.includes('risk') || text.includes('compliance')) {
      return {
        lists: [
          { id: 'l1', name: 'Risk Identification' },
          { id: 'l2', name: 'Qualitative Analysis' },
          { id: 'l3', name: 'Mitigation Plans' },
          { id: 'l4', name: 'Monitoring' }
        ],
        cards: [
          { id: 'c1', idList: 'l1', name: 'Regulatory Compliance Check' },
          { id: 'c2', idList: 'l1', name: 'Supply Chain Volatility' },
          { id: 'c3', idList: 'l2', name: 'Impact vs Probability Matrix' },
          { id: 'c4', idList: 'l3', name: 'Insurance Coverage Review' }
        ],
        prefs: {
            backgroundImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
            backgroundColor: '#89609e'
        }
      };
    }

    // 2. MARKETING
    if (text.includes('marketing') || text.includes('campaign') || text.includes('brand')) {
        return {
          lists: [
            { id: 'l1', name: 'Campaign Ideas' },
            { id: 'l2', name: 'Content Creation' },
            { id: 'l3', name: 'In Review' },
            { id: 'l4', name: 'Scheduled' }
          ],
          cards: [
            { id: 'c1', idList: 'l1', name: 'Q4 Social Strategy' },
            { id: 'c2', idList: 'l2', name: 'Blog Post: AI Trends' },
            { id: 'c3', idList: 'l2', name: 'Video Script' },
            { id: 'c4', idList: 'l3', name: 'Newsletter Draft' }
          ],
          prefs: {
              backgroundImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop',
              backgroundColor: '#D29034'
          }
        };
      }
    
    // 3. DEFAULT
    return {
      lists: [
        { id: 'l1', name: 'Backlog' },
        { id: 'l2', name: 'In Progress' },
        { id: 'l3', name: 'Review' },
        { id: 'l4', name: 'Done' }
      ],
      cards: [
        { id: 'c1', idList: 'l1', name: 'Kickoff Meeting' },
        { id: 'c2', idList: 'l1', name: 'Resource Allocation' },
        { id: 'c3', idList: 'l2', name: 'Design Sprint' },
        { id: 'c4', idList: 'l3', name: 'Client Approval' }
      ],
      prefs: {
          backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
          backgroundColor: '#0079bf'
      }
    };
  };

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Fetch failed");
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. Silent Load
      const realData = await safeFetch(`https://trello.com/b/${BOARD_ID}.json?_=${Date.now()}`);
      if (realData && realData.lists && realData.lists.length > 0) {
        setBoardData(realData);
      }

      // 2. Wake up Sarah
      const chatData = await safeFetch('/api/trello-chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message: 'Hi', history: [], isNewSession: true })
      });
      
      if (chatData) {
        setMessages([{ role: 'sarah', content: chatData.reply }]);
      } else {
        setMessages([{ role: 'sarah', content: "I'm online. Ready to build your workflow." }]);
      }
    };
    init();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const textSnapshot = input;
    const userMsg = { role: 'user', content: textSnapshot };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role === 'sarah' ? 'assistant' : 'user',
      content: m.content
    }));

    try {
      // 1. Send to API & WAIT for Reply
      const data = await safeFetch('/api/trello-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textSnapshot, history: [...history, userMsg] })
      });
      
      const replyText = data ? data.reply : "I've drafted that layout for you.";
      setMessages(prev => [...prev, { role: 'sarah', content: replyText }]);

      // --- THE FIX: SYNCED TRIGGER LOGIC ---
      
      // Condition A: Sarah EXPLICITLY says she created something
      const sarahConfirmed = /created|set up|built|here is|updated|added/i.test(replyText);
      
      // Condition B: You EXPLICITLY ordered a build (Strong Verbs only)
      const userOrdered = /create|build|make|generate/i.test(textSnapshot);

      // Only simulate if one of these is true. 
      // Merely saying "10 risks" will NOT trigger this anymore.
      if (sarahConfirmed || userOrdered) {
          
          console.log("Trigger confirmed. Updating board...");
          const simData = getSimulationData(textSnapshot + " " + replyText); // Mix contexts
          setBoardData(simData);
          setUsingSimulation(true);

          // Optional: Background check for real data
          setTimeout(async () => {
             const realData = await safeFetch(`https://trello.com/b/${BOARD_ID}.json?_=${Date.now()}`);
             if (realData && realData.lists && realData.lists.length > 0) {
                 setBoardData(realData);
                 setUsingSimulation(false);
             }
          }, 3000);
      }

    } catch (e) {
      setMessages(prev => [...prev, { role: 'sarah', content: "I've updated the board layout based on your request." }]);
      const simData = getSimulationData(textSnapshot);
      setBoardData(simData);
      setUsingSimulation(true);
    } finally {
      setLoading(false); 
    }
  };

  // --- RENDER HELPERS ---
  const getCardsByList = (listId: string) => {
    if (!boardData?.cards) return [];
    return boardData.cards.filter(c => c.idList === listId);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50 font-sans">
      {/* Left Panel: Chat */}
      <div className="w-[400px] flex flex-col bg-white shadow-2xl z-20 border-r border-gray-100">
        <div className="p-5 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-lg">S</div>
            <div>
              <h2 className="font-bold text-gray-800">Sarah</h2>
              <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block">AI Sales Engineer</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                msg.role === 'sarah' 
                  ? 'bg-white text-gray-700 border border-gray-100 rounded-tl-none' 
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                 <div className="flex gap-1.5">
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                 </div>
               </div>
             </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={loading ? "Waiting for response..." : "Type a message..."}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              disabled={loading}
            />
            <button 
              onClick={sendMessage} 
              className={`w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              ➝
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Trello Mirror */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-100 relative">
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
             <div className="bg-white/90 backdrop-blur shadow-sm px-4 py-2 rounded-lg pointer-events-auto flex items-center gap-2">
                <span className="font-bold text-gray-800 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${usingSimulation ? 'bg-indigo-500' : 'bg-green-500'} animate-pulse`}></span>
                    {usingSimulation ? 'Preview Mode' : 'Live Board'}
                </span>
                <span className="text-xs text-gray-400 border-l pl-2 ml-2">
                    {boardData?.lists?.length || 0} Lists • {boardData?.cards?.length || 0} Cards
                </span>
             </div>
             <a 
                href={`https://trello.com/b/${BOARD_ID}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/90 backdrop-blur shadow-sm px-4 py-2 rounded-lg text-sm text-blue-600 font-medium hover:bg-white pointer-events-auto"
             >
                Open Trello ↗
             </a>
        </div>

        <div 
            className="flex-1 overflow-x-auto p-8 pt-20"
            style={{
                backgroundImage: boardData?.prefs?.backgroundImage ? `url(${boardData.prefs.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: boardData?.prefs?.backgroundColor || '#0079bf'
            }}
        >
            {/* EMPTY STATE */}
            {(!boardData || (boardData.lists || []).length === 0) && (
                <div className="flex h-full items-center justify-center">
                    <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-xl text-center max-w-md">
                        {loading ? (
                            <>
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <h3 className="font-bold text-gray-800">Sarah is Thinking...</h3>
                            </>
                        ) : (
                            <>
                                <h3 className="font-bold text-gray-800 text-lg mb-2">Ready to Build</h3>
                                <p className="text-gray-600">Tell Sarah about your project (e.g., "Create a Risk Management board") to see the magic.</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-start gap-4 h-full">
                {(boardData?.lists || []).map(list => (
                    <div key={list.id} className="w-72 shrink-0 bg-[#f1f2f4] rounded-xl flex flex-col shadow-xl max-h-full border border-white/40">
                        <div className="p-3 font-bold text-[#172b4d] text-sm flex justify-between">
                            {list.name}
                        </div>
                        <div className="px-2 pb-2 overflow-y-auto space-y-2 min-h-[10px] scrollbar-thin">
                            {getCardsByList(list.id).map(card => (
                                <div key={card.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm text-[#172b4d] font-medium hover:border-blue-400 cursor-default">
                                    {card.name}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}