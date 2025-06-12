'use client';

import { useState } from 'react';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Preferences {
  preferredEventTypes: string[];
  preferredLocations: string[];
  priceRange: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
  };
}

const eventTypes = [
  'Art Exhibitions',
  'Music Concerts',
  'Theater Shows',
  'Dance Performances',
  'Film Screenings',
  'Literary Events',
  'Cultural Festivals',
  'Workshops',
];

const locations = [
  'Downtown',
  'Arts District',
  'Museum Quarter',
  'Theater District',
  'University Area',
  'Waterfront',
];

export function UserPreferences({ isOpen, onClose }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    preferredEventTypes: [],
    preferredLocations: [],
    priceRange: 'medium',
    notificationPreferences: {
      email: true,
      push: false,
    },
  });

  const handleEventTypeToggle = (eventType: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredEventTypes: prev.preferredEventTypes.includes(eventType)
        ? prev.preferredEventTypes.filter((type) => type !== eventType)
        : [...prev.preferredEventTypes, eventType],
    }));
  };

  const handleLocationToggle = (location: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(location)
        ? prev.preferredLocations.filter((loc) => loc !== location)
        : [...prev.preferredLocations, location],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Preferences</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Event Types */}
        <div>
          <h3 className="text-lg font-medium mb-3">Preferred Event Types</h3>
          <div className="grid grid-cols-2 gap-2">
            {eventTypes.map((type) => (
              <label
                key={type}
                className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={preferences.preferredEventTypes.includes(type)}
                  onChange={() => handleEventTypeToggle(type)}
                  className="rounded text-blue-500"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <h3 className="text-lg font-medium mb-3">Preferred Locations</h3>
          <div className="grid grid-cols-2 gap-2">
            {locations.map((location) => (
              <label
                key={location}
                className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={preferences.preferredLocations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className="rounded text-blue-500"
                />
                <span>{location}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-lg font-medium mb-3">Price Range</h3>
          <select
            value={preferences.priceRange}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                priceRange: e.target.value,
              }))
            }
            className="w-full p-2 border rounded"
          >
            <option value="low">Budget Friendly</option>
            <option value="medium">Moderate</option>
            <option value="high">Premium</option>
          </select>
        </div>

        {/* Notification Preferences */}
        <div>
          <h3 className="text-lg font-medium mb-3">Notification Preferences</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.notificationPreferences.email}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      email: e.target.checked,
                    },
                  }))
                }
                className="rounded text-blue-500"
              />
              <span>Email Notifications</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.notificationPreferences.push}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      push: e.target.checked,
                    },
                  }))
                }
                className="rounded text-blue-500"
              />
              <span>Push Notifications</span>
            </label>
          </div>
        </div>

        <button
          onClick={() => {
            // Save preferences to backend
            onClose();
          }}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
} 