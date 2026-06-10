"use client";

import { Building2 } from "lucide-react";

interface InstitutionFormProps {
  name: string;
  setName: (value: string) => void;
  loading: boolean;
}

export default function InstitutionForm({ name, setName, loading }: InstitutionFormProps) {
  return (
    <div className="space-y-1.5 animate-in slide-in-from-top-4 fade-in duration-300">
      <label className="text-sm font-medium text-gray-300" htmlFor="institution-name">Nome da Instituição</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Building2 className="h-5 w-5 text-gray-500" />
        </div>
        <input
          id="institution-name"
          type="text"
          required
          disabled={loading}
          placeholder="Academia Exemplo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
        />
      </div>
    </div>
  );
}
