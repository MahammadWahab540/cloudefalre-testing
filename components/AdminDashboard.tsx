
import React, { useState } from 'react';
import { Session, TranscriptionEntry } from '../types';
import { UserIcon, BotIcon } from './icons';

interface AdminDashboardProps {
    sessions: Session[];
    onLogout: () => void;
}

const TranscriptionViewer: React.FC<{ transcription: TranscriptionEntry[], userName: string }> = ({ transcription, userName }) => (
    <div className="flex-grow p-6 space-y-6 overflow-y-auto bg-gray-900 rounded-lg mt-4 max-h-96">
        {transcription.map((entry) => (
            <div key={entry.id} className={`flex items-start gap-4 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                {entry.speaker === 'model' && (
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center">
                        <BotIcon className="w-6 h-6 text-white" />
                    </div>
                )}
                <div className={`max-w-md p-4 rounded-2xl ${entry.speaker === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ sessions, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'sessions' | 'knowledge' | 'prompts'>('sessions');
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const renderContent = () => {
        switch (activeTab) {
            case 'sessions':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Session Transcripts</h2>
                        {sessions.length === 0 ? (
                            <p className="text-gray-400">No sessions recorded yet. Complete a conversation in the 'Voice Agent' tab to see it here.</p>
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {sessions.map(session => (
                                    <div key={session.id} className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => setSelectedSession(session)}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-white">User: {session.userName}</p>
                                                <p className="text-sm text-gray-400">Phone: {session.userNumber || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                 <p className="text-sm text-gray-300">{session.endTime.toLocaleDateString()}</p>
                                                 <p className="text-xs text-gray-400">{session.endTime.toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedSession && (
                             <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSession(null)}>
                                 <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                                     <h3 className="text-xl font-bold mb-4">Transcript for {selectedSession.userName}</h3>
                                     <TranscriptionViewer transcription={selectedSession.transcription} userName={selectedSession.userName} />
                                     <button onClick={() => setSelectedSession(null)} className="mt-6 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">Close</button>
                                 </div>
                             </div>
                        )}
                    </div>
                );
            case 'knowledge':
                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-4">Knowledge Base Management</h2>
                        <div className="bg-gray-700 p-6 rounded-lg">
                            <p className="text-gray-400 mb-4">Upload documents to provide the voice agent with specific knowledge. (UI Placeholder)</p>
                            <input type="file" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer"/>
                             <p className="text-xs text-gray-500 mt-4">A backend server is required to handle file uploads and processing.</p>
                        </div>
                    </div>
                );
             case 'prompts':
                 return (
                     <div>
                        <h2 className="text-2xl font-bold mb-4">System Prompt Configuration</h2>
                         <div className="bg-gray-700 p-6 rounded-lg">
                            <p className="text-gray-400 mb-4">Define the persona and instructions for the voice agent. (UI Placeholder)</p>
                             <textarea rows={5} defaultValue="You are a friendly and helpful AI assistant. Keep your responses concise and conversational." className="w-full p-3 bg-gray-800 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                             <button className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">Save Prompt</button>
                              <p className="text-xs text-gray-500 mt-4">A backend server and database are required to save and load prompts for agent sessions.</p>
                         </div>
                    </div>
                );
        }
    };
    
    const TabButton: React.FC<{tab: 'sessions' | 'knowledge' | 'prompts', label: string}> = ({tab, label}) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold border-b-2 transition ${activeTab === tab ? 'border-purple-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full animate-fade-in">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button onClick={onLogout} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Logout</button>
            </header>
            
            <div className="border-b border-gray-700 mb-6">
                <TabButton tab="sessions" label="Sessions" />
                <TabButton tab="knowledge" label="Knowledge Base" />
                <TabButton tab="prompts" label="Prompts" />
            </div>

            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;
