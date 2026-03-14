import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Image as ImageIcon, Code, Shield, Menu, X, Sparkles, Send, Zap, Loader2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithAI, generateImage, explainCode } from './services/gemini';

// Types
type Tab = 'chat' | 'generate' | 'code' | 'privacy';
type Message = { role: 'user' | 'ai'; content: string };

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] p-0 sm:p-4 font-sans">
      {/* 9:16 Mobile Container */}
      <div className="mobile-container relative glass sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-w-[450px] w-full border-white/10 bg-black/40">
        
        {/* Header */}
        <header className="p-5 flex justify-between items-center z-20 bg-black/40 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Loop AI</h1>
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/5 rounded-full transition-all active:scale-90"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative p-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && <ChatView key="chat" sessionId={sessionId} />}
            {activeTab === 'generate' && <GenerateView key="generate" />}
            {activeTab === 'code' && <CodeView key="code" />}
            {activeTab === 'privacy' && <PrivacyView key="privacy" />}
          </AnimatePresence>
        </main>

        {/* Navigation Bar */}
        <nav className="p-4 pb-8 sm:pb-4 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center z-20">
          <NavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={<MessageSquare size={20} />} 
            label="Chat" 
          />
          <NavButton 
            active={activeTab === 'generate'} 
            onClick={() => setActiveTab('generate')} 
            icon={<ImageIcon size={20} />} 
            label="Gen" 
          />
          <NavButton 
            active={activeTab === 'code'} 
            onClick={() => setActiveTab('code')} 
            icon={<Code size={20} />} 
            label="Code" 
          />
          <NavButton 
            active={activeTab === 'privacy'} 
            onClick={() => setActiveTab('privacy')} 
            icon={<Shield size={20} />} 
            label="Legal" 
          />
        </nav>

        {/* Side Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute inset-0 z-30 glass backdrop-blur-3xl p-8 flex flex-col gap-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-display">Settings</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Current Session</p>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <code className="text-emerald-400 text-xs font-mono">{sessionId}</code>
                    <Zap size={14} className="text-emerald-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Quick Actions</p>
                  <button className="w-full p-4 glass rounded-2xl text-left text-sm hover:bg-white/10 transition-all">Clear History</button>
                  <button className="w-full p-4 glass rounded-2xl text-left text-sm hover:bg-white/10 transition-all">Export Data</button>
                </div>
              </div>

              <div className="mt-auto flex flex-col items-center gap-2 opacity-30">
                <Zap size={24} />
                <p className="text-[10px] font-bold tracking-widest uppercase">Loop AI v1.0.0</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${active ? 'text-emerald-400 scale-110' : 'text-white/30 hover:text-white/60'}`}
    >
      <div className={`p-2 rounded-xl transition-all duration-500 ${active ? 'bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : ''}`}>
        {icon}
      </div>
      <span className="text-[9px] uppercase font-black tracking-widest">{label}</span>
    </button>
  );
}

// --- Views ---

function ChatView({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'أهلاً بك! أنا Loop AI، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const stream = await chatWithAI(userMsg, messages);
      let aiResponse = '';
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      for await (const chunk of stream) {
        aiResponse += chunk.text;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = aiResponse;
          return newMsgs;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <div ref={scrollRef} className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 custom-scrollbar">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-emerald-500 text-black font-medium rounded-tr-none shadow-lg shadow-emerald-500/10' 
                : 'glass border-white/5 rounded-tl-none text-white/90'
            }`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass p-4 rounded-2xl rounded-tl-none">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto relative group">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..." 
          className="w-full p-4 pr-14 rounded-2xl glass border-white/5 focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-white/20 text-sm"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all active:scale-90 disabled:opacity-50 disabled:scale-100"
        >
          <Send size={18} fill="currentColor" />
        </button>
      </div>
    </motion.div>
  );
}

function GenerateView() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await generateImage(prompt);
      setImage(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold font-display gradient-text">Image Gen</h2>
        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Powered by Loop AI</p>
      </div>

      <div className="relative aspect-square rounded-[2rem] glass overflow-hidden border-white/5 group">
        {image ? (
          <>
            <img src={image} alt="Generated" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all"><Download size={20} /></button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/10">
            <div className="p-8 rounded-full bg-white/[0.02] border border-white/5">
              {isLoading ? <Loader2 size={40} className="animate-spin text-emerald-500/50" /> : <ImageIcon size={40} />}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Ready to create</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city with neon lights and flying cars..." 
            className="w-full p-5 rounded-3xl glass border-white/5 h-32 resize-none focus:outline-none focus:border-cyan-500/30 transition-all text-sm placeholder:text-white/20"
          />
          <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-mono">
            {prompt.length}/500
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full p-5 bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} fill="currentColor" />}
          Generate Magic
        </button>
      </div>
    </motion.div>
  );
}

function CodeView() {
  const [code, setCode] = useState('// Paste your code here to explain it...');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await explainCode(code);
      setExplanation(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Code size={20} /></div>
          <h2 className="text-xl font-bold font-display">Code Lab</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 p-4 font-mono text-[11px] relative">
          <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-emerald-400/80 min-h-[120px] resize-none custom-scrollbar"
          />
          <div className="absolute top-2 right-2 flex gap-2">
             <div className="w-2 h-2 rounded-full bg-red-500/50" />
             <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
             <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>

        <button 
          onClick={handleExplain}
          disabled={isLoading}
          className="w-full p-4 glass border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
          Explain Logic
        </button>

        <AnimatePresence>
          {explanation && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-sm text-white/80 leading-relaxed"
            >
              <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                <Sparkles size={12} />
                AI Explanation
              </div>
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PrivacyView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-10"
    >
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000" />
        
        <h2 className="text-3xl font-bold font-display mb-6 flex items-center gap-3">
          <Shield className="text-emerald-400" size={28} />
          Privacy
        </h2>
        
        <div className="space-y-6 text-sm text-white/50 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              No Login Required
            </h3>
            <p>نحن نؤمن بالوصول الحر. لا نطلب بريدك الإلكتروني أو أي معلومات تعريفية. هويتك هي مجرد معرف جلسة عشوائي.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              Session Isolation
            </h3>
            <p>كل جلسة معزولة تماماً. يتم تخزين سجل المحادثات محلياً في ذاكرة الجلسة ويختفي بمجرد إغلاقك للتطبيق.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Data Security
            </h3>
            <p>يتم تشفير جميع الطلبات المرسلة إلى خوادم الذكاء الاصطناعي لضمان أقصى درجات الأمان والسرية.</p>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-between items-center">
            <p className="text-[10px] font-bold uppercase tracking-widest">Last Updated: March 2026</p>
            <Zap size={16} className="text-emerald-500/20" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
