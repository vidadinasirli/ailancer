import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto py-12">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">İstifadə Şərtləri</h1>
          <p className="text-slate-500 text-sm">Son yenilənmə: 2026-ci il, Yanvar</p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Qəbul</h2>
            <p className="text-slate-600 leading-relaxed">
              Bu İstifadə Şərtləri ("Şərtlər") Freelancer.az ("Platform") istifadə ədədikdə tətbiq olunur. Platforma daxil olmaqla, siz bu şərtləri qəbul edirsiz. Əgər razı deyilsinizsə, platformadan istifadə etməyin.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Hesab Tanıdlığı</h2>
            <p className="text-slate-600 mb-4">Qeydiyyat edərkən:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Dəqiq məlumat təmin edin</li>
              <li>Oğlu 18 yaşı keçmiş olmalısınız</li>
              <li>Hesabın güvənliyi sizin məsulliyyətinizvdir</li>
              <li>Qanuni maksadlar üçün platformadan istifadə edin</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Qadağan Fəaliyyətlər</h2>
            <p className="text-slate-600 mb-4">Aşağıdakıları etməyin:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Digər istifadəçiləri aldatmaq və ya fırıldaqçılıq etmək</li>
              <li>Digər istifadəçilərin məlumatlarını saxlamaq</li>
              <li>Pornoqrafik, zərərçəki və ya haram məzmun paylaşmaq</li>
              <li>Platform buqu hücum etmək</li>
              <li>Başqa istifadəçilərin hesablarına girmək</li>
              <li>Təkrarən platformadan cezalandırıldıqdan sonra daxil olmaq</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Müəllif Hüquqları</h2>
            <p className="text-slate-600">
              Platformadaki bütün məzmun (dizayn, mətn, şəkillər, kodu) Freelancer.az-ın müəlliflik hüquqlu mülkiyyətidir. Xüsusi icazə olmadan yenidən istehsal, dəyişdirmə və ya paylaya bilməzsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Portföy və Məzmun</h2>
            <p className="text-slate-600 mb-4">Portföyə əlavə etdiyiniz işlər üçün:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Siz müəlliflik hüquqlara maliksiniz yada icazə almışsınız</li>
              <li>Platform sizin icazəniz olmadan istifadə edə biləcəkdir (promosyon üçün)</li>
              <li>Digər istifadəçilərin saxtakar portföyü əlavə etməsi cəzalandırılacaq</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Ödənişlər</h2>
            <p className="text-slate-600 mb-4">Ödəniş haqqında:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Platform 10% komissiya saxlayır</li>
              <li>İş bitdikdən sonra ödəniş freelancer/müştəriyə keçir</li>
              <li>Geri qaytarma yalnız fırıldaqçılıq halında əngəllənir</li>
              <li>Ödəniş tərəfindən cəbən edilə bilər (dava)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Cezalar</h2>
            <p className="text-slate-600">
              Şərtlərə riayət etməzsənizsə, platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mt-4">
              <li>Əsas etməyi ləğv edə bilər</li>
              <li>Hesabınızı silə bilər</li>
              <li>Ödəniş tutula bilər</li>
              <li>Qanuni tədbirlər göstərə bilər</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Məsulliyyət Məhdudiyyəti</h2>
            <p className="text-slate-600">
              Platform istifadəçilər arasında fərq gətirə bilməz. Platformadan istifadə etmədən:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mt-4">
              <li>Başqa istifadəçilərin hərəkətləri üçün məsul deyil</li>
              <li>Zərəri və ya itkilər üçün məsul deyil</li>
              <li>Platform səhvləridir mütəmadi təhlükəsizlik garantisi verməmir</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Şərtlərin Dəyişdirilməsi</h2>
            <p className="text-slate-600">
              Platform bu şərtləri istənilən vaxt dəyişdirə bilər. Dəyişdirilmə 7 gün öncə sizə bildiriləcəkdir. Dəyişdirdən sonra platformadan istifadə etmək deməkdir ki, siz yeni şərtləri qəbul etdiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Əlaqə</h2>
            <p className="text-slate-600">
              Suallarınız varsa, <a href="mailto:o1freelanceraz@gmail.com" className="text-blue-600 font-bold hover:underline">əlaqə saxlayın</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
