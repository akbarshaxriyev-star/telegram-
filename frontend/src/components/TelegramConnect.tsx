import { useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';

export default function TelegramConnect({ onClose, onConnected }: { onClose: () => void, onConnected: () => void }) {
  const { token, user, updateUser } = useStore();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(user?.phone || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/telegram/send-code', { phone }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhoneCodeHash(res.data.phoneCodeHash);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/telegram/verify-code', {
        phone,
        phoneCodeHash,
        code,
        password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUser({ isTelegramConnected: true });
      onConnected();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
      <div className="bg-slate-800 p-6 md:p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">Telegramga ulanish</h2>
        
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Telefon raqam</label>
              <input type="text" placeholder="+998901234567" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
            </div>
            <div className="flex flex-col-reverse md:flex-row gap-3 md:justify-end pt-2">
              <button onClick={onClose} className="px-5 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition">Bekor qilish</button>
              <button onClick={sendCode} disabled={loading} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition shadow-lg shadow-blue-500/20">
                {loading ? 'Yuborilmoqda...' : 'Kod yuborish'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Tasdiqlash kodi (Telegramdan keladi)</label>
              <input type="text" placeholder="12345" value={code} onChange={e => setCode(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition tracking-widest text-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">2FA Parol (agar bo'lsa)</label>
              <input type="password" placeholder="Parolingiz" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
            </div>
            <div className="flex flex-col-reverse md:flex-row gap-3 md:justify-end pt-2">
              <button onClick={onClose} className="px-5 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition">Bekor qilish</button>
              <button onClick={verifyCode} disabled={loading} className="px-5 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition shadow-lg shadow-green-500/20">
                {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
