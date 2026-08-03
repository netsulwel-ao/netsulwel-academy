# 🚀 Guia de Migração - Design System Auth

## Status: Estrutura Base Criada ✅

Este guia descreve como migrar todas as páginas de autenticação para o novo design system profissional.

---

## 📦 Arquivos Criados

### 1. **Documentação**
- `DESIGN_SYSTEM_PLAN.md` - Especificação completa do design system
- `MIGRATION_GUIDE.md` - Este arquivo

### 2. **CSS Base**
- `src/app/auth-layout.css` - Grid system 12-colunas, componentes base, responsive design

### 3. **Componentes Reutilizáveis**
- `src/components/auth/InputField.tsx` - Campo de input com suporte a ícones e toggle senha
- `src/components/auth/Button.tsx` - Botão com variantes (primary/secondary/social)
- `src/components/auth/AuthCard.tsx` - Card wrapper com título/descrição
- `src/components/auth/Alert.tsx` - Alertas de erro/sucesso/warning/info
- `src/components/auth/HeroSection.tsx` - Seção hero com cards flutuantes
- `src/components/auth/Divider.tsx` - Divisor com texto

### 4. **Página de Exemplo**
- `src/app/login-new/page.tsx` - Login completamente refatorado (REFERÊNCIA)

---

## 🔄 Plano de Migração por Fase

### Fase 1: Validação da Base ✅
- [x] CSS foundation criado e testado
- [x] Componentes base funcionando
- [x] Página de exemplo (login-new) demonstrando padrão
- [ ] **PRÓXIMO:** Validar visualmente em localhost:3000/login-new

### Fase 2: Refatorar Páginas (4 páginas)
```
/login                  → Usar novo layout (CÓPIA de login-new)
/register               → Aplicar novo card + hero
/register/teacher       → Aplicar novo card + hero (cor verde)
/register/institution   → Aplicar novo card + hero (cor cyan)
```

### Fase 3: Páginas Menores
```
/verify-email           → Simplificar, aplicar novo card
```

### Fase 4: Verificação Final
```
- Testar responsividade (320px, 768px, 1440px)
- Light mode completo em todas páginas
- Acessibilidade (contrast, aria labels)
- Performance (lazy load backgrounds)
```

---

## 📋 Checklist de Implementação

### Para cada página (login, register, teacher, institution):

#### Step 1: Atualizar Imports
```typescript
import InputField from "@/components/auth/InputField";
import Button from "@/components/auth/Button";
import AuthCard from "@/components/auth/AuthCard";
import Alert from "@/components/auth/Alert";
import HeroSection from "@/components/auth/HeroSection";
import Divider from "@/components/auth/Divider";
import "@/app/auth-layout.css";
```

#### Step 2: Estrutura HTML/JSX
```typescript
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-950 overflow-hidden" data-theme={theme}>
      {/* Background decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* blurs, gradients, etc */}
      </div>

      {/* Header com theme toggle */}
      <header>{/* ... */}</header>

      {/* Main container com grid */}
      <div className="auth-container relative z-10">
        {/* Left side: AuthCard com form */}
        <AuthCard title="..." description="...">
          {/* form content */}
        </AuthCard>

        {/* Right side: HeroSection */}
        <HeroSection title="..." subtitle="..." />
      </div>
    </main>
  );
}
```

#### Step 3: Substituir Campos de Formulário
```typescript
// OLD:
<div className="space-y-1.5">
  <label>Email</label>
  <div className="relative">
    <input type="email" />
  </div>
</div>

// NEW:
<InputField
  id="email"
  type="email"
  label="Email"
  placeholder="voce@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={Mail}
  disabled={loading}
  required
/>
```

#### Step 4: Substituir Botões
```typescript
// OLD:
<button className="bg-purple py-3.5 text-white">Login</button>

// NEW:
<Button
  type="submit"
  variant="primary"
  loading={loading}
  disabled={loading}
  fullWidth
  iconPosition="right"
  icon={<ArrowRight className="w-4 h-4" />}
>
  Entrar
</Button>
```

#### Step 5: Alertas
```typescript
// OLD:
{error && (
  <div className="flex items-center gap-2 bg-red-500/10 p-4 text-red-400">
    <AlertCircle /> {error}
  </div>
)}

// NEW:
{error && (
  <Alert
    type="error"
    message={error}
    onClose={() => setError("")}
  />
)}
```

---

## 🎨 Guia de Cores por Tipo de Usuário

### Login (Purple)
```css
gradient: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
hero-glow: rgba(124, 58, 237, 0.2);
```

### Register (Purple/Lavanda)
```css
gradient: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
hero-glow: rgba(124, 58, 237, 0.2);
```

### Teacher Register (Green)
```css
gradient: linear-gradient(135deg, #00b37e 0%, #059669 100%);
hero-glow: rgba(0, 179, 126, 0.2);

// Atualizar no HeroSection:
<div className="auth-hero-card-icon" style={{ background: "rgba(0, 179, 126, 0.2)", color: "#00b37e" }}>
```

### Institution Register (Cyan)
```css
gradient: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
hero-glow: rgba(8, 145, 178, 0.2);

// Atualizar no HeroSection:
<div className="auth-hero-card-icon" style={{ background: "rgba(8, 145, 178, 0.2)", color: "#0891b2" }}>
```

---

## 🔧 Personalizações por Página

### `/login` (PRONTO PARA COPIAR)
- Usar `login-new/page.tsx` como referência
- Manter lógica de forgot password
- Manter social login

### `/register`
- **Diferença:** Carrossel de slides no hero
- Cards com exemplos de cursos
- Validar dados pessoais
- Usar cor purple padrão

**Slides para Hero:**
```typescript
const HERO_SLIDES = [
  {
    title: "+500 Cursos",
    subtitle: "Conteúdo actualizado",
    image: "https://images.pexels.com/...",
  },
  // ...
];
```

### `/register/teacher`
- **Cor:** Verde (#00b37e)
- Campos: nome, email, senha, especialidade, bio
- Status "pending" message
- Hero com: "Torne-se professor"

### `/register/institution`
- **Cor:** Cyan (#0891b2)
- Multi-step form (2 passos)
- Step 1: Admin account
- Step 2: Institution details
- Progress bar visual

### `/verify-email`
- Card centrado simples (sem hero)
- Sem grid 12-col, usar layout flexbox
- Botões: "Já verifiquei" + "Reenviar email"

---

## 📱 Testar Responsividade

### Desktop (1440px)
```bash
# Verificar:
- Grid 12-colunas visível
- Login 45%, Hero 55%
- Padding 80px
- Card 460px centered
```

### Tablet (768px)
```bash
# Verificar:
- Grid redimensiona
- Login 40%, Hero 60%
- Padding reduz 40px
- Sem quebras de layout
```

### Mobile (320px)
```bash
# Verificar:
- Hero desaparece (display: none)
- Login 100% width
- Card 100% com max-width
- Padding 24px
- Botões height 48px
```

---

## 🌙 Light Mode por Página

Cada página já suporta light mode via CSS, mas verificar:
1. Textos em claro sobre fundo claro
2. Inputs com backgrounds apropriados
3. Borders visíveis
4. Sombras adaptadas

**Teste:**
```
1. Abrir página no dark mode
2. Clicar botão tema (sol/lua)
3. Verificar legibilidade
4. Verificar ausência de branco puro
```

---

## ✅ Checklist Final de Cada Página

- [ ] Imports corretos
- [ ] CSS auth-layout.css importado
- [ ] Structure segue auth-container
- [ ] AuthCard renderiza corretamente
- [ ] Form fields usam InputField component
- [ ] Botões usam Button component
- [ ] Alertas usam Alert component
- [ ] HeroSection renderiza
- [ ] Theme toggle funciona
- [ ] Dark mode visível e legível
- [ ] Light mode visível e legível
- [ ] Mobile responsivo (320px)
- [ ] Tablet responsivo (768px)
- [ ] Desktop correto (1440px)
- [ ] Sem erros console
- [ ] Animações suaves
- [ ] Acessibilidade OK (ARIA labels, focus states)

---

## 🚀 Próximos Passos

1. **Validar `login-new`** em localhost
2. **Copiar estrutura** para `/login`
3. **Refatorar `/register`** com slides no hero
4. **Refatorar `/register/teacher`** (verde)
5. **Refatorar `/register/institution`** (cyan, multi-step)
6. **Simplificar `/verify-email`**
7. **Testar responsividade** completa
8. **Testar light mode** em todas
9. **Validação de acessibilidade**
10. **Limpeza de código** e documentação

---

## 📞 Suporte Rápido

### Problema: Card muito largo
**Solução:** `max-width: 480px` no CSS já existe, verificar media queries

### Problema: Inputs muito altos
**Solução:** Height 56px está em `auth-layout.css`, não alterar

### Problema: Falta espaço entre elementos
**Solução:** Usar gap múltiplos de 8px (8, 16, 24, 32)

### Problema: Light mode muito claro
**Solução:** Cores light em `auth-layout.css` sob `[data-theme="light"]`

---

## 📊 Métricas de Sucesso

Ao final da migração:
- ✅ Todas 5 páginas auth refatoradas
- ✅ 100% responsivo (3 breakpoints)
- ✅ Dark + Light mode funcionando
- ✅ Zero console errors
- ✅ WCAG AAA accessibility
- ✅ Animações suaves (250-300ms)
- ✅ Performance: LCP < 2s, CLS < 0.1
- ✅ Código reutilizável e limpo

---

## 🎯 Resultado Visual Esperado

Comparação:
```
ANTES (OLD):
❌ Inputs gigantes (1500px width)
❌ Cards colados nas bordas
❌ Espaçamento inconsistente
❌ Tipografia confusa
❌ Layout 50/50 forçado

DEPOIS (NEW):
✅ Inputs proporcionais (460px card)
✅ Padding 80px externo
✅ Espaçamento múltiplos de 8px
✅ Hierarquia clara
✅ Grid 12-col responsivo
✅ Design profissional (Stripe/Linear nível)
```

---

## 📚 Recursos de Referência

- `DESIGN_SYSTEM_PLAN.md` - Especificação técnica completa
- `src/app/auth-layout.css` - Implementação CSS
- `src/app/login-new/page.tsx` - Exemplo working
- Componentes em `src/components/auth/` - Reutilizáveis

Boa sorte com a refatoração! 🎨✨
