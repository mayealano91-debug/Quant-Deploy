import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-full max-w-sm border border-border bg-card p-8 rounded font-mono">
        <div className="mb-6 text-center">
          <span className="text-primary text-xl font-bold tracking-widest">FINxQUANT</span>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase">Create Account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              placeholder="user@domain.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded text-xs font-medium tracking-wider uppercase hover:bg-primary/90 transition-colors"
          >
            Register
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-[10px] text-muted-foreground hover:text-primary">Already have an account?</Link>
        </div>
      </div>
    </div>
  );
}
