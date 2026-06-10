"use client";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface AuthFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  loading: boolean;
  showPasswordField?: boolean;
}

export default function AuthForm({
  email, setEmail,
  password, setPassword,
  showPassword, setShowPassword,
  loading,
  showPasswordField = true
}: AuthFormProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300" htmlFor="email">Seu Email</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Mail className="h-5 w-5 text-gray-500" />
          </div>
          <input
            id="email"
            type="email"
            required
            disabled={loading}
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
          />
        </div>
      </div>

      {showPasswordField && (
        <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <label className="text-sm font-medium text-gray-300" htmlFor="password">Palavra-passe</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
