
import React, { useState, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import ConversationScreen from './components/ConversationScreen';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { Session, TranscriptionEntry } from './types';
import { BotIcon } from './components/icons';

type Screen = 'start' | 'conversation';
type View = 'agent' | 'admin';

const App: React.FC = () => {
  // Main view state
  const [view, setView] = useState<View>('agent');
  
  // Agent flow state
  const [agentScreen, setAgentScreen] = useState<Screen>('start');
  const [sessionInfo, setSessionInfo] = useState({ name: '', number: '' });

  // Admin flow state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const handleStartConversation = useCallback((name: string, number: string) => {
    setSessionInfo({ name, number });
    setAgentScreen('conversation');
  }, []);
  
  // This function will be called when a conversation ends
  const handleEndConversation = useCallback((transcription: TranscriptionEntry[]) => {
    const newSession: Session = {
        id: `session-${Date.now()}`,
        userName: sessionInfo.name,
        userNumber: sessionInfo.number,
        startTime: new Date(Date.now() - 5 * 60 * 1000), // Mock start time
        endTime: new Date(),
        transcription,
    };
    if (transcription.length > 0) {
        setSessions(prevSessions => [newSession, ...prevSessions]);
    }
    setAgentScreen('start');
  }, [sessionInfo]);

  // Admin login handler
  const handleAdminLogin = useCallback((password: string) => {
    // In a real app, this would be a secure API call.
    if (password === 'admin') {
      setIsAdminLoggedIn(true);
    } else {
      alert('Incorrect password');
    }
  }, []);
  
  const handleAdminLogout = useCallback(() => {
      setIsAdminLoggedIn(false);
  }, []);

  const renderAgentView = () => {
    switch (agentScreen) {
      case 'start':
        return <StartScreen onStart={handleStartConversation} />;
      case 'conversation':
        return (
          <ConversationScreen
            userName={sessionInfo.name}
            onEnd={handleEndConversation}
          />
        );
      default:
        return <StartScreen onStart={handleStartConversation} />;
    }
  };
  
  const renderAdminView = () => {
      if (isAdminLoggedIn) {
          return <AdminDashboard sessions={sessions} onLogout={handleAdminLogout} />;
      }
      return <AdminLogin onLogin={handleAdminLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center font-sans p-4">
        <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-10 flex justify-between items-center p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
                <BotIcon className="w-8 h-8 text-purple-400" />
                <h1 className="text-xl font-bold text-gray-300">Gemini Voice Agent</h1>
            </div>
            <nav>
                <button 
                    onClick={() => setView('agent')} 
                    className={`px-4 py-2 rounded-l-lg transition ${view === 'agent' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Voice Agent
                </button>
                <button 
                    onClick={() => setView('admin')} 
                    className={`px-4 py-2 rounded-r-lg transition ${view === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Admin Panel
                </button>
            </nav>
        </header>
      
      <main className="w-full max-w-4xl mx-auto mt-20 flex-grow flex items-center justify-center">
        {view === 'agent' ? renderAgentView() : renderAdminView()}
      </main>
    </div>
  );
};

export default App;
