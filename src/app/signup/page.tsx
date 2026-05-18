'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#131314] font-sans text-[#F8FAFC]">
      {/* Left Side: Branding */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center border-r border-[#1E212B]">
        <div className="text-center space-y-4">
          <img src="/logo-2.png" alt="SuperNova" className="w-24 h-24 mx-auto mb-4" />
          <h2 className="text-4xl font-bold tracking-[0.2em] uppercase ">SuperNova</h2>
          <p className="text-[#94A3B8] tracking-widest uppercase text-sm">Intelligence Platform</p>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2 uppercase tracking-tight">Register</h1>
            <p className="text-[#94A3B8]">Enter your details to create your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-[#444746] rounded-md text-sm text-[#F8FAFC]  focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-all"
                placeholder="Username*"
                required
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3  border border-[#444746] rounded-md text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-all"
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
                className="block w-full pl-10 pr-3 py-3  border border-[#444746] rounded-md text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-all"
                placeholder="Password*"
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3  border border-[#444746] rounded-md text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-all"
                placeholder="Confirm Password*"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-md text-[13px] bg-red-900/20 text-red-400 border border-red-900/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#4A90E2] text-white font-semibold rounded-md hover:bg-[#00D4FF] transition-all duration-300 disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Register Now'}
            </button>
          </form>

          <div className="text-center text-sm text-[#94A3B8]">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline underline-offset-4">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}