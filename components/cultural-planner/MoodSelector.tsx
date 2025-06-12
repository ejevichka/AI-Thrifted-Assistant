'use client';

import { useState } from 'react';

interface MoodSelectorProps {
  selectedMood: string;
  onMoodSelect: (mood: string) => void;
}

const moods = [
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'social', label: 'Social', emoji: '👥' },
  { id: 'intellectual', label: 'Intellectual', emoji: '📚' },
  { id: 'romantic', label: 'Romantic', emoji: '❤️' },
];

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">How are you feeling today?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onMoodSelect(mood.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
              selectedMood === mood.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="text-2xl mb-2">{mood.emoji}</span>
            <span className="text-sm font-medium">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
} 