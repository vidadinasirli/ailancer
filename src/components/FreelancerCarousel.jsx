import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function FreelancerCarousel({ freelancers = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const defaultFreelancers = [
    {
      id: 1,
      name: 'Senior UI/UX Dizayner',
      location: 'Bakı, Azərbaycan',
      rating: 4.9,
      icon: '01',
      skills: [85, 60],
      price: 45.00,
      type: 'Saatlıq Məvacib'
    },
    {
      id: 2,
      name: 'Full Stack Developer',
      location: 'Gəncə, Azərbaycan',
      rating: 4.8,
      icon: '02',
      skills: [90, 85],
      price: 50.00,
      type: 'Saatlıq Məvacib'
    },
    {
      id: 3,
      name: 'Digital Marketing Mütəxəssisi',
      location: 'Bakı, Azərbaycan',
      rating: 4.7,
      icon: '03',
      skills: [88, 75],
      price: 35.00,
      type: 'Saatlıq Məvacib'
    },
    {
      id: 4,
      name: 'Mobil App Developer',
      location: 'Sumqayıt, Azərbaycan',
      rating: 4.9,
      icon: '04',
      skills: [92, 88],
      price: 55.00,
      type: 'Saatlıq Məvacib'
    }
  ];

  const items = freelancers.length > 0 ? freelancers : defaultFreelancers;

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlay, items.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index % items.length);
    setIsAutoPlay(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsAutoPlay(false);
  };

  return (
    <div 
      className="relative w-full max-w-md mx-auto"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Carousel Container */}
      <div className="relative h-[600px] perspective-[1000px]">
        {items.map((freelancer, idx) => {
          const distance = Math.min(Math.abs(idx - currentIndex), items.length - Math.abs(idx - currentIndex));
          const isVisible = distance < 2;
          const isActive = idx === currentIndex;

          return (
            <div
              key={freelancer.id}
              className={`absolute w-full h-full transition-all duration-700 ${
                isActive ? 'z-20 opacity-100' : distance === 1 ? 'z-10 opacity-40' : 'z-0 opacity-0'
              }`}
              style={{
                transform: isActive 
                  ? 'translateX(0px) scale(1) rotateY(0deg)' 
                  : idx > currentIndex ? 'translateX(80px) scale(0.85) rotateY(-25deg)' 
                  : 'translateX(-80px) scale(0.85) rotateY(25deg)',
                perspective: '1000px'
              }}
            >
              <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-white/90 to-blue-50/50 border border-white shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] backdrop-blur-2xl p-8 flex flex-col justify-between overflow-hidden">
                {/* Kart Arkaplanı Dekorasyonu */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/30 rounded-full blur-[60px]"></div>

                {/* Üst Kısım */}
                <div className="relative z-10 flex justify-between items-start">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-[2px] shadow-lg shadow-blue-500/30 flex items-center justify-center text-3xl">
                    <span className="text-xl font-black tracking-tight text-white">{freelancer.icon}</span>
                  </div>
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md flex items-center gap-1 border border-white/50">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-slate-800">{freelancer.rating}</span>
                  </div>
                </div>

                {/* Orta Kısım */}
                <div className="relative z-10 mt-12">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{freelancer.name}</h3>
                  <p className="text-slate-500 mb-6">{freelancer.location}</p>

                  <div className="space-y-3">
                    {freelancer.skills.map((skill, i) => (
                      <div key={i} className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] ${
                            i === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-sky-400 to-indigo-400'
                          }`}
                          style={{ width: `${skill}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alt Kısım */}
                <div className="relative z-10 mt-auto pt-8 border-t border-slate-200/50 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{freelancer.type}</p>
                    <p className="text-2xl font-black text-slate-900">{freelancer.price.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼</p>
                  </div>
                  <button className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all shadow-xl hover:shadow-blue-600/50">
                    →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-4 mt-10">
        <button
          onClick={goToPrev}
          className="p-3 rounded-full bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-md hover:shadow-lg"
        >
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>

        {/* Dot Indicators */}
        <div className="flex gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-blue-600 w-6' : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className="p-3 rounded-full bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-md hover:shadow-lg"
        >
          <ChevronRight className="w-6 h-6 text-slate-900" />
        </button>
      </div>

      {/* Info Text */}
      <p className="text-center text-sm text-slate-500 mt-6">
        {currentIndex + 1} / {items.length}
      </p>
    </div>
  );
}
