import React from 'react';
import { Users, Target, Zap } from 'lucide-react';

export default function Haqqimizda() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">Haqq\u0131m\u0131zda</h1>
          <p className="text-xl text-slate-600">Freelancer.az - Azərbaycanda istedadları və fırsatları bir yerdə toplayan ən böyük platforma</p>
        </div>

        <div className="space-y-12">
          {/* Mission */}
          <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <Target className="w-12 h-12 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Missiyamız</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Freelancer.az-ın missiyası Azərbaycanda peşəkar freelancer və müştərilər arasında güvənli, şəffaf və effektiv bir Platform yaratmaqdır. Biz hər bir istedadlı insana kendi bacarıqlarını dünyaya nümayiş etdirmə, ehtiyacı olan insanlarla əlaqə saxlama və birlikte böyük işlərə nail olmaq imkanı verməyə inanırıq.
                </p>
              </div>
            </div>
          </section>

          {/* Vision */}
          <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 sm:p-12 border border-blue-200">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <Zap className="w-12 h-12 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Vizyonumuz</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Biz düşünürük ki, gələcəkdə coğrafi sərhədlər iş üçün maneə olmayacaq. Freelancer.az vasitəsilə Azərbaycan, dünya ilə birlikdə işləyə biləcək, bizim peşəkarlarımız beynəlmisal layihələrdə çalışıb, dünya standartında gəlirlər əldə edə biləcəklər.
                </p>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <Users className="w-12 h-12 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Komandamız</h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                  Freelancer.az komandası Azərbaycandan gələn həndəsi, yazılım mühəndisləri, dizaynerləri və biznes müxtərlərdən ibarətdir. Biz hər gün müştərilərə ən yaxşı xidməti göstərməy üçün çalışıram.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {[
                    { role: 'Founder & CEO', name: 'Elgun Yusifli' },
                    { role: 'CTO', name: 'Technical Lead' },
                    { role: 'Design Lead', name: 'UI/UX Team' },
                    { role: 'Community Manager', name: 'Support Team' }
                  ].map((member, i) => (
                    <div key={i} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                      <div className="font-bold text-slate-900">{member.name}</div>
                      <div className="text-sm text-slate-500">{member.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Əsas Dəyərlərimiz</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Güvən', desc: 'Hər bir işləm təhlükəsiz və etibarlı' },
                { title: 'Şəffaflıq', desc: 'Açıq mübadiləsi, gizli xərclər yoxdur' },
                { title: 'Keyfiyyət', desc: 'Yüksək standartda işlər və xidmətlər' },
                { title: 'İnnovation', desc: 'Müasir texnologiyalar və həlllər' },
                { title: 'Müştəri Mərkəzlilik', desc: 'Sizin ehtiyaclarınız bizim prioritet' },
                { title: 'Böyümə', desc: 'Hər kəs öyrənə və inkişaf edə bilə' }
              ].map((value, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                  <p className="text-slate-600">{value.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
