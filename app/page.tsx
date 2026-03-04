'use client';
import { useState, useRef } from 'react';
import { AUTHORS } from '@/lib/authors';
import { StoryMemory } from '@/lib/StoryMemory';
import { GameState, GameStats } from '@/lib/GameStats';
import { Sword, MessageSquare, Eye, Scroll, Heart, Zap, Star } from 'lucide-react';

export default function TheProtagonistGame() {
  const [selectedAuthor, setSelectedAuthor] = useState(AUTHORS[0]);
  const [mode, setMode] = useState<'adventure' | 'collaborative'>('adventure');
  const [input, setInput] = useState('');
  const [storyLog, setStoryLog] = useState<Array<{type: string, text: string, author?: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Game State
  const [gameStats, setGameStats] = useState<GameStats>({
    health: 100, maxHealth: 100, mana: 50, maxMana: 50, xp: 0, level: 1
  });
  const gameLogicRef = useRef(new GameState());
  
  const memoryRef = useRef(new StoryMemory());

  const handleAction = async (actionType: string) => {
    let actionText = "";
    if (actionType === "attack") actionText = "I draw my weapon and strike!";
    if (actionType === "talk") actionText = "I try to negotiate with them.";
    if (actionType === "investigate") actionText = "I examine the surroundings carefully.";
    if (actionType === "magic") actionText = "I cast a spell to reveal the truth.";

    setInput(actionText);
    // Automatically trigger turn
    setTimeout(() => handleTurn(actionText), 100);
  };

  const handleTurn = async (userActionOverride?: string) => {
    const userAction = userActionOverride || input;
    if (!userAction.trim()) return;
    
    setInput(''); // Clear input
    setIsGenerating(true);

    // 1. Add user input
    memoryRef.current.addNode(userAction, mode === 'collaborative' ? 'user_writing' : 'user_action');
    setStoryLog(prev => [...prev, { type: 'user_action', text: userAction }]);

    // 2. Get Context
    const context = memoryRef.current.getContext(userAction);

    if (mode === 'adventure') {
      try {
        const res = await fetch('/api/continue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            authorId: selectedAuthor.id, 
            context, 
            userAction, 
            mode,
            authorName: selectedAuthor.name,
            systemPrompt: selectedAuthor.systemPrompt
          }),
        });
        const data = await res.json();
        
        if (data.text) {
            // 3. Update Game Stats based on story result
            gameLogicRef.current.processResponse(data.text);
            setGameStats({...gameLogicRef.current.stats});

            // Check Level Up
            if (gameLogicRef.current.checkLevelUp()) {
                alert("LEVEL UP! You are now stronger.");
            }

            memoryRef.current.addNode(data.text, 'narrative');
            setStoryLog(prev => [...prev, { type: 'narrative', text: data.text, author: data.authorName }]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsGenerating(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-amber-500 selection:text-black overflow-hidden flex flex-col">
      
      {/* --- GAME HUD (Top) --- */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 shadow-xl z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          
          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2 text-red-400">
              <Heart size={16} /> 
              <span>{gameStats.health}/{gameStats.maxHealth}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Zap size={16} /> 
              <span>{gameStats.mana}/{gameStats.maxMana}</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-400">
              <Star size={16} /> 
              <span>Lvl {gameStats.level} (XP: {gameStats.xp})</span>
            </div>
          </div>

          {/* Author Selector (Narrative Style) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase">Style:</span>
            <select 
              value={selectedAuthor.id}
              onChange={(e) => setSelectedAuthor(AUTHORS.find(a => a.id === e.target.value)!)}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
            >
              {AUTHORS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* --- MAIN GAME AREA --- */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 gap-4">
        
        {/* Story Log (The "Screen") */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg p-6 overflow-y-auto custom-scroll relative">
           {/* Background FX */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none"></div>
           
           <div className="relative z-10 space-y-6">
            {storyLog.length === 0 && (
              <div className="text-center text-slate-500 mt-10 animate-pulse">
                <p>Initializing World...</p>
                <p className="text-xs mt-2">Select an action below to begin.</p>
              </div>
            )}

            {storyLog.map((entry, idx) => (
              <div key={idx} className={`opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]`} style={{animationDelay: `${idx * 0.1}s`}}>
                {entry.type === 'user_action' && (
                  <div className="text-right text-amber-500/80 text-sm mb-1 font-bold">
                    {">"} {entry.text}
                  </div>
                )}
                {entry.type === 'narrative' && (
                  <div className="bg-slate-800/80 p-4 rounded-l-lg border-l-4 border-amber-600 shadow-lg">
                    <p className="text-slate-200 leading-relaxed">{entry.text}</p>
                    <div className="text-[10px] text-slate-500 mt-2 text-right uppercase tracking-widest">— {entry.author}</div>
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="text-amber-500 text-sm animate-pulse font-bold">
                The world is shifting...
              </div>
            )}
           </div>
        </div>

        {/* --- ACTION BAR (Bottom) --- */}
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl">
          
          {/* Quick Actions */}
          <div className="flex gap-2 mb-3 justify-center">
            <button onClick={() => handleAction('attack')} className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-200 py-2 rounded flex flex-col items-center justify-center transition-all group">
              <Sword size={20} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold">Attack</span>
            </button>
            <button onClick={() => handleAction('talk')} className="flex-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-200 py-2 rounded flex flex-col items-center justify-center transition-all group">
              <MessageSquare size={20} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold">Talk</span>
            </button>
            <button onClick={() => handleAction('investigate')} className="flex-1 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800 text-emerald-200 py-2 rounded flex flex-col items-center justify-center transition-all group">
              <Eye size={20} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold">Investigate</span>
            </button>
            <button onClick={() => handleAction('magic')} className="flex-1 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800 text-purple-200 py-2 rounded flex flex-col items-center justify-center transition-all group">
              <Zap size={20} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold">Magic</span>
            </button>
          </div>

          {/* Custom Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleTurn(); }} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Or type a custom action..."
              className="w-full bg-slate-950 text-slate-100 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600 border border-slate-800"
            />
            <button type="submit" className="absolute right-2 top-2 p-1.5 bg-amber-600 rounded text-white hover:bg-amber-500 transition-colors">
              <Scroll size={16} />
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}