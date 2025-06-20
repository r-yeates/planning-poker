'use client';

import { useState, useEffect } from 'react';

interface Feature {
  title: string;
  description: string;
  icon: string;
  color: string;
}

const features: Feature[] = [  {
    title: "Lightning-Fast Consensus",
    description: "Get your entire team aligned in minutes, not hours - with real-time collaboration that just works",
    icon: "⚡",
    color: "from-blue-500 to-blue-600"
  },  {
    title: "Perfect Scale Every Time",
    description: "Never debate complexity again - choose from proven estimation scales or create your own",
    icon: "📊",
    color: "from-green-500 to-green-600"
  },  {
    title: "Everyone Gets Heard",
    description: "Eliminate dominant voices - spectator mode ensures quiet team members can contribute",
    icon: "👁️",
    color: "from-purple-500 to-purple-600"
  },  {
    title: "Zero Estimation Bias",
    description: "Anonymous voting reveals true opinions without peer pressure or anchoring bias",
    icon: "🎭",
    color: "from-orange-500 to-orange-600"
  },  {
    title: "Save 75% Meeting Time",
    description: "Auto-reveal when everyone votes - no more waiting around or manual management",
    icon: "🚀",
    color: "from-red-500 to-red-600"
  },  {
    title: "Enterprise-Grade Security",
    description: "Password-protected rooms keep your sensitive project discussions private and secure",
    icon: "🔒",
    color: "from-indigo-500 to-indigo-600"
  },  {
    title: "Instant Team Alignment",
    description: "See exactly when your team agrees with color-coded consensus indicators and progress bars",
    icon: "🎯",
    color: "from-cyan-500 to-cyan-600"
  },  {
    title: "Ready in Seconds",
    description: "Pre-built templates for every scenario - sprint planning, bug triage, and story refinement",
    icon: "⚡",
    color: "from-emerald-500 to-emerald-600"
  }
];

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const featuresPerView = 3; // Show 3 features at once
  const maxIndex = Math.max(0, features.length - featuresPerView);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
    }, 5000); // Slower since we show more content

    return () => clearInterval(interval);
  }, [isAutoPlaying, maxIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);  };  return (
    <div className="w-full max-w-none mx-auto px-4 border-t border-b border-gray-200 dark:border-gray-700 py-16">
      {/* Header */}      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Transform Your Team's Estimation Process
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          See why 10,000+ agile teams choose our planning poker tool to deliver better results faster
        </p>
      </div>      {/* Carousel Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Feature Content */}
        <div className="relative h-40 overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{
              transform: `translateX(-${currentIndex * (100 / featuresPerView)}%)`
            }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="w-1/3 flex-shrink-0 h-full"
              >
                <div className={`h-full bg-gradient-to-br ${feature.color} p-4 flex items-center justify-center text-white m-1 rounded-lg`}>
                  <div className="flex items-center gap-4 w-full">
                    <div className="text-4xl flex-shrink-0">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{feature.title}</h3>
                      <p className="text-sm opacity-90 leading-snug">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>{/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          aria-label="Previous features"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          disabled={currentIndex === maxIndex}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          aria-label="Next features"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: maxIndex + 1 }, (_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-blue-600 dark:bg-blue-400 scale-125'
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span>{isAutoPlaying ? 'Auto-playing' : 'Paused'}</span>
        </div>
      </div>
    </div>
  );
}
