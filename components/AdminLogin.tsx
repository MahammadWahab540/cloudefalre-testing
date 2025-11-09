
import React, { useState } from 'react';
import { BotIcon } from './icons';

interface AdminLoginProps {
    onLogin: (password: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(password);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-auto animate-fade-in">
            <div className="flex justify-center mb-6">
                <div className="p-4 bg-purple-600 rounded-full">
                    <BotIcon className="w-10 h-10 text-white" />
                </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-gray-400 mb-8">
                Enter the password to access the admin dashboard.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                    Login
                </button>
                <p className="text-xs text-gray-500">Hint: The password is 'admin'.</p>
            </form>
        </div>
    );
};

export default AdminLogin;
