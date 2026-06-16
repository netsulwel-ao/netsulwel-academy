"use client";

import { User, MapPin, Phone, Globe, Calendar, Building2, Eye, EyeOff } from "lucide-react";

interface RegisterFormProps {
  name: string;
  setName: (value: string) => void;
  morada: string;
  setMorada: (value: string) => void;
  provincia: string;
  setProvincia: (value: string) => void;
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
  isTeacher: boolean;
  setIsTeacher: (value: boolean) => void;
  teacherBio: string;
  setTeacherBio: (value: string) => void;
  teacherSpecialty: string;
  setTeacherSpecialty: (value: string) => void;
}

const inputClass = "w-full border border-gray-700 bg-gray-950/50 py-2.5 pl-9 pr-3 text-white placeholder-gray-600 text-sm transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-300" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function IconInput({ id, type, value, onChange, placeholder, icon: Icon, disabled, required }: {
  id: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; icon: React.ComponentType<{ className?: string }>; disabled: boolean; required?: boolean;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <input id={id} type={type} required={required} disabled={disabled} placeholder={placeholder}
        value={value} onChange={onChange} className={inputClass} />
    </div>
  );
}

export default function RegisterForm({
  name, setName,
  morada, setMorada,
  provincia, setProvincia,
  idade, setIdade,
  genero, setGenero,
  nacionalidade, setNacionalidade,
  telefone, setTelefone,
  pais, setPais,
  password, confirmPassword,
  showPassword, showConfirmPassword,
  setShowPassword, setShowConfirmPassword,
  setPassword, setConfirmPassword,
  loading,
  isTeacher, setIsTeacher,
  teacherBio, setTeacherBio,
  teacherSpecialty, setTeacherSpecialty,
}: RegisterFormProps) {
  return (
    <div className="space-y-3">
      <Field label="Nome completo" id="name">
        <IconInput id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="João Silva" icon={User} disabled={loading} required />
      </Field>

      <label className="flex items-center gap-3 cursor-pointer group py-2">
        <div className="relative flex items-center">
          <input type="checkbox" checked={isTeacher} onChange={(e) => setIsTeacher(e.target.checked)}
            disabled={loading}
            className="peer h-5 w-5 shrink-0 border-2 border-gray-600 bg-gray-900 text-green focus:ring-green focus:ring-offset-gray-900 disabled:opacity-50 transition-colors cursor-pointer" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white group-hover:text-green transition-colors">Quero ser professor</span>
          <span className="text-xs text-gray-500">Criar conta de professor para publicar cursos e dar aulas ao vivo</span>
        </div>
      </label>

      {isTeacher && (
        <div className="space-y-3 pl-8 border-l-2 border-green/30 py-2">
          <Field label="Especialidade" id="reg-specialty">
            <IconInput id="reg-specialty" type="text" value={teacherSpecialty}
              onChange={(e) => setTeacherSpecialty(e.target.value)}
              placeholder="Ex: Programação Web, Finanças" icon={Building2} disabled={loading} required />
          </Field>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300" htmlFor="reg-bio">Biografia curta</label>
            <textarea id="reg-bio" rows={3} disabled={loading} placeholder="Conte um pouco sobre a sua experiência..."
              value={teacherBio} onChange={(e) => setTeacherBio(e.target.value)}
              className="w-full border border-gray-700 bg-gray-950/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm transition-colors focus:border-green focus:outline-none focus:ring-1 focus:ring-green disabled:opacity-50 resize-none" />
          </div>
        </div>
      )}

      <Field label="Morada" id="reg-morada">
        <IconInput id="reg-morada" type="text" value={morada} onChange={(e) => setMorada(e.target.value)}
          placeholder="Rua Exemplo, 123" icon={MapPin} disabled={loading} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Província" id="reg-provincia">
          <IconInput id="reg-provincia" type="text" value={provincia} onChange={(e) => setProvincia(e.target.value)}
            placeholder="Luanda" icon={Building2} disabled={loading} required />
        </Field>
        <Field label="Idade" id="reg-idade">
          <IconInput id="reg-idade" type="number" value={idade} onChange={(e) => setIdade(e.target.value)}
            placeholder="25" icon={Calendar} disabled={loading} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Género" id="reg-genero">
          <select id="reg-genero" required disabled={loading} value={genero} onChange={(e) => setGenero(e.target.value)}
            className="w-full border border-gray-700 bg-gray-950/50 py-2.5 px-2.5 text-white text-sm transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50">
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </Field>
        <Field label="Nacionalidade" id="reg-nacionalidade">
          <IconInput id="reg-nacionalidade" type="text" value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)}
            placeholder="Angolana" icon={Globe} disabled={loading} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="País" id="reg-pais">
          <IconInput id="reg-pais" type="text" value={pais} onChange={(e) => setPais(e.target.value)}
            placeholder="Angola" icon={Globe} disabled={loading} required />
        </Field>
        <Field label="Telefone" id="reg-telefone">
          <IconInput id="reg-telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)}
            placeholder="+244 900 000 000" icon={Phone} disabled={loading} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Field label="Palavra-passe" id="reg-password">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <input id="reg-password" type={showPassword ? "text" : "password"} required disabled={loading}
              placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-8`} />
            <button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirmar" id="reg-confirmPassword">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <input id="reg-confirmPassword" type={showConfirmPassword ? "text" : "password"} required disabled={loading}
              placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClass} pr-8`} />
            <button type="button" disabled={loading} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50">
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </div>
    </div>
  );
}
