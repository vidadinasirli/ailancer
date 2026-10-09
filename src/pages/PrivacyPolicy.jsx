import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto py-12">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">Məxfilik Siyasəti</h1>
          <p className="text-slate-500 text-sm">Son yenilənmə: 2026-ci il, Yanvar</p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Giriş</h2>
            <p className="text-slate-600 leading-relaxed">
              Freelancer.az ("Biz", "Bizim", "Platform") sizin məxfiliyinizə ehəmiyyət veririk. Bu Məxfilik Siyasəti, Freelancer.az-ı istifadə edərkən şəxsi məlumatlarınızın necə toplanan, istifadə olunduğu və qorunduğu haqqında məlumat verir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Toplanan Məlumatlar</h2>
            <p className="text-slate-600 mb-4">Aşağıdakı məlumatları toplayırıq:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Şəxsiyyətinizi Təsdiqləyən Məlumat:</strong> Ad, e-poçt, telefon, şəkil</li>
              <li><strong>Profilə Dair Məlumat:</strong> Bacarıqlar, portföy, təcrübə, qiymətlər</li>
              <li><strong>İşləm Məlumatı:</strong> Tapşırıqlar, müqavilə, ödənişlər, mesajlar</li>
              <li><strong>Təhlil Məlumatı:</strong> IP adresi, brauzer tipi, tərəfə axışı zamanı</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Məlumatların İstifadəsi</h2>
            <p className="text-slate-600 mb-4">Məlumatlarınızı aşağıdakı məqsədlərlə istifadə edirik:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Hesab yaratmaq və idarə etmək</li>
              <li>Xidmətləri təqdim etmək</li>
              <li>Ödənişləri emal etmək</li>
              <li>Müştərilər arasında iletişim qurmaq</li>
              <li>Plagiat və fırıldaqçılığı aşkar etmək</li>
              <li>Tekni dəstəyi təmin etmək</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Məlumatların Paylaşılması</h2>
            <p className="text-slate-600">
              Biz şəxsi məlumatlarınızı üçüncü tərəflərlə paylaşmırıq. Yalnız aşağıdakı halda paylaşa bilərik:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mt-4">
              <li>Qanuni tələb və icra zamanı</li>
              <li>Freelancer və müştəri arasında - ödəniş məlumatları, etiket məlumatları (telefo nöqtəsində)</li>
              <li>Rəsmi tərəfdaş şirkətlərə (ödəniş prosessoru, məlumat anbarı)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Məlumatların Qorunması</h2>
            <p className="text-slate-600">
              Biz şəxsi məlumatlarınızı qorumaq üçün müasır şifrələmə və güvenlik tədbirləri istifadə edirik. Lakin heç bir sistem 100% təhlükəsiz deyil.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Sizin Hüquqlarınız</h2>
            <p className="text-slate-600 mb-4">Aşağıdakı hüquqlara sahibsiniz:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Məlumatlarınıza giriş etmək</li>
              <li>Məlumatlarınızı düzəltmək</li>
              <li>Məlumatlarınızı silmək</li>
              <li>Məlumatların emalının durması ilə bağlı şikayət etmək</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Əlaqə</h2>
            <p className="text-slate-600">
              Məxfilik haqqında suallarınız varsa, ilə <a href="mailto:o1freelanceraz@gmail.com" className="text-blue-600 font-bold hover:underline">əlaqə saxlayın</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
