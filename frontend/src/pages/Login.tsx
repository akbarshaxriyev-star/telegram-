import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bot } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await axios.post(`${endpoint}`, { phone, password });
      setAuth(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-[420px] border border-slate-700/50"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/20">
            <Bot size={36} className="text-blue-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-1 text-white">
          {isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
        </h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          Telegram AI Avto-Javob tizimi
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Telefon raqam</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-slate-100 placeholder-slate-600 transition"
            />
            <p className="text-xs text-slate-500 mt-1">Telegram'dagi telefon raqamingizni kiriting</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Parol</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-slate-100 placeholder-slate-600 transition"
            />
            <p className="text-xs text-slate-500 mt-1">
              {isRegister ? "Dashboard uchun yangi parol o'ylab toping" : "Dashboard parolingizni kiriting"}
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
          >
            {loading ? "Yuklanmoqda..." : (isRegister ? "Ro'yxatdan o'tish" : "Kirish")}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-sm text-blue-400 hover:text-blue-300 transition cursor-pointer"
          >
            {isRegister 
              ? "Akkauntingiz bormi? → Kirish" 
              : "Akkauntingiz yo'qmi? → Ro'yxatdan o'tish"
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}
