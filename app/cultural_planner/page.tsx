'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';
import { MoodSelector } from '@/components/cultural-planner/MoodSelector';
import { EventCard } from '@/components/cultural-planner/EventCard';
import { UserPreferences } from '@/components/cultural-planner/UserPreferences';

export default function CulturalPlanner() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [showPreferences, setShowPreferences] = useState(false);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/cultural-planner/chat',
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Cultural Planner</h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Mood Selection and Chat */}
            <div className="lg:col-span-2 space-y-6">
              <MoodSelector
                selectedMood={selectedMood}
                onMoodSelect={setSelectedMood}
              />
              
              <div className="bg-white shadow rounded-lg p-6">
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="flex space-x-4">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask about cultural events..."
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column - User Preferences */}
            <div className="lg:col-span-1">
              <UserPreferences
                isOpen={showPreferences}
                onClose={() => setShowPreferences(false)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 