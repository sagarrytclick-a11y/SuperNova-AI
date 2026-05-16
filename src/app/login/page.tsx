'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#131314] p-4 font-sans">
      <div className="w-full max-w-sm bg-[#1e1f20] rounded-xl shadow-sm border border-[#444746] p-8">
        <div className="flex flex-col items-center mb-6 text-center space-y-1.5">
          <img src="/logo-2.png" alt="SuperNova" className="w-12 h-12 mb-2 rounded-xl" />
          <h1 className="text-2xl font-semibold tracking-tight text-[#e3e3e3]">Welcome back</h1>
          <p className="text-sm text-[#c4c7c5]">Enter your email below to log in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium leading-none text-[#e3e3e3]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-[#444746] bg-[#131314] px-3 py-2 text-sm text-[#e3e3e3] placeholder-[#8e918f] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium leading-none text-[#e3e3e3]">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-[#444746] bg-[#131314] px-3 py-2 text-sm text-[#e3e3e3] placeholder-[#8e918f] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-md text-[13px] bg-red-900/30 text-red-400 border border-red-900/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-[#e3e3e3] text-[#131314] hover:bg-white h-10 px-4 py-2 transition-colors disabled:pointer-events-none disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#131314]"></span>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/signup"
            className="text-sm text-[#c4c7c5] hover:text-[#e3e3e3] underline underline-offset-4 transition-colors"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
