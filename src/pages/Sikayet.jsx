import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { useSearchParams } from 'react-router-dom';

export default function Sikayet() {
  const [searchParams] = useSearchParams();
  const projectTitle = searchParams.get('project');
  const projectId = searchParams.get('projectId');
  const taskTitle = searchParams.get('task');
  const taskId = searchParams.get('taskId');
  const commentText = searchParams.get('comment');
  const commentType = searchParams.get('commentType');
  const commentId = searchParams.get('commentId');
  const reportedUserId = searchParams.get('userId');
  const reportedUserName = searchParams.get('userName');
  const [formData, setFormData] = useState({
    ad: '',
    email: '',
    tip: commentText ? 'comment' : reportedUserId ? 'user' : '',
    detay: commentText ? `Şərh (${commentType || 'məzmun'}, ID: ${commentId || 'naməlum'}):\n${commentText}\n\n`
      : reportedUserId ? `İstifadəçi: ${reportedUserName || 'naməlum'} (ID: ${reportedUserId})\n\n`
      : projectTitle ? `Layihə: ${projectTitle} (ID: ${projectId || 'naməlum'})\n\n`
      : taskTitle ? `Tapşırıq: ${taskTitle} (ID: ${taskId || 'naməlum'})\n\n`
      : ''
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
        subject: `Şikayət: ${formData.tip}`,
        message: formData.detay,
      });
      setStatus('Şikayətiniz qəbul edildi və araşdırma növbəsinə əlavə olundu.');
      setFormData({ ad: '', email: '', tip: '', detay: '' });
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-3xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-orange-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Şikayət Bildir</h1>
          <p className="text-xl text-slate-600">Problemləri və qanun pozuntularını bizə bildirin</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
          <p className="text-slate-700">
            Əgər saytda qanun pozuntu, zərərçəki məzmun və ya güvənlik problemi müşahidə etsəniz, zəhmət olmasa ətraflı şəkildə yazın. 
            Komandamız bütün şikayətləri araşdırıb müvafiq tədbirlər göstərəcəkdir.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  name="ad"
                  value={formData.ad}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Adınızı daxil edin"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">E-poçt</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Şikayətin Tipi</label>
              <select
                name="tip"
                value={formData.tip}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">Seçin</option>
                <option value="haram">Qanun Pozuntu</option>
                <option value="tosun">Saxtakar/Aldatıcı Profil</option>
                <option value="zareri">Zərərçəki Məzmun</option>
                <option value="sexsi">Şəxsi Məlumat Pozuntu</option>
                <option value="odenis">Ödəniş Problemi</option>
                <option value="comment">Şərh və ya rəy</option>
                <option value="user">İstifadəçi haqqında şikayət</option>
                <option value="sexsi">Digər</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Ətraflı Şəkildə Anlat</label>
              <textarea
                name="detay"
                value={formData.detay}
                onChange={handleChange}
                required
                rows="8"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Nəyin qəliz olduğunu şərh edin. Mümkünsə link, istifadəçi adı və ya tapşırıq nömrəsi əlavə edin..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              Şikayətimi Göndər
            </button>
            {status && <p className="text-sm font-semibold text-slate-600">{status}</p>}
          </form>
        </div>

        <div className="mt-12 bg-blue-50 rounded-3xl p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Məlumat</h2>
          <ul className="space-y-2 text-slate-700">
            <li>✓ Hər bir şikayət ətraflı araşdırılır</li>
            <li>✓ Şikayətçinin kimliyi qorunur</li>
            <li>✓ 7 gün ərzində cavab alacaqsınız</li>
            <li>✓ Əgər qanun pozuntu təsdiqlənərsə, müvafiq tədbirlər görülər</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
