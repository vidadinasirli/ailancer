import React from 'react';
import { CheckCircle, Briefcase, MessageSquare, Award } from 'lucide-react';

export default function NeceIsleyir() {
  const steps = [
    {
      title: 'Qeydiyyat',
      desc: 'Freelancer yada müştəri hesabı yarat',
      icon: <CheckCircle className="w-12 h-12 text-blue-600" />
    },
    {
      title: 'Profil Hazırla',
      desc: 'Portföyü və bacarıqlarını əlavə et',
      icon: <Briefcase className="w-12 h-12 text-cyan-600" />
    },
    {
      title: 'Əlaqə Saxla',
      desc: 'Tapşırıq yaz yada tərəfə göndər',
      icon: <MessageSquare className="w-12 h-12 text-purple-600" />
    },
    {
      title: 'Əməkdaş Ol',
      desc: 'Ödəniş platform üzərindən həyata keçir',
      icon: <Award className="w-12 h-12 text-emerald-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-5xl mx-auto py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Necə İşləyir?</h1>
          <p className="text-xl text-slate-600">Freelancer.az-da işləmə prosesi sadə və aydındır</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, i) => (
            <div key={i} className="group relative">
              <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all h-full">
                <div className="mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="lg:hidden flex justify-center mt-4">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 sm:p-12 border border-blue-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Müştərilər üçün:</h2>
          <ul className="space-y-4 text-slate-700 mb-8">
            {[
              '1. Tapşırıq yaradın və dəqiq əsasları şərh edin',
              '2. Bəlkə bir kaç frilanserdən təkliflər alacaqsınız',
              '3. Profilə baxıb ən uyğun olanı seçin',
              '4. Birlikdə məsuliyyətli ödənişi təhlükəsiz yerinə yetirin',
              '5. İş bitdikdən sonra rəy verin'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-6 mt-10">Frilanserlər üçün:</h2>
          <ul className="space-y-4 text-slate-700">
            {[
              '1. Portföyə layihələrinizi əlavə edin',
              '2. Sizə uyğun tapşırıqlara təklif verin',
              '3. Müştərilə bilavasitə əlaqə qurun',
              '4. Tapşırığı tamamlayıb təslim edin',
              '5. Ödənişi əldə edin və rəy alın'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-cyan-600 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 bg-white rounded-3xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Tez-tez Soruşulan Suallar</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Freelancer.az necə pul qazanır?',
                a: 'Platform işlətmə zaman yüzdə 10 komissiya alırıq. Qalan hissə frilansera keçir.'
              },
              {
                q: 'Ödəniş necə işləyir?',
                a: 'Müştəri ilk ödənişi sistemə yatırır, iş bitdikdən sonra frilansera keçir.'
              },
              {
                q: 'Mən başa düşmüsəm, sifariş verə bilərim?',
                a: 'Əlbəttə! Qeydiyyat etdikdən sonra həmin dəqiqədə tapsırıq yarada bilərsiniz.'
              }
            ].map((item, i) => (
              <div key={i} className="border-b border-slate-200 pb-4 last:border-0">
                <h3 className="font-bold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
