import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../lib/api.js';

export default function Elaqe() {
  const [formData, setFormData] = useState({
    ad: '',
    email: '',
    telefon: '',
    mesaj: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.submitSupport({
        name: formData.ad,
        email: formData.email,
        subject: 'Əlaqə forması',
        message: `${formData.telefon ? `Telefon: ${formData.telefon}\n` : ''}${formData.mesaj}`,
      });
      setStatus('Mesajınız dəstək komandasına göndərildi.');
      setFormData({ ad: '', email: '', telefon: '', mesaj: '' });
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Əlaqə</h1>
          <p className="text-xl text-slate-600">Bizi hər vaxt əlaqə saxlaya bilərsiniz</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: <Phone className="w-8 h-8 text-blue-600" />,
              title: 'Telefon',
              value: '+994 55 554 61 81',
              desc: 'Həftə içi 10:00 - 18:00'
            },
            {
              icon: <Mail className="w-8 h-8 text-cyan-600" />,
              title: 'E-poçt',
              value: 'o1freelanceraz@gmail.com',
              desc: '24 saat ərzində cavab'
            },
            {
              icon: <MapPin className="w-8 h-8 text-purple-600" />,
              title: 'Məkan',
              value: 'Xəzər Rayon, Buzovna qəsəbəsi',
              desc: 'Baki, Azərbaycan'
            }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 text-center hover:shadow-lg transition-all">
              <div className="flex justify-center mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="font-semibold text-slate-900 mb-1">{item.value}</p>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Mesaj Göndərin</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Adınız</label>
                <input
                  type="text"
                  name="ad"
                  value={formData.ad}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Adınızı daxil edin"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">E-poçtunuz</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Telefon (Seçimi)</label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="+994 55 000 00 00"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Mesaj</label>
              <textarea
                name="mesaj"
                value={formData.mesaj}
                onChange={handleChange}
                required
                rows="6"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                placeholder="Məsələnizi ətraflı şəkildə yazın..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              Mesaj Göndər
            </button>
            {status && <p className="text-sm font-semibold text-slate-600">{status}</p>}
          </form>
        </div>

        <div className="mt-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Tez Cavab Verərik</h2>
          <p className="text-slate-600">
            E-poçt üzərindən qəbul etdiyiniz mesajlara ən qısa müddətdə cavab verəcəyik. Zəhmət olmasa səbirli olun. 
            Dəstək komandamız hər gün saat 10:00-dan 18:00-dək aktiv işləyir.
          </p>
        </div>
      </main>
    </div>
  );
}
