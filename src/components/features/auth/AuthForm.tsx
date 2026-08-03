"use client";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface AuthFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  loading: boolean;
  showPasswordField?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
}

export function AuthForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  showPasswordField = true,
  onSubmit,
  submitLabel = "Entrar",
}: AuthFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="space-y-6"
    >
      <Input
        id="email"
        type="email"
        label="Seu Email"
        placeholder="email@exemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        required
        disabled={loading}
      />

      {showPasswordField && (
        <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Palavra-passe"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={showPassword ? EyeOff : Eye}
            iconPosition="right"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-gray-400 hover:text-gray-300"
          >
            {showPassword ? "Esconder" : "Mostrar"} palavra-passe
          </button>
        </div>
      )}

      <Button type="submit" variant="primary" isLoading={loading} fullWidth>
        {submitLabel}
      </Button>
    </form>
  );
}
