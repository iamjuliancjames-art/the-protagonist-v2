'use client';
import { useState, useRef } from 'react';
import { AUTHORS } from '@/lib/authors';
import { StoryMemory } from '@/lib/StoryMemory';
import { BookOpen, PenTool, Download, RefreshCw } from 'lucide-react';

export default function TheProtagonist() {
  const [selectedAuthor, setSelectedAuthor] = useState(AUTHORS[0]);
  const [mode, setMode] = useState<'adventure' | 'collaborative'>('adventure');
  const [input, setInput] = useState('');
  const [storyLog, setStoryLog] = useState<Array<{type: string, text: string, author?: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const memoryRef = useRef(new StoryMemory());

  const handleTurn = async () => {
    if (!input.trim()) return;
    
    const userAction = input;
    setInput('');
    setIsGenerating(true);

    // 1. Add user input to memory
    memoryRef.current.addNode(userAction, mode === 'collaborative' ? 'user_writing' : 'user_action');
    
    // Update UI with user action
    setStoryLog(prev => [...prev, { 
      type: mode === 'collaborative' ? 'user_writing' : 'user_action', 
      text: userAction 
    }]);

    // 2. Get Context
    const context = memoryRef.current.getContext(userAction);

    if (mode === 'adventure') {
      // 3. Generate AI Response
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
        
        // 4. Add AI response to memory and UI
        if (data.text) {
            memoryRef.current.addNode(data.text, 'narrative');
            setStoryLog(prev => [...prev, { 
            type: 'narrative', 
            text: data.text, 
            author: data.authorName 
            }]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    setIsGenerating(false);
  };

  const handleExport = () => {
    const fullText = `THE PROTAGONIST\nStyle: ${selectedAuthor.name}\n\n` + memoryRef.current.getFullStory();
    const blob = new Blob([fullText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-protagonist-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if(confirm("Clear current story?")) {
      memoryRef.current.clear();
      setStoryLog([]);
    }
  };

  return (
    <main className="min-h-screen bg-stone-900 text-stone-200 font-serif selection:bg-amber-500 selection:text-black">
      <div className="max-w-3xl mx-auto p-6 min-h-screen flex flex-col">
        
        {/* Header / Controls */}
        <header className="mb-8 pb-6 border-b border-stone-700">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tighter text-amber-500 mb-2">The Protagonist</h1>
              <p className="text-stone-400 text-sm">An infinite adventure generator</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset} className="p-2 hover:bg-stone-800 rounded text-stone-400" title="Reset Story">
                <RefreshCw size={20} />
              </button>
              <button onClick={handleExport} className="p-2 hover:bg-stone-800 rounded text-amber-500" title="Export to Markdown">
                <Download size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Narrative Voice</label>
              <div className="flex flex-wrap gap-2">
                {AUTHORS.map(author => (
                  <button
                    key={author.id}
                    onClick={() => setSelectedAuthor(author)}
                    className={`px-3 py-1 text-sm border rounded transition-colors ${
                      selectedAuthor.id === author.id 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                        : 'border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    {author.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('adventure')}
                  className={`flex-1 py-2 text-sm font-mono border rounded flex items-center justify-center gap-2 ${
                    mode === 'adventure' 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                      : 'border-stone-700 hover:border-stone-500'
                  }`}
                >
                  <BookOpen size={16} /> Adventure
                </button>
                <button
                  onClick={() => setMode('collaborative')}
                  className={`flex-1 py-2 text-sm font-mono border rounded flex items-center justify-center gap-2 ${
                    mode === 'collaborative' 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                      : 'border-stone-700 hover:border-stone-500'
                  }`}
                >
                  <PenTool size={16} /> Co-Write
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-stone-500 italic">"{selectedAuthor.description}"</p>
        </header>

        {/* Story Feed */}
        <div className="flex-1 overflow-y-auto space-y-8 mb-8 pr-2 custom-scroll">
          {storyLog.length === 0 && (
            <div className="text-center text-stone-600 mt-20">
              <p className="text-2xl mb-2">The page is blank.</p>
              <p>Begin by directing the protagonist.</p>
            </div>
          )}

          {storyLog.map((entry, idx) => (
            <div key={idx} className={`animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              {entry.type === 'user_action' && (
                <div className="pl-4 border-l-2 border-amber-500/50 text-stone-400 italic text-sm mb-2">
                  You choose to: {entry.text}
                </div>
              )}
              {entry.type === 'user_writing' && (
                <div className="pl-4 border-l-2 border-purple-500/50 text-purple-300 text-sm mb-2">
                  You wrote: {entry.text}
                </div>
              )}
              {entry.type === 'narrative' && (
                <div className="prose prose-invert prose-stone max-w-none">
                  <p className="text-lg leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:text-amber-500 first-letter:mr-1 first-letter:float-left">
                    {entry.text}
                  </p>
                  <span className="text-xs text-stone-600 block mt-2 text-right">— {entry.author}</span>
                </div>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="text-stone-500 text-sm animate-pulse flex items-center gap-2">
              <span>Writing</span>
              <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce delay-75"></span>
              <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce delay-150"></span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-stone-900 pt-4 border-t border-stone-800">
          <form onSubmit={(e) => { e.preventDefault(); handleTurn(); }} className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'adventure' ? "What does the protagonist do next?" : "Write the next passage yourself..."}
              className="w-full bg-stone-800 text-stone-100 rounded-lg p-4 pr-14 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-24 shadow-lg placeholder-stone-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTurn();
                }
              }}
            />
            <button 
              type="submit" 
              disabled={isGenerating || !input.trim()}
              className="absolute right-3 bottom-3 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PenTool size={18} />
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
