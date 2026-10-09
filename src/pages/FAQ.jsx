import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'Freelancer.az istifadə etmək pulsuz mi?',
      a: 'Qeydiyyat və profil yaratma tamamilə pulsuz. Yalnız bir tapşırıq bitdikdən sonra 10% komissiya tutulur.'
    },
    {
      q: 'Necə qeydiyyat keçə biləm?',
      a: 'Saytın başında "Qeydiyyat" butonuna basın. E-poçtunuzu və şifrənizi daxil edin. Sonra freelancer yada müştəri kimi seçin.'
    },
    {
      q: 'Ödəniş necə işləyir?',
      a: 'Müştəri ödənişi platform hesabına yatırır. İş bitdikdən sonra freelancer ödənişi əldə edir. Bu işləm 100% təhlükəsizdir.'
    },
    {
      q: 'Mesaj göndərə biləm?',
      a: 'Əlbəttə! Hər freelancer/müştəri ilə direkt mesaj yolu ilə əlaqə saxlaya bilərsiniz.'
    },
    {
      q: 'Mən sil edə biləm mi?',
      a: 'Hə, hesabınıza gərişib "Ayarlar" bölməsindən hesabı silə bilərsiniz.'
    },
    {
      q: 'Problemirik olsa necə məlumat verə biləm?',
      a: 'Dəstək bölməsinə yaxlasıb problemi qısa başlıq ilə yazın. Komanda sizə əldə əldə cavab verəcəkdir.'
    },
    {
      q: 'Portföy necə yaratmaq olar?',
      a: 'Kabinetə gərişib "Freelancer Məlumatları" bölməsində "Portföy" butonuna basın. Öz layihələrinizi əlavə edin.'
    },
    {
      q: 'Nə qədər vaxtda ödəniş alacağam?',
      a: 'İş müştəri tərəfindən qəbul edildikdən sonra ödəniş 24 saat ərzində hesabınıza keçir.'
    },
    {
      q: 'Mən tapşırıq keyfiyyətinə razı deyilsəm?',
      a: 'Bu halda "Arbitraj" prosesi başlana bilər. Komanda istisnaları araşdırıb həll verəcəkdir.'
    },
    {
      q: 'Rəy sistemı necə işləyir?',
      a: 'İş bitdikdən sonra hər iki tərəf bir-birinə rəy verə bilə. Rəylər profilə əlavə olunur.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-3xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Tez-Tez Soruşulan Suallar</h1>
          <p className="text-xl text-slate-600">Freelancer.az haqqında ən populyar suallarımızın cavabları</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-2xl bg-white hover:shadow-md transition-all overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-900 text-left">{faq.q}</span>
                <ChevronDown
                  className={`flex-shrink-0 w-5 h-5 text-blue-600 transition-transform ${
                    openIdx === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIdx === i && (
                <div className="px-6 pb-6 pt-0 text-slate-600 border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 sm:p-12 border border-blue-200 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Sualını tapa bilmədin?</h2>
          <p className="text-slate-600 mb-6">Bizə <a href="/elaqe" className="text-blue-600 font-bold hover:underline">Əlaqə</a> bölməsindən yaza bilərsiniz</p>
        </div>
      </main>
    </div>
  );
}
