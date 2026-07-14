# Guia de Implementação - Link Privado de Acesso

## Para Desenvolvedores

### 1. Adicionar Botão em Página de Curso (Admin)

**Arquivo:** `src/app/admin/courses/[id]/edit/page.tsx`

```tsx
import { usePrivateAccessLink } from "@/hooks/usePrivateAccessLink";
import { Copy, Loader2 } from "lucide-react";

export function CourseEditPage() {
  const { courseId } = useParams();
  const { createLink, getShareUrl, loading } = usePrivateAccessLink();
  const [shareUrl, setShareUrl] = useState("");

  const handleGenerateLink = async () => {
    const link = await createLink(
      courseId as string,
      undefined,
      7 * 24 * 60 * 60 * 1000,  // Válido por 7 dias
      undefined                  // Sem limite de uso
    );
    
    if (link) {
      setShareUrl(getShareUrl(link.token));
    }
  };

  return (
    <div className="space-y-4">
      {/* Seus campos de edição... */}
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Link Privado de Acesso</h3>
        <p className="text-sm text-gray-400 mb-4">
          Crie um link para alunos que fizeram pagamento manual
        </p>
        
        <button
          onClick={handleGenerateLink}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple hover:bg-purple-light text-white rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              Gerar Link
            </>
          )}
        </button>

        {shareUrl && (
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copiado!");
                }}
                className="p-2 bg-purple hover:bg-purple-light rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Válido por 7 dias. Compartilhe este link com alunos que pagaram offline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Adicionar Botão em Live Session (Admin)

**Arquivo:** `src/app/admin/lives/[id]/studio/layout.tsx`

```tsx
import { usePrivateAccessLink } from "@/hooks/usePrivateAccessLink";

export function LiveStudioLayout() {
  const { liveId } = useParams();
  const { createLink, getShareUrl, loading } = usePrivateAccessLink();
  const [shareUrl, setShareUrl] = useState("");

  const handleCreateAccessLink = async () => {
    // Válido por 2 horas (duração típica de uma live)
    const link = await createLink(
      undefined,
      liveId as string,
      2 * 60 * 60 * 1000,
      50  // Máximo 50 usos
    );
    
    if (link) {
      setShareUrl(getShareUrl(link.token));
    }
  };

  return (
    <div>
      {/* Studio content */}
      
      <button
        onClick={handleCreateAccessLink}
        disabled={loading}
        className="px-3 py-1 bg-green hover:bg-green-light text-white text-sm rounded"
      >
        {loading ? "Gerando..." : "Link de Acesso"}
      </button>
      
      {shareUrl && (
        <div className="fixed bottom-4 right-4 bg-card p-4 rounded-lg border border-gray-700">
          <p className="text-sm font-medium mb-2">Link de Acesso da Live</p>
          <div className="flex gap-2">
            <input type="text" value={shareUrl} readOnly className="text-xs" />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Adicionar Dashboard de Links (Novo)

**Arquivo:** `src/app/dashboard/teacher/access-links/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivateAccessLink } from "@/hooks/usePrivateAccessLink";
import type { PrivateAccessLink } from "@/types/access";

export default function AccessLinksPage() {
  const { fetchMyLinks, revokeLink, getShareUrl, loading } = usePrivateAccessLink();
  const [links, setLinks] = useState<PrivateAccessLink[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchMyLinks();
      setLinks(data);
    };
    load();
  }, []);

  const handleRevoke = async (linkId: string) => {
    if (await revokeLink(linkId)) {
      setLinks(prev => prev.map(l => 
        l.id === linkId ? { ...l, status: "revoked" } : l
      ));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Links de Acesso Privado</h1>
        <p className="text-gray-400">Gerencie links para alunos com pagamento manual</p>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : links.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhum link criado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map(link => (
            <div key={link.id} className="bg-card border border-gray-700 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {link.courseId ? `Curso: ${link.courseId}` : `Live: ${link.liveId}`}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      link.status === "active" ? "bg-green-500/20 text-green" :
                      link.status === "expired" ? "bg-yellow-500/20 text-yellow" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {link.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mt-2">
                    Usos: {link.usedCount}{link.maxUses ? ` / ${link.maxUses}` : " (ilimitado)"}
                  </p>

                  {link.expiresAt && (
                    <p className="text-sm text-gray-400">
                      Expira: {new Date(link.expiresAt).toLocaleString("pt-PT")}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 bg-gray-900 p-2 rounded">
                    <input
                      type="text"
                      value={getShareUrl(link.token)}
                      readOnly
                      className="flex-1 bg-transparent text-xs outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getShareUrl(link.token));
                        toast.success("Copiado!");
                      }}
                      className="text-xs px-2 py-1 bg-purple hover:bg-purple-light rounded"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {link.status === "active" && (
                  <button
                    onClick={() => handleRevoke(link.id!)}
                    className="ml-4 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded"
                  >
                    Revogar
                  </button>
                )}
              </div>

              {link.usedBy.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    Usado por: {link.usedBy.join(", ")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Integrar no Menu de Professor

**Arquivo:** `src/components/dashboard/Sidebar.tsx`

Adicione ao menu de links:
```tsx
{role === "teacher" && (
  <SidebarLink
    href="/dashboard/teacher/access-links"
    icon={<LinkIcon className="w-5 h-5" />}
    label="Links de Acesso"
  />
)}
```

## Para Usuários (Alunos)

### Como Usar um Link de Acesso

1. **Receba o link do professor**
   - Via WhatsApp, email ou na plataforma
   - URL como: `https://academia.netsulwel.tech/access/abc123def456`

2. **Clique no link**
   - Mesmo que não esteja autenticado
   - Sistema automaticamente redireciona para login

3. **Faça login**
   - Use seu email e senha ou Google/GitHub
   - Sistema memoriza seu intent

4. **Obtenha acesso**
   - Link é processado
   - Acesso concedido automaticamente
   - Redirecionado para o curso/live

5. **Pronto!**
   - Acesso permanente concedido
   - Sem necessidade de novos pagamentos

## Segurança e Boas Práticas

### ✅ Faça
- Criar um novo link para cada aluno (ou pequeno grupo)
- Definir limite de uso (ex: 1 uso = 1 aluno)
- Definir expiração (ex: 7 dias = tempo para aluno reivindicar)
- Revogar links que não serão mais usados

### ❌ Não Faça
- Compartilhar o mesmo link em redes públicas
- Deixar links sem limite de uso indefinidamente
- Criar links com validade muito longa (>30 dias)

## Troubleshooting

### Problema: Link expirou
**Solução:** Crie um novo link e reenvie ao aluno

### Problema: Aluno diz que link não funciona
**Verificar:**
1. Se o link está correto (token completo)
2. Se o link não foi revogado
3. Se o máximo de usos não foi atingido
4. Se o link não expirou

### Problema: Acesso não foi concedido
**Verificar:**
1. Se o aluno fez login corretamente
2. Checar `access_logs` na Firestore
3. Verificar se `enrolledCourses` foi atualizado

## API Reference

### Hook: `usePrivateAccessLink()`

```typescript
const {
  createLink,    // (courseId?, liveId?, expiresIn?, maxUses?) => Promise<PrivateAccessLink>
  revokeLink,    // (linkId: string) => Promise<boolean>
  fetchMyLinks,  // (courseId?, liveId?) => Promise<PrivateAccessLink[]>
  getShareUrl,   // (token: string) => string
  loading,       // boolean
} = usePrivateAccessLink();
```

### Endpoint: `GET /api/access/private-link/[token]`

**Headers:**
- `X-User-ID`: UID do usuário
- `Authorization`: Bearer token Firebase

**Response Success:**
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

## Status de Implementação

| Componente | Status | Prioridade |
|-----------|--------|-----------|
| Hook usePrivateAccessLink | ✅ Pronto | - |
| API Endpoint | ✅ Pronto | - |
| Página de acesso | ✅ Pronto | - |
| Botão em cursos (admin) | ⏳ TODO | Alto |
| Botão em lives (admin) | ⏳ TODO | Alto |
| Dashboard de links | ⏳ TODO | Médio |
| Menu sidebar | ⏳ TODO | Médio |
| Notificações | ⏳ TODO | Baixo |
| Analytics | ⏳ TODO | Baixo |

## Próximos Passos

1. Implementar componentes listados como TODO
2. Testar fluxo completo com usuários
3. Adicionar notificações quando links são usados
4. Implementar analytics de uso
5. Documentação para alunos/professores
