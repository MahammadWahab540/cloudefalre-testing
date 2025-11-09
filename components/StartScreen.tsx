
import React, { useState } from 'react';
import { BotIcon } from './icons';

interface StartScreenProps {
  onStart: (name: string, number: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name, number);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-auto animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-purple-600 rounded-full">
            <BotIcon className="w-10 h-10 text-white" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">Gemini Voice Agent</h1>
      <p className="text-gray-400 mb-8">
        Enter your details to start a real-time conversation with our AI assistant.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="sr-only">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
            className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label htmlFor="number" className="sr-only">Phone Number (Optional)</label>
          <input
            id="number"
            type="tel"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Phone Number (Optional)"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          Start Conversation
        </button>
      </form>
    </div>
  );
};

export default StartScreen;
