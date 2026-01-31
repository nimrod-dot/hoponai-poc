'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Official Monday.com brand colors
const MONDAY = {
  // Primary
  purple: '#6161FF',
  dark: '#181B34',
  light: '#F0F3FF',
  white: '#FFFFFF',
  
  // Supportive (status colors)
  green: '#00CA72',      // Done
  yellow: '#FFCC00',     // Working on it
  red: '#FB275D',        // Stuck
  
  // UI colors (from Monday's interface)
  blue: '#0073EA',       // Primary action blue
  lightBlue: '#CCE5FF',
  darkText: '#323338',
  grayText: '#676879',
  lightGray: '#C5C7D0',
  border: '#E6E9EF',
  hoverBg: '#DCDFEC',
  selectedBg: '#E6E9EF',
  tableBg: '#FFFFFF',
  headerBg: '#F6F7FB',
};

// Status configurations matching Monday exactly
const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  'Done': { bg: '#00C875', text: '#FFFFFF' },
  'Working on it': { bg: '#FDAB3D', text: '#FFFFFF' },
  'Stuck': { bg: '#E2445C', text: '#FFFFFF' },
  'Not Started': { bg: '#C4C4C4', text: '#FFFFFF' },
  'In Progress': { bg: '#FDAB3D', text: '#FFFFFF' },
  'To Do': { bg: '#579BFC', text: '#FFFFFF' },
  'In Review': { bg: '#A25DDC', text: '#FFFFFF' },
  'Backlog': { bg: '#C4C4C4', text: '#FFFFFF' },
  'Blocked': { bg: '#E2445C', text: '#FFFFFF' },
  'Pending': { bg: '#FDAB3D', text: '#FFFFFF' },
  'Complete': { bg: '#00C875', text: '#FFFFFF' },
};

function getStatusStyle(status: string) {
  return STATUS_CONFIG[status] || { bg: '#00C875', text: '#FFFFFF' };
}

// Monday-style icons as SVG
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
  </svg>
);

const Search = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const Person = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const Filter = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
  </svg>
);

const Sort = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" />
  </svg>
);

const Hide = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
  </svg>
);

const GroupBy = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const Checkbox = ({ checked = false }: { checked?: boolean }) => (
  <div 
    className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors
      ${checked ? 'bg-[#0073EA] border-[#0073EA]' : 'border-[#C5C7D0] hover:border-[#0073EA]'}`}
  >
    {checked && (
      <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    )}
  </div>
);

// Monday Board Component
function MondayBoard({ 
  boardName, 
  items, 
  isCreating,
  boardId
}: { 
  boardName: string; 
  items: { name: string; status?: string }[]; 
  isCreating: boolean;
  boardId?: string;
}) {
  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Bar with Board Name */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: MONDAY.border }}>
        <div className="flex items-center gap-3">
          {/* Board icon */}
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#00CA72] to-[#00CA72] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="white">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: MONDAY.darkText }}>
            {boardName || 'Sarah Demo Board'}
          </h1>
          <ChevronDown />
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Integrate
          </button>
          <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Automate
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <button className="px-3 py-1.5 text-sm rounded flex items-center gap-1.5 text-white" style={{ backgroundColor: MONDAY.blue }}>
            Invite / 1
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="px-4 border-b flex items-center" style={{ borderColor: MONDAY.border }}>
        <div 
          className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px"
          style={{ 
            color: MONDAY.blue,
            borderColor: MONDAY.blue,
            backgroundColor: 'rgba(0, 115, 234, 0.08)'
          }}
        >
          Main Table
        </div>
        <div className="px-3 py-2.5 text-sm flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded-t" style={{ color: MONDAY.grayText }}>
          <Plus />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center gap-1 border-b" style={{ borderColor: MONDAY.border, backgroundColor: '#FAFBFC' }}>
        <button 
          className="px-4 py-1.5 rounded-md text-white text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition"
          style={{ backgroundColor: MONDAY.blue }}
        >
          New item
          <ChevronDown />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-2"></div>
        
        <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
          <Search /> Search
        </button>
        <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
          <Person /> Person
        </button>
        <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
          <Filter /> Filter
        </button>
        <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
          <Sort /> Sort
        </button>
        <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
          <Hide /> Hide
        </button>
        <button className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-1.5" style={{ color: MONDAY.grayText }}>
          <GroupBy /> Group by
        </button>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#F6F7FB' }}>
        <div className="p-4">
          {/* Group */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border" style={{ borderColor: MONDAY.border }}>
            {/* Group Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border-l-[6px]" style={{ borderLeftColor: MONDAY.blue }}>
              <button className="p-0.5 hover:bg-gray-100 rounded">
                <ChevronDown />
              </button>
              <span className="font-semibold text-sm" style={{ color: MONDAY.blue }}>
                Group Title
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: MONDAY.light, color: MONDAY.grayText }}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Column Headers */}
            <div 
              className="grid text-xs font-medium border-y"
              style={{ 
                gridTemplateColumns: '44px minmax(300px, 1fr) 150px 130px 130px',
                borderColor: MONDAY.border,
                color: MONDAY.grayText,
                backgroundColor: MONDAY.headerBg
              }}
            >
              <div className="flex items-center justify-center py-2 border-r" style={{ borderColor: MONDAY.border }}>
                <Checkbox />
              </div>
              <div className="py-2 px-3 border-r flex items-center" style={{ borderColor: MONDAY.border }}>
                Item
              </div>
              <div className="py-2 px-3 border-r text-center" style={{ borderColor: MONDAY.border }}>
                Status
              </div>
              <div className="py-2 px-3 border-r text-center" style={{ borderColor: MONDAY.border }}>
                Owner
              </div>
              <div className="py-2 px-3 text-center">
                Date
              </div>
            </div>

            {/* Items */}
            {items.length === 0 && !isCreating ? (
              <div className="px-4 py-12 text-center" style={{ color: MONDAY.grayText }}>
                <div className="text-4xl mb-3">📋</div>
                <p className="font-medium">No items yet</p>
                <p className="text-sm mt-1">Tell Sarah about your workflow to get started</p>
              </div>
            ) : (
              <div>
                {items.map((item, index) => {
                  const statusStyle = getStatusStyle(item.status || 'Done');
                  return (
                    <div 
                      key={index}
                      className="grid text-sm border-b hover:bg-[#F5F6F8] transition-colors animate-slideIn"
                      style={{ 
                        gridTemplateColumns: '44px minmax(300px, 1fr) 150px 130px 130px',
                        borderColor: MONDAY.border,
                        borderLeftWidth: '6px',
                        borderLeftColor: statusStyle.bg,
                        animationDelay: `${index * 80}ms`
                      }}
                    >
                      <div className="flex items-center justify-center py-3 border-r" style={{ borderColor: MONDAY.border }}>
                        <Checkbox />
                      </div>
                      <div className="py-3 px-3 border-r font-medium" style={{ borderColor: MONDAY.border, color: MONDAY.darkText }}>
                        {item.name}
                      </div>
                      <div className="py-3 px-2 border-r flex justify-center items-center" style={{ borderColor: MONDAY.border }}>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium min-w-[90px] text-center"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {item.status || 'Done'}
                        </span>
                      </div>
                      <div className="py-3 px-3 border-r flex justify-center items-center" style={{ borderColor: MONDAY.border }}>
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: MONDAY.lightBlue, color: MONDAY.blue }}
                        >
                          NS
                        </div>
                      </div>
                      <div className="py-3 px-3 flex justify-center items-center text-xs" style={{ color: MONDAY.grayText }}>
                        Jan 27
                      </div>
                    </div>
                  );
                })}
                
                {/* Creating indicator */}
                {isCreating && (
                  <div 
                    className="grid text-sm border-b animate-pulse"
                    style={{ 
                      gridTemplateColumns: '44px minmax(300px, 1fr) 150px 130px 130px',
                      borderColor: MONDAY.border,
                      backgroundColor: 'rgba(0, 115, 234, 0.05)'
                    }}
                  >
                    <div className="py-3"></div>
                    <div className="py-3 px-3 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: MONDAY.blue, borderTopColor: 'transparent' }}></div>
                      <span style={{ color: MONDAY.grayText }}>Sarah is adding items...</span>
                    </div>
                    <div className="py-3"></div>
                    <div className="py-3"></div>
                    <div className="py-3"></div>
                  </div>
                )}
              </div>
            )}

            {/* Add Item Row */}
            <div 
              className="px-3 py-2 text-sm cursor-pointer hover:bg-[#F5F6F8] flex items-center gap-2 border-l-[6px]"
              style={{ color: MONDAY.grayText, borderLeftColor: 'transparent' }}
            >
              <Plus />
              <span>Add item</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Sync Status */}
      {items.length > 0 && (
        <div 
          className="px-4 py-2.5 border-t flex items-center justify-between text-sm"
          style={{ borderColor: MONDAY.border, backgroundColor: '#F0FFF4' }}
        >
          <div className="flex items-center gap-2" style={{ color: '#166534' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Synced to your Monday.com account</span>
          </div>
          {boardId && (
            <a 
              href={`https://monday.com/boards/${boardId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium hover:underline"
              style={{ color: MONDAY.blue }}
            >
              Open in Monday.com
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(-10px);
          }
          to { 
            opacity: 1; 
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default function DemoPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardId, setBoardId] = useState<string | null>(null);
  const [items, setItems] = useState<{name: string, status?: string}[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    const initChat = async () => {
      setLoading(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', history: [], token })
      });
      const data = await res.json();
      setMessages([{ role: 'sarah', content: data.reply }]);
      setLoading(false);
    };
    initChat();
  }, [token]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !token) return;
    
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const history = newMessages.map(m => ({
      role: m.role === 'sarah' ? 'assistant' : 'user',
      content: m.content
    }));

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: input, 
        history: history.slice(0, -1), 
        token
      })
    });
    const data = await res.json();
    
    setMessages(prev => [...prev, { role: 'sarah', content: data.reply }]);
    
    // Handle optimistic UI update
    if (data.boardName) {
      setBoardName(data.boardName);
      setIsCreating(true);
      
      if (data.boardId) {
        setBoardId(data.boardId);
      }
      
      // Animate items appearing one by one
      if (data.items && data.items.length > 0) {
        for (let i = 0; i < data.items.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 350));
          setItems(prev => [...prev, data.items[i]]);
        }
      }
      setIsCreating(false);
    }
    
    setLoading(false);
  };

  // Login screen
  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F7FB' }}>
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md border" style={{ borderColor: MONDAY.border }}>
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF3D57 0%, #FF9F43 50%, #00D68F 100%)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: MONDAY.darkText }}>
            Experience Sarah in Action
          </h1>
          <p className="mb-6" style={{ color: MONDAY.grayText }}>
            Connect your Monday.com account to see Sarah build your personalized workflow in real-time.
          </p>
          <a 
            href="/api/auth/monday"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: MONDAY.blue }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="6" cy="6" r="3" fill="#FF3D57"/>
              <circle cx="12" cy="6" r="3" fill="#FFCB00"/>
              <circle cx="18" cy="6" r="3" fill="#00D68F"/>
            </svg>
            Connect Monday.com
          </a>
          <p className="mt-4 text-xs" style={{ color: MONDAY.lightGray }}>
            Secure OAuth 2.0 connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F6F7FB' }}>
      {/* Left: Chat Panel */}
      <div className="w-[380px] flex flex-col bg-white border-r" style={{ borderColor: MONDAY.border }}>
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: MONDAY.border }}>
          <div 
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{ background: 'linear-gradient(135deg, #0073EA 0%, #6161FF 100%)' }}
          >
            S
          </div>
          <div className="flex-1">
            <h2 className="font-bold" style={{ color: MONDAY.darkText }}>Sarah</h2>
            <p className="text-xs" style={{ color: MONDAY.grayText }}>AI Sales Engineer</p>
          </div>
          <div 
            className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium"
            style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Connected
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#FAFBFC' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === 'sarah' 
                    ? 'bg-white border rounded-bl-md' 
                    : 'text-white rounded-br-md'
                }`}
                style={{ 
                  borderColor: msg.role === 'sarah' ? MONDAY.border : undefined,
                  backgroundColor: msg.role === 'user' ? MONDAY.blue : undefined
                }}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm" style={{ borderColor: MONDAY.border }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: MONDAY.grayText, animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: MONDAY.grayText, animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: MONDAY.grayText, animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: MONDAY.border }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
              style={{ borderColor: MONDAY.border, outlineColor: MONDAY.blue }}
              disabled={loading}
            />
            <button 
              onClick={sendMessage} 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: MONDAY.blue }}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Monday Board */}
      <div className="flex-1">
        <MondayBoard 
          boardName={boardName} 
          items={items} 
          isCreating={isCreating}
          boardId={boardId || undefined}
        />
      </div>
    </div>
  );
}
