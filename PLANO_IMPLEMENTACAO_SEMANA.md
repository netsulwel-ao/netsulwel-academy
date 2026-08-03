# 📅 PLANO DE IMPLEMENTAÇÃO - SEMANA 1 (Esta Semana)

## 🎯 Objetivo: Transformar projeto de 4.2/10 para 8.5/10

**Tempo Total:** 48 horas (trabalhando 8h/dia = 6 dias)

---

## 📆 SEGUNDA (Hoje)

### ⏰ Horas: 8h (8:00-17:00)

---

#### **TAREFA 1: Análise Completa & Planning (2h)**

**O que fazer:**
- [ ] Ler `ANALISE_QUALIDADE_COMPLETA_2026.md` (criado agora)
- [ ] Criar plano específico para seu projeto
- [ ] Priorizar problemas críticos vs. moderados
- [ ] Preparar ambiente

**Saída Esperada:** Plano detalhado, dependências mapeadas

---

#### **TAREFA 2: Criar Design System - Componentes Base (4h)**

**Criar arquivo:** `src/components/ui/Button.tsx`
```typescript
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-800 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        rounded-lg font-semibold transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? '⏳ Carregando...' : children}
    </button>
  );
}
```

**Criar arquivos similares:**
- `src/components/ui/Input.tsx` (text, email, password)
- `src/components/ui/Card.tsx` (base card)
- `src/components/ui/Badge.tsx` (status)
- `src/components/ui/Alert.tsx` (error, success, warning)

**Tempo:** ~45 minutos por componente = 3 horas

**Saída:** 4-5 componentes reutilizáveis

---

#### **TAREFA 3: Criar Design Tokens (1h)**

**Criar:** `src/styles/tokens.ts`
```typescript
export const tokens = {
  colors: {
    primary: {
      50: '#f8f7ff',
      600: '#a855f7',  // purple
      700: '#9333ea',
    },
    secondary: {
      600: '#16a34a',  // green
      700: '#15803d',
    },
    danger: {
      600: '#dc2626',
      700: '#b91c1c',
    },
    gray: {
      300: '#d1d5db',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
  },
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
  },
};
```

**Saída:** Tokens centralizados, fácil manutenção

---

#### **RESUMO DO DIA:**
- ✅ Análise completa feita
- ✅ 4-5 componentes UI criados
- ✅ Design tokens implementados
- 🎯 Meta: Design System 30% pronto

---

## 📆 TERÇA

### ⏰ Horas: 8h

---

#### **TAREFA 1: Completar Componentes Base (3h)**

**Criar:**
- `src/components/ui/Modal.tsx` (dialog system)
- `src/components/ui/Dropdown.tsx` (menu)
- `src/components/ui/Spinner.tsx` (loading)
- `src/components/ui/Toast.tsx` (notifications)

**Criar um arquivo índice:**
```typescript
// src/components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Badge } from './Badge';
export { Alert } from './Alert';
export { Modal } from './Modal';
export { Dropdown } from './Dropdown';
export { Spinner } from './Spinner';
export { Toast } from './Toast';
```

**Saída:** 8 componentes base completos

---

#### **TAREFA 2: Criar Tailwind Config Centralizado (2h)**

**Atualizar:** `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';
import { tokens } from './src/styles/tokens';

export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      fontSize: tokens.fontSize,
    },
  },
  plugins: [],
} satisfies Config;
```

**Saída:** Tailwind config centralizado

---

#### **TAREFA 3: Refatorar AuthContext - PARTE 1 (3h)**

**Criar:** `src/lib/authService.ts`
```typescript
import { onIdTokenChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Mover lógica de negócio aqui
export async function loadUserProfile(uid: string) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (error) {
    console.error('Failed to load profile:', error);
    throw error;
  }
}

export function subscribeToUserProfile(
  uid: string,
  onUpdate: (data: any) => void
) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    },
    (error) => console.error('Profile subscription error:', error)
  );
}
```

**Dividir AuthContext:**
- `src/contexts/AuthContext.ts` (context only)
- `src/contexts/AuthProvider.tsx` (provider)
- `src/hooks/useAuth.ts` (hook)

**Saída:** Auth logic separada, mais limpo

---

#### **RESUMO DO DIA:**
- ✅ Design system 100% completo
- ✅ Auth logic começou a ser refatorada
- 🎯 Meta: Design System completo, Auth 50% refatorado

---

## 📆 QUARTA

### ⏰ Horas: 8h

---

#### **TAREFA 1: Completar Refactor de Auth (3h)**

**Finalizar:**
- `src/contexts/AuthProvider.tsx` (limpo, sem lógica)
- `src/hooks/useAuth.ts` (hook simples)
- `src/types/auth.ts` (tipos bem definidos)

**Remover:**
- Redirect logic do contexto
- Error silencing
- Type confusion

**Adicionar:**
- Error handling adequado
- Logging estruturado
- Retry logic

**Saída:** AuthContext refatorado, cleanão, testável

---

#### **TAREFA 2: Reorganizar Estrutura de Pastas (3h)**

**Criar estrutura:**
```
src/
├── components/
│   ├── ui/                      ← 8 base components
│   ├── layouts/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── DashboardCard.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   └── index.ts
│   │   └── studio/
│   │       ├── RecordingControls.tsx
│   │       └── index.ts
│   └── [outros componentes específicos]
├── app/
├── hooks/
├── lib/
├── types/
├── styles/                      ← tokens.ts aqui
└── constants/
```

**Mover arquivos:**
- `Header.tsx`, `Footer.tsx` → `components/layouts/`
- `AuthForm.tsx` → `components/features/auth/`
- Dashboard components → `components/features/dashboard/`

**Saída:** Estrutura clara, fácil de navegar

---

#### **TAREFA 3: Setup de Testes (2h)**

**Criar:** `src/__tests__/setup.ts`
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));
```

**Criar:** `src/__tests__/utils/testHelpers.ts`
```typescript
import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthProvider';

export function renderWithAuth(component: React.ReactElement) {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
}
```

**Saída:** Test infrastructure pronta

---

#### **RESUMO DO DIA:**
- ✅ Auth refatorado completo
- ✅ Estrutura reorganizada
- ✅ Testes setup
- 🎯 Meta: Projeto estruturalmente melhorado

---

## 📆 QUINTA

### ⏰ Horas: 8h

---

#### **TAREFA 1: Escrever Testes Críticos (4h)**

**Teste 1:** `src/__tests__/unit/useAuth.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('should handle login', async () => {
    // Test login logic
  });

  it('should handle logout', async () => {
    // Test logout logic
  });
});
```

**Teste 2:** `src/__tests__/unit/Button.test.tsx`
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply correct variant', () => {
    render(<Button variant="primary">Primary</Button>);
    // Assert styling
  });
});
```

**Teste 3:** Form Components (LoginForm, RegisterForm)

**Teste 4:** API Routes (básico)

**Saída:** 15-20 testes unitários, coverage ~40%

---

#### **TAREFA 2: Melhorar Firestore Rules (2h)**

**Atualizar:** `firestore.rules`
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return getRole() == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth.uid == userId && request.resource.data.uid == userId;
      allow update, delete: if request.auth.uid == userId || isAdmin();
    }

    // Courses
    match /courses/{courseId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin() || getRole() == 'teacher';
    }

    // Q&A
    match /lives/{liveId}/qa_questions/{questionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if request.auth.uid == resource.data.askedBy || isAdmin();
    }
  }
}
```

**Saída:** Security rules muito melhoradas

---

#### **TAREFA 3: Adicionar Logging Estruturado (2h)**

**Criar:** `src/lib/logger.ts`
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logger = {
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Aqui você poderia enviar para Sentry
  },
};
```

**Usar em Auth:**
```typescript
try {
  await loadUserProfile(uid);
} catch (error) {
  logger.error('Failed to load user profile', { uid, error });
  throw error;
}
```

**Saída:** Logging estruturado em toda aplicação

---

#### **RESUMO DO DIA:**
- ✅ 15-20 testes escritos
- ✅ Firestore rules muito melhoradas
- ✅ Logging estruturado implementado
- 🎯 Meta: Qualidade & Segurança 70% melhorada

---

## 📆 SEXTA

### ⏰ Horas: 8h

---

#### **TAREFA 1: Refatorar Componentes Principais (4h)**

**Component 1:** Refatorar `Header.tsx`
```typescript
// ANTES: 100 linhas de className espalhadas
// DEPOIS: Usar Button e componentização

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <nav className="flex justify-between items-center">
          <Logo />
          <NavLinks />
          <div className="flex gap-3">
            {user ? (
              <Button onClick={logout} variant="secondary">
                Sair
              </Button>
            ) : (
              <>
                <Button href="/login" variant="ghost">
                  Entrar
                </Button>
                <Button href="/register" variant="primary">
                  Criar conta
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
```

**Component 2:** Refatorar `Footer.tsx` (similar)

**Component 3:** Refatorar `AuthForm.tsx`

**Saída:** Componentes principais refatorados

---

#### **TAREFA 2: Implementar E2E Tests (2h)**

**Criar:** `src/__tests__/e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Entrar")');
  await expect(page).toHaveURL('/dashboard');
});

test('user can register', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[name="email"]', 'new@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Criar conta")');
  await expect(page.locator('text=Bem vindo')).toBeVisible();
});
```

**Saída:** E2E tests configurados

---

#### **TAREFA 3: Documentation & Code Review (2h)**

**Criar:** `README.md`
```markdown
# Netsulwel Academy

## Arquitetura

```
src/
├── components/ui/          ← 8 componentes reutilizáveis
├── components/features/    ← Componentes por feature
├── components/layouts/     ← Header, Footer, etc
├── hooks/                  ← Custom hooks
├── lib/                    ← Services e utilities
├── types/                  ← TypeScript types
└── styles/                 ← Design tokens
```

## Como usar um componente

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="lg">
  Clique em mim
</Button>
```

## Como escrever um teste

```tsx
import { renderWithAuth } from '@/__tests__/utils/testHelpers';

test('component works', () => {
  const { getByText } = renderWithAuth(<MyComponent />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

## Scripts

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run lint` - ESLint
- `npm test` - Vitest
- `npm run test:e2e` - Playwright
```

**Criar:** ADRs (Architecture Decision Records)
```markdown
# ADR-001: Design System com Componentes Reutilizáveis

## Decisão
Implementar 8 componentes base reutilizáveis em `src/components/ui/`

## Justificativa
- Consistência visual
- Facilita manutenção
- Escala melhor

## Consequências
- Todos os novos componentes devem usar base components
- Tailwind config centralizado
```

**Saída:** Documentação clara

---

#### **RESUMO DO DIA:**
- ✅ Componentes principais refatorados
- ✅ E2E tests implementados
- ✅ README e documentação
- 🎯 Meta: Projeto muito melhorado

---

## 📆 SÁBADO

### ⏰ Horas: 4h (meio período)

---

#### **TAREFA 1: Testes Finais & Bug Fixes (2h)**

**Fazer:**
- [ ] Executar `npm test` - garantir todos tests passam
- [ ] Executar `npm run lint` - fix warnings
- [ ] Executar `npm run build` - build de produção
- [ ] Executar `npm run test:e2e` - E2E tests

**Corrigir:**
- Qualquer erro encontrado
- Type safety issues
- Warnings

---

#### **TAREFA 2: Análise de Performance (1h)**

**Executar:**
```bash
npm run test:perf:lighthouse
```

**Documentar:**
- Performance score antes/depois
- Bundle size
- LCP, FID, CLS

---

#### **TAREFA 3: Preparar para Deploy (1h)**

**Checklist:**
- [ ] Environment variables configuradas
- [ ] Firestore rules deployadas
- [ ] Build sem erros
- [ ] Testes passando
- [ ] Documentação atualizada

**Saída:** Pronto para deploy

---

## 📊 RESUMO DA SEMANA

### Arquivos Criados:
```
✅ 8 componentes UI (Button, Input, Card, Badge, Alert, Modal, Dropdown, Spinner)
✅ Design tokens (tokens.ts)
✅ Auth refatorado (3 arquivos)
✅ Logger estruturado (logger.ts)
✅ 20+ testes (coverage 50%+)
✅ README.md
✅ ADRs
```

### Refatoração:
```
✅ AuthContext dividido
✅ Componentes reorganizados
✅ Header & Footer refatorados
✅ Firestore rules melhoradas
✅ Logging adicionado
```

### Resultados Esperados:
| Métrica | Antes | Depois | ↑ |
|---------|-------|--------|---|
| **Score Geral** | 4.2/10 | 7.5/10 | +79% |
| **Componentes Reutilizáveis** | 0 | 8+ | ∞ |
| **Test Coverage** | 0% | 50%+ | ∞ |
| **Code Organization** | 3/10 | 8/10 | +166% |
| **Design Consistency** | 5/10 | 8.5/10 | +70% |
| **Segurança** | 5/10 | 7.5/10 | +50% |

---

## 🎯 PRÓXIMOS PASSOS (SEMANA 2)

Se implementar esse plano 100%, suas próximas prioridades serão:

1. **Storybook** (4h)
   - Documentar todos os componentes UI
   - Exemplos de uso
   - Temas interativos

2. **State Management** (8h)
   - Migrar para Zustand/Jotai
   - Remover prop drilling
   - Melhorar performance

3. **Form Validation** (6h)
   - Implementar Zod
   - Validação real-time
   - Better error messages

4. **Analytics** (4h)
   - Setup de tracking
   - Eventos importantes
   - Dashboard

5. **Mobile Optimization** (6h)
   - Testar em devices reais
   - Touch interactions
   - Performance mobile

---

## 💡 DICAS IMPORTANTES

1. **Commit frequentemente**
   ```bash
   git commit -m "feat: create base UI components"
   git commit -m "refactor: split AuthContext into multiple files"
   git commit -m "test: add unit tests for auth hook"
   ```

2. **Teste enquanto desenvolve**
   ```bash
   npm run dev
   npm run test:watch
   npm run lint
   ```

3. **Não tente fazer tudo de uma vez**
   - Foco em uma tarefa por vez
   - Commit quando terminar uma tarefa
   - Teste antes de passar para próxima

4. **Peça ajuda se travar**
   - Stack Overflow para problemas React
   - Docs oficiais do Next.js
   - GitHub issues

---

## 🏁 CONCLUSÃO

Seguindo esse plano, você terá transformado um projeto "precário" (4.2/10) para um projeto "muito bom" (7.5/10) em **apenas uma semana**.

**As principais melhorias serão:**
- ✅ Design system profissional
- ✅ Autenticação refatorada
- ✅ Código bem organizado
- ✅ Testes implementados
- ✅ Segurança melhorada
- ✅ Logging estruturado

**Tempo total:** 48 horas (6 dias × 8h/dia)

**ROI:** Praticamente infinito — este é o tempo de refactoring mais importante do projeto.

---

**Bora começar! 🚀**

