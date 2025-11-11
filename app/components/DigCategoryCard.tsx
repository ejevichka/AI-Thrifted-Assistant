'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface DigCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  accentColor: string;
}

interface DigCategoryCardProps {
  category: DigCategory;
  onClick: (category: DigCategory) => void;
  isActive?: boolean;
}

export const DigCategoryCard: React.FC<DigCategoryCardProps> = ({
  category,
  onClick,
  isActive = false
}) => {
  const Icon = category.icon;

  return (
    <button
      onClick={() => onClick(category)}
      className={`
        dig-category-card
        relative overflow-hidden rounded-none
        border-2 border-row-black bg-row-white
        transition-all duration-200
        ${isActive ? '' : 'hover:bg-row-gray-50'}
        focus:outline-none focus:ring-2 focus:ring-row-black focus:ring-offset-2
        group w-full h-full min-h-[200px]
      `}
      data-category-id={category.id}
    >
      <div className="relative z-10 p-8 text-left h-full flex flex-col justify-center items-center">
        <div className="mb-4">
          <Icon className="w-12 h-12 text-row-black" strokeWidth={1.5} />
        </div>
        <h3 className="text-h4 font-sans text-row-black tracking-tight text-center">
          {category.title}
        </h3>
      </div>
    </button>
  );
};
