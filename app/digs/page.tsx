import React from 'react';
import { DigsHub } from '../components/DigsHub';
import '../styles/digs-hub.css';

export const metadata = {
  title: 'Explore Digs | AI Thrifted Assistant',
  description: 'Discover unique thrifted fashion pieces through image search, moodboards, and curated collections',
};

export default function DigsPage() {
  return (
    <main className="min-h-screen bg-row-white dark:bg-row-black">
      <DigsHub />
    </main>
  );
}
