import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-neutral-200">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to login
        </Link>
        
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Reset Password</h1>
        <p className="text-sm text-neutral-500 mt-2 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Check your email</h3>
              <p className="text-xs text-emerald-700 mt-1">
                We have sent a password reset link to <span className="font-bold">{email}</span>. Please check your console logs since email sending is mocked.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 rounded-xl transition shadow active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
