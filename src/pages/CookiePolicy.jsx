import React from 'react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto py-12">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">Kuki Siyasəti</h1>
          <p className="text-slate-500 text-sm">Son yenilənmə: 2026-ci il, Yanvar</p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Kuki Nədir?</h2>
            <p className="text-slate-600 leading-relaxed">
              Kukidir qısa mətn faylları, veb sayt ziyarət etdikdə brauzerlə saxlanılır. Kukiilər istifadəçinin tercihlərini yadda saxlayır, platformanın daha yaxşı işləməsinə kömək edir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Biz Hansi Kukiilər İstifadə Edirik?</h2>
            <p className="text-slate-600 mb-4">Aşağıdakı kuki tipləri istifadə edirik:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Zəruri Kukiilər:</strong> Hesab giriş, sı güvənlik</li>
              <li><strong>Əməliyyat Kukiilər:</strong> Tercihləri, dil seçimi</li>
              <li><strong>Analitik Kukiilər:</strong> Sayt istifadəsini analiz etmək</li>
              <li><strong>Reklam Kukiilər:</strong> Uyğun reklamlar göstərmək</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Kukiilər Necə İstifadə Olunur?</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Sizi tanımaq və əvvəlki vəziyyətləri xatırlamaq</li>
              <li>Brauzer ayarları saxlamaq</li>
              <li>Sayt performansını yaxşılaştırmaq</li>
              <li>Ziyarətçi davranışını izləmək</li>
              <li>Xidmətləri təştişləndirmə üçün</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Üçüncü Tərəf Kukiilərə</h2>
            <p className="text-slate-600">
              Bəzi reklam və analitika xidmətləri (Google Analytics, Facebook Pixel) öz kukiilərini istifadə edə bilər. Bu şirkətlərin öz siyasətləri var.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Kukiilər Necə Yönetilir?</h2>
            <p className="text-slate-600 mb-4">Brauzerlə kukiilər yönetə bilərsiniz:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Chrome: Ayarlar → Gizlilik → Kuki</li>
              <li>Firefox: Ayarlar → Gizlilik → Kuki</li>
              <li>Safari: Ayarlar → Gizlilik → Kuki</li>
              <li>Edge: Ayarlar → Gizlilik → Kuki</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Kukiilər Silmək</h2>
            <p className="text-slate-600">
              Kukiilər istənilən vaxt silinə bilər. Lakin bu, hesabdan çıxmaq, çoğu tercihlər itirriməsi deməkdir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Xüsusi Kuki Seçimləri</h2>
            <p className="text-slate-600 mb-4">Kuki seçimləri Kontrol Panelinzdə:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>✓ Zəruri Kukiilər (həmişə) - tamamilə qapalı edilə bilməz</li>
              <li>✓ Əməliyyat Kukiilərini (seçimi) - siz qapata bilərsiniz</li>
              <li>✓ Analitik Kukiilərini (seçimi) - siz qapata bilərsiniz</li>
              <li>✓ Reklam Kukiilərini (seçimi) - siz qapata bilərsiniz</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Əlaqə</h2>
            <p className="text-slate-600">
              Kukiilər haqqında suallarınız varsa, ilə <a href="mailto:o1freelanceraz@gmail.com" className="text-blue-600 font-bold hover:underline">əlaqə saxlayın</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
