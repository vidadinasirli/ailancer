import React, { useState } from 'react';
import { LifeBuoy, Mail, MessageCircle, ChevronDown, Send, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';

const FAQ = [
  {
    q: 'Sifariş necə yerləşdirilir?',
    a: '"İş Elanları" bölməsindən uyğun kateqoriyanı seçib tapşırığınızı dərc edə bilərsiniz. Frilanserlər sizə təklif göndərdikcə "Kabinet" bölməsindən cavabları izləyə bilərsiniz.',
  },
  {
    q: 'Ödəniş necə həyata keçirilir?',
    a: 'Ödənişlər tərəflər arasında razılaşdırılan şərtlərlə aparılır. Mübahisə yarandıqda "Arbitraj" bölməsi vasitəsilə platformaya müraciət edə bilərsiniz.',
  },
  {
    q: 'PRO status nə verir?',
    a: 'PRO statuslu istifadəçilərin anketləri axtarışda önə çıxır və "yoxlamadan keçmiş" istifadəçilərə göründüyü halda daha çox etibar qazanır.',
  },
  {
    q: 'Hesabımı necə silə bilərəm?',
    a: 'Kabinet → Ayarlar bölməsindən dəstək komandasına müraciət edərək hesabınızın silinməsini tələb edə bilərsiniz.',
  },
];

export default function Destek() {
  const [openIdx, setOpenIdx] = useState(0);
  const [form, setForm] = useState({ email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.submitSupport({
        name: 'Platforma istifadəçisi',
        ...form,
      });
      setSent(true);
      setForm({ email: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pt-28 pb-24 px-4 md:px-8 relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[150px] pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">Dəstək Mərkəzi</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Sualınız var? Aşağıdan tez-tez verilən suallara baxın və ya birbaşa komandamıza yazın.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* FAQ */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              Tez-tez verilən suallar
            </h2>
            {FAQ.map((item, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-bold text-slate-800">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openIdx === idx ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                <div
                  className="grid transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: openIdx === idx ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-slate-500 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-5">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] p-8 sticky top-28">
              <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Bizə yazın
              </h2>
              <p className="text-slate-500 text-sm mb-6">Adətən 24 saat ərzində cavab veririk.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">E-poçt</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Sizə cavab yaza biləcəyimiz e-poçt"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Mövzu</label>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Sualınızın qısa mövzusu"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Mesaj</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full min-h-[140px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                    placeholder="Probleminizi ətraflı təsvir edin..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Göndər
                </button>
                {sent && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm bg-green-50 px-4 py-3 rounded-xl">
                    <ShieldCheck className="w-4 h-4" /> Mesajınız göndərildi, tezliklə cavablandıracağıq.
                  </div>
                )}
                {error && <p className="text-sm font-semibold text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-500 text-sm">
                <Mail className="w-4 h-4" />
                <span>dəstək@frilans.az</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
