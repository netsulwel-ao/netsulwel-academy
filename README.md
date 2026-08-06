# 🎓 Netsulwel Academy

Plataforma de ensino online com cursos, lives, avaliações e comunidade.

**Stack:** Next.js 16 · Firebase · Tailwind CSS · TypeScript · LiveKit

---

## 📋 Índice

- [Início Rápido](#início-rápido)
- [Arquitetura](#arquitetura)
- [Design System](#design-system)
- [Autenticação](#autenticação)
- [Testes](#testes)
- [Deploy](#deploy)
- [Scripts](#scripts)

---

## Início Rápido

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd netsulwel-academy
npm install

# 2. Configurar variáveis de ambiente
cp .env.production.example .env.local
# Preencher as variáveis no .env.local

# 3. Correr em desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Arquitetura

```
src/
├── app/                     ← Next.js App Router (páginas e API routes)
│   ├── (app)/               ← Rotas autenticadas
│   ├── admin/               ← Painel de administração
│   ├── dashboard/           ← Dashboard do utilizador
│   └── api/                 ← API Routes (server-side)
│
├── components/
│   ├── ui/                  ← 10 componentes base reutilizáveis
│   ├── layouts/             ← Header, Footer
│   └── features/            ← Componentes por funcionalidade
│
├── contexts/
│   ├── AuthContext.ts       ← Tipos e definição do contexto
│   ├── AuthProvider.tsx     ← Provider com estado de auth
│   └── index.ts             ← Re-exports
│
├── hooks/
│   └── useAuth.ts           ← 7 hooks de autenticação
│
├── lib/
│   ├── authService.ts       ← Lógica pura de autenticação
│   ├── firebase.ts          ← Firebase client config
│   ├── firebase-admin.ts    ← Firebase Admin SDK
│   └── logger.ts            ← Logging estruturado
│
├── styles/
│   └── tokens.ts            ← Design tokens (cores, espaçamento)
│
└── __tests__/
    ├── unit/                ← Testes unitários (100 testes)
    ├── integration/         ← Testes de integração
    ├── e2e/                 ← Testes end-to-end (Playwright)
    ├── rules/               ← Testes Firestore rules (requer emulator)
    └── utils/               ← Helpers e mocks partilhados
```

### Princípios de Arquitetura

- **Separation of concerns** — lógica, estado e UI em camadas distintas
- **Feature-based** — componentes agrupados por funcionalidade
- **Type-safe** — TypeScript em todo o projeto
- **Pure functions first** — serviços são funções puras testáveis

---

## Design System

Dez componentes base em `src/components/ui/`:

### Button

```tsx
import { Button } from '@/components/ui/Button';

// Variantes
<Button variant="primary">Guardar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost">Ver mais</Button>
<Button variant="danger">Eliminar</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>   // padrão
<Button size="lg">Grande</Button>

// Estados
<Button isLoading>A guardar...</Button>
<Button disabled>Indisponível</Button>
<Button fullWidth>Ocupar largura total</Button>

// Como link Next.js
<Button as="link" href="/dashboard">Dashboard</Button>
```

### Input

```tsx
import { Input } from '@/components/ui/Input';

<Input label="Email" type="email" placeholder="nome@exemplo.com" />
<Input label="Pesquisa" leftIcon={<SearchIcon />} />
<Input label="Password" type="password" rightIcon={<EyeIcon />} />
<Input label="Nome" error="Campo obrigatório" />
<Input label="Bio" helperText="Máximo 200 caracteres" />
```

### Card

```tsx
import { Card } from '@/components/ui/Card';

<Card>Conteúdo simples</Card>
<Card padding="lg" hover>Card com hover</Card>
<Card glass>Efeito glassmorphism</Card>
```

### Outros Componentes

```tsx
import { Badge, Alert, Modal, Spinner, Dropdown } from '@/components/ui';

// Badge
<Badge variant="success">Publicado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Rejeitado</Badge>

// Alert
<Alert type="success" message="Guardado com sucesso!" />
<Alert type="error" message="Ocorreu um erro." />

// Spinner
<Spinner size="lg" color="primary" />

// Modal
<Modal isOpen={open} onClose={() => setOpen(false)} title="Confirmação">
  Conteúdo do modal
</Modal>
```

---

## Autenticação

### Hooks disponíveis

```tsx
import {
  useAuth,
  useIsAuthenticated,
  useHasRole,
  useIsAdmin,
  useIsAdminOrTeacher,
  useUserInfo,
  useLogout,
} from '@/hooks/useAuth';

// Uso completo
function MeuComponente() {
  const { user, role, isAdmin, loading, profileLoaded } = useAuth();

  // Verificar autenticação
  const isAuthenticated = useIsAuthenticated();

  // Verificar roles
  const podeGerir = useHasRole('admin', 'teacher');
  const isAdmin = useIsAdmin();
  const isStaff = useIsAdminOrTeacher();

  // Info do utilizador
  const { displayName, email, photoURL } = useUserInfo();

  // Logout
  const logout = useLogout();
}
```

### Roles

| Role | Descrição | Acesso |
|------|-----------|--------|
| `aluno` | Estudante | Cursos, lives, comunidade |
| `teacher` | Professor | + Criar cursos e lives |
| `admin` | Administrador | Acesso total |
| `institution` | Instituição | Gestão de membros |

### Arquitetura de Auth

```
Firebase Auth
    ↓
subscribeToAuthState()     ← authService.ts (puro)
    ↓
AuthProvider.tsx           ← estado: user, profile, loading
    ↓
AuthContext                ← disponível via hooks
    ↓
useAuth() / useIsAdmin()   ← consumido pelos componentes
```

O redirect de rotas protegidas é feito pelo **middleware** (`middleware.ts`), não pelo provider.

---

## Testes

### Correr todos os testes

```bash
# Testes unitários + integração (100 testes)
npm test

# Com cobertura
npm run test:coverage

# Modo watch (desenvolvimento)
npm run test:watch
```

### Testes Firestore Rules

Requer Firebase Emulator:

```bash
# Terminal 1
firebase emulators:start --only firestore

# Terminal 2
npm run test:rules
```

### Testes E2E (Playwright)

```bash
# Terminal 1 — servidor de desenvolvimento
npm run dev

# Terminal 2 — testes E2E
npm run test:e2e

# Ver relatório
npm run test:e2e:report
```

### Escrever um teste

```tsx
// src/__tests__/unit/components/MeuComponente.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeuComponente } from '@/components/features/MeuComponente';

describe('MeuComponente', () => {
  it('renders correctly', () => {
    render(<MeuComponente title="Olá" />);
    expect(screen.getByText('Olá')).toBeInTheDocument();
  });
});
```

```tsx
// Com contexto de auth
import { renderWithAuth } from '@/__tests__/utils/testHelpers';

describe('ComponenteProtegido', () => {
  it('shows content for admin', () => {
    const { getByText } = renderWithAuth(
      <ComponenteProtegido />,
      { authOverrides: { role: 'admin', isAdmin: true } }
    );
    expect(getByText('Painel Admin')).toBeInTheDocument();
  });
});
```

---

## Deploy

Ver [`DEPLOY.md`](./DEPLOY.md) para guia completo.

### Resumo rápido (Hostinger)

```bash
# 1. Build
npm run build

# 2. Copiar para servidor
scp -r .next/standalone/ user@servidor:/var/www/academia/

# 3. No servidor
cd /var/www/academia
NODE_ENV=production PORT=3000 node server.js
```

---

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção + standalone |
| `npm start` | Iniciar servidor de produção |
| `npm run lint` | ESLint |
| `npm test` | Vitest (100 testes) |
| `npm run test:watch` | Vitest em modo watch |
| `npm run test:coverage` | Cobertura de código |
| `npm run test:rules` | Testes Firestore (requer emulator) |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright com UI |
| `npm run test:perf:lighthouse` | Lighthouse CI |

---

## Variáveis de Ambiente

Ver `.env.production.example` para lista completa.

Variáveis obrigatórias:

```bash
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# LiveKit
NEXT_PUBLIC_LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

---

## Logging

O projeto usa logging estruturado via `src/lib/logger.ts`:

```typescript
import { logger } from '@/lib/logger';

logger.debug('Carregando perfil', { uid });
logger.info('Utilizador autenticado', { uid, role });
logger.warn('Perfil não encontrado', { uid });
logger.error('Falha ao guardar', error, { uid, context: 'save' });
```

Não usar `console.log` diretamente em código de produção.

---

## Segurança

- Firestore rules com validação de dados (email, role, plan)
- Proteção contra escalada de privilégios (utilizador não pode mudar o próprio role)
- Autenticação via Firebase Auth
- API routes protegidas com Firebase Admin SDK
- Cookies de auth geridos no servidor via middleware

---

## Contribuição

1. Criar branch a partir de `main`: `git checkout -b feat/nome-da-feature`
2. Seguir padrões de código existentes
3. Escrever testes para nova funcionalidade
4. Build deve passar: `npm run build`
5. Testes devem passar: `npm test`
6. Abrir pull request com descrição clara

---

**Netsulwel Academy** — v0.1.0
