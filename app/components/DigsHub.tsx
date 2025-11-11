'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Palette, Grid3x3 } from 'lucide-react';
import { DigCategory, DigCategoryCard } from './DigCategoryCard';
import { DigByImageScreen } from './screens/DigByImageScreen';
import { DigByMoodboardScreen } from './screens/DigByMoodboardScreen';
import { CuratedDigsScreen } from './screens/CuratedDigsScreen';
import { useCardFlip } from './hooks/useCardFlip';

const categories: DigCategory[] = [
  {
    id: 'dig-by-moodboard',
    title: 'Dig by Moodboard',
    description: '',
    icon: Palette,
    gradient: '#FFFFFF',
    accentColor: '#000000'
  },
  {
    id: 'dig-by-image',
    title: 'Dig by Image',
    description: '',
    icon: Camera,
    gradient: '#FFFFFF',
    accentColor: '#000000'
  },
  {
    id: 'curated-pieces',
    title: 'Curated Pieces',
    description: '',
    icon: Grid3x3,
    gradient: '#FFFFFF',
    accentColor: '#000000'
  }
];

export const DigsHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<DigCategory | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const { animateExpand, animateCollapse } = useCardFlip();

  const handleCategoryClick = useCallback((category: DigCategory) => {
    if (isAnimating) return;

    const cardElement = cardRefs.current[category.id];
    if (!cardElement) return;

    setIsAnimating(true);

    animateExpand(cardElement, {
      duration: 0.6,
      ease: 'power2.inOut',
      scale: true,
      onComplete: () => {
        setActiveCategory(category);
        setIsAnimating(false);
      }
    });
  }, [animateExpand, isAnimating]);

  const handleBack = useCallback(() => {
    if (isAnimating || !activeCategory) return;

    const cardElement = cardRefs.current[activeCategory.id];
    if (!cardElement) {
      setActiveCategory(null);
      return;
    }

    setIsAnimating(true);

    animateCollapse(cardElement, {
      duration: 0.6,
      ease: 'power2.inOut',
      scale: true,
      onComplete: () => {
        setActiveCategory(null);
        setIsAnimating(false);
      }
    });
  }, [animateCollapse, activeCategory, isAnimating]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCategory) {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCategory, handleBack]);

  return (
    <div ref={containerRef} className="digs-hub-container relative w-full">
      <div
        className={`category-grid-container transition-opacity duration-300 ${
          activeCategory ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              ref={(el) => {
                if (el) cardRefs.current[category.id] = el;
              }}
              className={`dig-card-wrapper ${
                activeCategory?.id === category.id ? 'flip-expanded' : ''
              }`}
            >
              <DigCategoryCard
                category={category}
                onClick={handleCategoryClick}
                isActive={activeCategory?.id === category.id}
              />
            </div>
          ))}
        </div>
      </div>

      {activeCategory && (
        <div className="expanded-screen-container">
          {activeCategory.id === 'dig-by-image' && (
            <DigByImageScreen
              onBack={handleBack}
              gradient={activeCategory.gradient}
              accentColor={activeCategory.accentColor}
            />
          )}
          {activeCategory.id === 'dig-by-moodboard' && (
            <DigByMoodboardScreen
              onBack={handleBack}
              gradient={activeCategory.gradient}
              accentColor={activeCategory.accentColor}
            />
          )}
          {activeCategory.id === 'curated-pieces' && (
            <CuratedDigsScreen
              onBack={handleBack}
              gradient={activeCategory.gradient}
              accentColor={activeCategory.accentColor}
            />
          )}
        </div>
      )}

      {isAnimating && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}
    </div>
  );
};
