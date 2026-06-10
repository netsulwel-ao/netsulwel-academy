"use client";

import { User, MapPin, Phone, Globe, Calendar, Eye, EyeOff } from "lucide-react";

interface RegisterFormProps {
  name: string;
  setName: (value: string) => void;
  morada: string;
  setMorada: (value: string) => void;
  idade: string;
  setIdade: (value: string) => void;
  genero: string;
  setGenero: (value: string) => void;
  nacionalidade: string;
  setNacionalidade: (value: string) => void;
  telefone: string;
  setTelefone: (value: string) => void;
  pais: string;
  setPais: (value: string) => void;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
}

export default function RegisterForm({
  name, setName,
  morada, setMorada,
  idade, setIdade,
  genero, setGenero,
  nacionalidade, setNacionalidade,
  telefone, setTelefone,
  pais, setPais,
  password, confirmPassword,
  showPassword, showConfirmPassword,
  setShowPassword, setShowConfirmPassword,
  setPassword, setConfirmPassword,
  loading
}: RegisterFormProps) {
  return (
    <>
      <div className="space-y-1.5 animate-in slide-in-from-top-4 fade-in duration-300">
        <label className="text-sm font-medium text-gray-300" htmlFor="name">Nome completo</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <User className="h-5 w-5 text-gray-500" />
          </div>
          <input
            id="name"
            type="text"
            required
            disabled={loading}
            placeholder="João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
          />
        </div>
      </div>

      <div className="border-t border-gray-800 pt-5 mt-5 animate-in slide-in-from-top-4 fade-in duration-300">
        <p className="text-sm font-medium text-gray-400 mb-4">Dados pessoais</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="reg-morada">Morada</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MapPin className="h-5 w-5 text-gray-500" />
            </div>
            <input id="reg-morada" type="text" required disabled={loading} placeholder="Rua Exemplo, 123"
              value={morada} onChange={(e) => setMorada(e.target.value)}
              className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="reg-idade">Idade</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-5 w-5 text-gray-500" />
            </div>
            <input id="reg-idade" type="number" required disabled={loading} placeholder="25"
              value={idade} onChange={(e) => setIdade(e.target.value)}
              className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="reg-genero">Género</label>
          <select
            id="reg-genero"
            required
            disabled={loading}
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className="block w-full border border-gray-700 bg-gray-950/50 py-3 px-3 text-white transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
          >
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="reg-nacionalidade">Nacionalidade</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Globe className="h-5 w-5 text-gray-500" />
            </div>
            <input id="reg-nacionalidade" type="text" required disabled={loading} placeholder="Angolana"
              value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)}
              className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="reg-pais">País</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Globe className="h-5 w-5 text-gray-500" />
            </div>
            <input id="reg-pais" type="text" required disabled={loading} placeholder="Angola"
              value={pais} onChange={(e) => setPais(e.target.value)}
              className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
          </div>
        </div>

        <div className="space-y-1.5 mt-4">
          <label className="text-sm font-medium text-gray-300" htmlFor="reg-telefone">Número de telefone</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Phone className="h-5 w-5 text-gray-500" />
            </div>
            <input id="reg-telefone" type="tel" required disabled={loading} placeholder="+244 900 000 000"
              value={telefone} onChange={(e) => setTelefone(e.target.value)}
              className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 animate-in slide-in-from-top-4 fade-in duration-300">
        <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
        <label className="text-sm font-medium text-gray-300" htmlFor="reg-confirmPassword">Confirmar palavra-passe</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <User className="h-5 w-5 text-gray-500" />
          </div>
          <input id="reg-confirmPassword" type={showConfirmPassword ? "text" : "password"} required disabled={loading}
            placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
          <button type="button" disabled={loading} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50">
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </>
  );
}
