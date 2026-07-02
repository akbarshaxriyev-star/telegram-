import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { Bot, MessageSquare, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import TelegramConnect from '../components/TelegramConnect';

export default function Dashboard() {
  const { user, token, logout } = useStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{from: string, text: string}[]>([]);
  const [isTelegramConnected, setIsTelegramConnected] = useState(user?.isTelegramConnected || false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const socket = io('http://localhost:5000');
    socket.on('ai_replied', (data) => {
      setMessages(prev => [{from: "AI", text: data.text}, ...prev].slice(0, 10));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden relative">
      {showConnectModal && (
        <TelegramConnect 
          onClose={() => setShowConnectModal(false)} 
          onConnected={() => setIsTelegramConnected(true)} 
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-800 border-r border-slate-700 flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-500 flex items-center gap-2">
            <Bot size={24} /> AI Avto-Javob
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg transition">
            <MessageSquare size={20} /> Dashboard
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 rounded-lg transition">
            <Settings size={20} /> Sozlamalar
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-red-400 hover:bg-red-400/10 rounded-lg transition cursor-pointer">
            <LogOut size={20} /> Chiqish
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around p-2 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
        <Link to="/dashboard" className="p-2 flex flex-col items-center text-blue-400">
          <MessageSquare size={20} />
          <span className="text-[10px] mt-1 font-medium">Asosiy</span>
        </Link>
        <Link to="/settings" className="p-2 flex flex-col items-center text-slate-400 hover:text-slate-200 transition">
          <Settings size={20} />
          <span className="text-[10px] mt-1 font-medium">Sozlamalar</span>
        </Link>
        <button onClick={handleLogout} className="p-2 flex flex-col items-center text-red-400 hover:text-red-300 transition">
          <LogOut size={20} />
          <span className="text-[10px] mt-1 font-medium">Chiqish</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0 w-full">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-2 mb-6 text-blue-500 font-bold text-lg">
            <Bot size={24} /> AI Avto-Javob
          </div>

          <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Xush kelibsiz!</h2>
              <p className="text-sm md:text-base text-slate-400">Telefon: {user?.phone}</p>
            </div>
            {isTelegramConnected ? (
               <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full border border-green-500/20 w-fit">
                 <CheckCircle2 size={18} /> <span className="text-sm font-medium">Ulangan</span>
               </div>
            ) : (
               <button onClick={() => setShowConnectModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition cursor-pointer text-sm w-full md:w-auto shadow-lg shadow-blue-500/20">
                 Telegramga ulanish
               </button>
            )}
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
             <motion.div whileHover={{ y: -2 }} className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 shadow-sm">
               <h3 className="text-xs md:text-sm text-slate-400 font-medium mb-1 md:mb-2">Bugungi javoblar</h3>
               <p className="text-2xl md:text-4xl font-bold text-white">0</p>
             </motion.div>
             <motion.div whileHover={{ y: -2 }} className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 shadow-sm">
               <h3 className="text-xs md:text-sm text-slate-400 font-medium mb-1 md:mb-2">Aktiv chatlar</h3>
               <p className="text-2xl md:text-4xl font-bold text-white">0</p>
             </motion.div>
             <motion.div whileHover={{ y: -2 }} className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 shadow-sm col-span-2 md:col-span-1">
               <h3 className="text-xs md:text-sm text-slate-400 font-medium mb-1 md:mb-2">AI Statusi</h3>
               <p className="text-lg md:text-xl font-bold text-green-400 flex items-center gap-2">
                 <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 animate-pulse"></span> Faol
               </p>
             </motion.div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 md:p-6 shadow-sm">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">So'nggi AI javoblari</h3>
            <div className="space-y-3 md:space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={24} className="text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm">Hozircha javoblar yo'q...</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-slate-700/50">
                    <p className="text-xs md:text-sm font-medium text-blue-400 mb-1">{msg.from}</p>
                    <p className="text-sm md:text-base text-slate-300">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
