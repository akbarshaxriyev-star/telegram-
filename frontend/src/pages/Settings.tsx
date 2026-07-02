import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, MessageSquare, Settings as SettingsIcon, LogOut } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const { token, logout } = useStore();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("Siz foydalanuvchining shaxsiy Telegram akkaunti egasi nomidan javob beryapsiz. Muloyim bo'ling. Tabiiy javob bering. Sun'iy intellekt ekanligingizni bildirmang. Agar bilmasangiz 'Keyinroq javob beraman' deb ayting. Iloji boricha qisqa javob bering.");
  const [enabled, setEnabled] = useState("true");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [minDelay, setMinDelay] = useState("2");
  const [maxDelay, setMaxDelay] = useState("10");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/settings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setPrompt(res.data.systemPrompt || "");
          setEnabled(res.data.enabled ? "true" : "false");
          setModel(res.data.gptModel || "gemini-2.5-flash");
          setMinDelay(res.data.typingDelayMin?.toString() || "2");
          setMaxDelay(res.data.typingDelayMax?.toString() || "10");
        }
      } catch (err) {
        console.error("Sozlamalarni olishda xatolik", err);
      }
    };
    fetchSettings();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await axios.post("/api/settings", {
        systemPrompt: prompt,
        enabled: enabled === "true",
        gptModel: model,
        typingDelayMin: minDelay,
        typingDelayMax: maxDelay
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Sozlamalar saqlandi!");
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden relative">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-800 border-r border-slate-700 flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-500 flex items-center gap-2">
            <Bot size={24} /> AI Avto-Javob
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 rounded-lg transition">
            <MessageSquare size={20} /> Dashboard
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg transition">
            <SettingsIcon size={20} /> Sozlamalar
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
        <Link to="/dashboard" className="p-2 flex flex-col items-center text-slate-400 hover:text-slate-200 transition">
          <MessageSquare size={20} />
          <span className="text-[10px] mt-1 font-medium">Asosiy</span>
        </Link>
        <Link to="/settings" className="p-2 flex flex-col items-center text-blue-400">
          <SettingsIcon size={20} />
          <span className="text-[10px] mt-1 font-medium">Sozlamalar</span>
        </Link>
        <button onClick={handleLogout} className="p-2 flex flex-col items-center text-red-400 hover:text-red-300 transition">
          <LogOut size={20} />
          <span className="text-[10px] mt-1 font-medium">Chiqish</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0 w-full">
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-2 mb-6 text-blue-500 font-bold text-lg">
            <Bot size={24} /> AI Avto-Javob
          </div>

          <header className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Sozlamalar</h2>
            <p className="text-sm md:text-base text-slate-400">AI va Telegram qoidalarini moslashtiring</p>
          </header>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 md:p-6 space-y-4 md:space-y-6 shadow-sm">
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Asosiy Prompt (AI qanday javob berishi kerak?)</label>
              <textarea 
                rows={5}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">AI Javob berishi</label>
                <select value={enabled} onChange={e => setEnabled(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm md:text-base text-slate-200 transition focus:border-blue-500">
                  <option value="true">Yoqilgan</option>
                  <option value="false">O'chirilgan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm md:text-base text-slate-200 transition focus:border-blue-500">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yozish kechikishi (minimal, soniya)</label>
                <input type="number" value={minDelay} onChange={e => setMinDelay(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm md:text-base text-slate-200 transition focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yozish kechikishi (maksimal, soniya)</label>
                <input type="number" value={maxDelay} onChange={e => setMaxDelay(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm md:text-base text-slate-200 transition focus:border-blue-500" />
              </div>
            </div>

            <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition cursor-pointer w-full mt-4 shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50">
              {isSaving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
