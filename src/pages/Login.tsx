import React from "react";
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Scissors } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      
      login(data.token, data.user, data.business);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      const res = await fetch('/api/auth/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed setup');
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Scissors className="text-white w-8 h-8" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          TailorSync
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The ultimate platform for tailoring & laundry businesses
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Quick Demo Credentials */}
            <div className="p-3 bg-surface rounded-xl border border-border space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Quick Login Presets:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@example.com');
                    setPassword('admin123');
                  }}
                  className="flex-1 py-1.5 px-3 bg-white border border-border rounded-lg text-xs font-bold text-primary hover:bg-surface transition-colors"
                >
                  ⚡ Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('samuel@royaltailors.com');
                    setPassword('admin123');
                  }}
                  className="flex-1 py-1.5 px-3 bg-white border border-border rounded-lg text-xs font-bold text-primary hover:bg-surface transition-colors"
                >
                  💼 Business Admin
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
             <button onClick={handleSetup} className="text-sm text-indigo-600 hover:text-indigo-500">
               Initialize Super Admin (First time only)
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
