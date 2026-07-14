---
inclusion: manual
---

# Sistema de Link Privado de Acesso

Este documento descreve como implementar e usar o sistema de link privado para alunos que fizeram pagamento manual ao professor.

## Como Funciona

1. **Professor cria um link privado** para um curso/aula específica
2. **Link é enviado ao aluno** (WhatsApp, email, etc)
3. **Aluno clica no link** (mesmo sem estar autenticado)
4. **Sistema redireciona para login** se necessário
5. **Após autenticação, acesso é automaticamente concedido**
6. **Aluno é redirecionado ao curso/aula**

## Criar um Link Privado

```typescript
// Em um componente do professor
import { usePrivateAccessLink } from "@/hooks/usePrivateAccessLink";

export function CreateLinkComponent() {
  const { createLink, getShareUrl, loading } = usePrivateAccessLink();

  const handleCreateLink = async () => {
    const link = await createLink(
      courseId,      // ID do curso
      undefined,     // liveId (opcional)
      7 * 24 * 60 * 60 * 1000,  // Expira em 7 dias
      10             // Máximo de 10 usos
    );
    
    if (link) {
      const shareUrl = getShareUrl(link.token);
      console.log("Compartilhar:", shareUrl);
    }
  };

  return (
    <button onClick={handleCreateLink} disabled={loading}>
      Criar Link de Acesso
    </button>
  );
}
```

## Tipos de Dados

### PrivateAccessLink
```typescript
interface PrivateAccessLink {
  id?: string;
  courseId?: string;          // Curso para o qual o link fornece acesso
  liveId?: string;             // Live session (alternativa ao curso)
  token: string;               // Token único, URL-safe
  createdBy: string;           // UID do professor/admin
  createdAt: number;           // Timestamp de criação
  expiresAt?: number;          // Timestamp de expiração (opcional)
  maxUses?: number;            // Número máximo de usos (opcional)
  usedCount: number;           // Quantas vezes já foi usado
  usedBy: string[];            // Array de UIDs que usaram
  status: "active" | "expired" | "revoked";
}
```

## API Routes

### GET `/api/access/private-link/[token]`
Valida e processa um link privado.

**Headers Necessários:**
- `X-User-ID`: UID do usuário autenticado
- `Authorization`: Bearer token do Firebase

**Response Success (200):**
```json
{
  "success": true,
  "courseId": "course-123",
  "liveId": null,
  "redirectTo": "/dashboard/courses/course-123"
}
```

**Response Error:**
```json
{
  "error": "Link inválido ou expirado"
}
```

## Fluxo de Usuário

1. **Usuário clica no link**
   ```
   https://academia.netsulwel.tech/access/abc123def456
   ```

2. **Página de acesso aparece**
   - Se não autenticado → redireciona para login
   - Após login → processa o link
   - Se sucesso → redireciona ao curso/live

3. **Acesso é concedido**
   - `enrolledCourses` ou `enrolledLives` é atualizado
   - `AccessLog` é registado
   - Link counter é incrementado

## Segurança

- **Tokens únicos e aleatórios**: 30 caracteres alfanuméricos
- **Expiração**: Suporte para links que expiram após X horas/dias
- **Limite de uso**: Suporte para limitar quantas vezes um link pode ser usado
- **Revogação**: Professores podem revogar links a qualquer momento
- **Logging**: Todos os acessos são registados em `access_logs`

## Firestore Collections

### `private_access_links`
Armazena todos os links criados.

### `access_logs`
Registra cada uso de um link com:
- `userId`: Quem usou
- `linkToken`: Qual link foi usado
- `courseId`/`liveId`: O que foi desbloqueado
- `grantedAt`: Quando foi concedido
- `accessType`: "course" ou "live"

## Fluxo de Pagamento Manual + Link Privado

**Atual (sem link privado):**
- Aluno paga ao professor offline
- Aluno pede ao professor para adicionar à aula/curso
- Professor entra no admin e atualiza manualmente

**Novo (com link privado):**
- Aluno paga ao professor offline
- Professor cria um link privado para 1 uso
- Professor envia o link ao aluno
- Aluno clica → obtém acesso automaticamente
- Sem entrada manual necessária

## Próximos Passos

1. Adicionar componente "Gerar Link" nas páginas de admin de cursos/lives
2. Adicionar dashboard de "Links Ativos" para gerenciar
3. Notificar professores quando um link é usado
4. Analytics de uso de links
