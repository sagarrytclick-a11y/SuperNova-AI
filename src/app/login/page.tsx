'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Assuming you have lucide-react installed for the icons in the image
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#131314] font-sans text-[#F8FAFC]">
      {/* Left Side: Branding (Visible on MD and up) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center border-r border-[#1E212B]">
        <div className="text-center space-y-4">
          <img src="/logo-2.png" alt="SuperNova" className="w-24 h-24 mx-auto mb-4" />
          <h2 className="text-4xl font-bold tracking-[0.2em] uppercase">SuperNova</h2>
          <p className="text-[#94A3B8] tracking-widest uppercase text-sm">Intelligence Platform</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2 uppercase tracking-tight">Login</h1>
            <p className="text-[#94A3B8]">Enter your credentials to login.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-transparent border border-[#1E212B] rounded-md text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-all"
                placeholder="Email Address*"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-transparent border border-[#1E212B] rounded-md text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-all"
                placeholder="Password"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#1E212B] bg-transparent text-[#4A90E2] focus:ring-0" />
                <span className="text-[#94A3B8]">Remember Me</span>
              </label>
            
            </div>

            {error && (
              <div className="p-3 rounded-md text-[13px] bg-red-900/20 text-red-400 border border-red-900/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#4A90E2] text-white font-semibold rounded-md hover:bg-[#00D4FF] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Login'}
            </button>
          </form>

          <div className="text-center text-sm text-[#94A3B8]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white hover:underline underline-offset-4">
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}