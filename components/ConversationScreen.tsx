
import React, { useEffect, useRef } from 'react';
import { useLiveSession, ConnectionState } from '../hooks/useLiveSession';
import { TranscriptionEntry } from '../types';
import { PhoneOffIcon, UserIcon, BotIcon, WaveformIcon } from './icons';
import Spinner from './Spinner';

interface ConversationScreenProps {
  userName: string;
  onEnd: (transcription: TranscriptionEntry[]) => void;
}

const StatusIndicator: React.FC<{ state: ConnectionState, isModelSpeaking: boolean }> = ({ state, isModelSpeaking }) => {
    let text = '';
    let color = '';
    let pulse = false;

    switch (state) {
        case ConnectionState.CONNECTING:
            text = 'Connecting...';
            color = 'bg-yellow-500';
            pulse = true;
            break;
        case ConnectionState.CONNECTED:
            text = isModelSpeaking ? 'AI Speaking...' : 'Listening...';
            color = isModelSpeaking ? 'bg-blue-500' : 'bg-green-500';
            pulse = true;
            break;
        case ConnectionState.ERROR:
            text = 'Error';
            color = 'bg-red-500';
            break;
        case ConnectionState.CLOSED:
            text = 'Conversation Ended';
            color = 'bg-gray-500';
            break;
        default:
            text = 'Idle';
            color = 'bg-gray-500';
    }

    return (
        <div className="flex items-center space-x-2">
            <span className={`relative flex h-3 w-3`}>
                <span className={`${pulse ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
            </span>
            <span className="text-gray-300">{text}</span>
        </div>
    );
};

const TranscriptionLog: React.FC<{ transcription: TranscriptionEntry[], userName: string }> = ({ transcription, userName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  return (
    <div ref={scrollRef} className="flex-grow p-6 space-y-6 overflow-y-auto">
      {transcription.map((entry) => (
        <div key={entry.id} className={`flex items-start gap-4 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
          {entry.speaker === 'model' && (
            <div className="w-10 h-10 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center">
              <BotIcon className="w-6 h-6 text-white" />
            </div>
          )}
          <div className={`max-w-md p-4 rounded-2xl ${entry.speaker === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'} ${!entry.isFinal ? 'opacity-70' : ''}`}>
            <p className="font-bold text-sm mb-1">{entry.speaker === 'user' ? userName : 'Gemini Agent'}</p>
            <p className="text-white">{entry.text}</p>
          </div>
          {entry.speaker === 'user' && (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


const ConversationScreen: React.FC<ConversationScreenProps> = ({ userName, onEnd }) => {
  const { startSession, endSession, connectionState, transcription, error, isModelSpeaking } = useLiveSession();

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleEndCall = () => {
    endSession();
    onEnd(transcription);
  }

  return (
    <div className="h-[calc(100vh-120px)] w-full bg-gray-800 rounded-2xl shadow-2xl flex flex-col animate-fade-in">
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
            <StatusIndicator state={connectionState} isModelSpeaking={isModelSpeaking}/>
            <button 
                onClick={handleEndCall}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
                <PhoneOffIcon className="w-5 h-5"/>
                <span>End Call</span>
            </button>
        </header>

        {error && <div className="p-4 bg-red-500/20 text-red-300 text-center">{error}</div>}

        {connectionState === ConnectionState.CONNECTING && (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                <Spinner/>
                <p className="mt-4">Requesting microphone access...</p>
            </div>
        )}
        
        {(connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CLOSED) && (
            <TranscriptionLog transcription={transcription} userName={userName}/>
        )}

        <footer className="p-6 h-32 flex items-center justify-center bg-gray-900/50 rounded-b-2xl">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isModelSpeaking ? 'bg-blue-600 scale-110' : 'bg-gray-700'}`}>
              <WaveformIcon className={`w-12 h-12 transition-colors duration-300 ${isModelSpeaking ? 'text-white' : 'text-gray-500'}`} />
            </div>
        </footer>

    </div>
  );
};

export default ConversationScreen;
