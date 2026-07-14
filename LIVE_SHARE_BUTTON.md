# 🔗 Botão "Partilhar" Durante Aula Ao Vivo

## 📍 Onde Fica?

**NO TOP BAR DO STUDIO** (onde está "AO VIVO" e o timer):

```
┌──────────────────────────────────────────────────────┐
│ 🔴 Aula de React Avançado   [00:15:30]   [Partilhar] │ ← BOTÃO AQUI
├──────────────────────────────────────────────────────┤
│                                                      │
│            VÍDEO DA AULA AO VIVO                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Como Usar (Passo a Passo)

### Durante a Aula:

```
1. Clica em "Partilhar" 
   ↓
2. Sistema gera um link privado (automaticamente)
   ↓
3. Um menu aparece com:
   - URL do link
   - Botão [Copiar]
   - Botão [Enviar]
   ↓
4. Clica "Copiar"
   ↓
5. Cola no WhatsApp/Email do aluno
```

---

## 📱 Visual do Menu

Quando clicas em "Partilhar":

```
┌─────────────────────────────────────┐
│ https://...access/abc123xyz456789  [📋]
│                                     │
│ [Copiar] [Enviar]                   │
│                                     │
│ Link válido por 24h                 │
│ Ilimitado de usos                   │
└─────────────────────────────────────┘
```

---

## ⚙️ Configuração Automática

O link é criado com estas configurações (automáticas):

| Setting | Valor | Porquê |
|---------|-------|--------|
| Validade | 24 horas | Tempo da aula + buffer |
| Máximo de usos | Ilimitado | Qualquer aluno pode entrar |
| Status | Active | Pronto para usar |

---

## 🎬 Exemplo Real

```
DURANTE A AULA:
Professor está a dar aula ao vivo
Aluno chega atrasado e manda mensagem:
"Professor, já paguei mas preciso do link!"

PROFESSOR:
1. Clica em "Partilhar" (no top bar)
2. Clica "Copiar"
3. Copia e cola no WhatsApp:
   "Clica aqui: https://academia.../access/abc123"

ALUNO:
1. Recebe link
2. Clica
3. Se não autenticado → Login
4. Após login → ✓ Entra na aula automaticamente!
```

---

## 🔄 O que Acontece Quando Aluno Clica

```
Aluno clica no link
    ↓
Sistema valida o link
    ↓
Se não autenticado:
    → Redireciona para Login
    → Após fazer login, processa link
    ↓
Se autenticado:
    → Adiciona a enrolledLives
    → Registra em access_logs
    ↓
Redireciona à aula
    ↓
✓ ACESSO CONCEDIDO!
```

---

## ✅ Benefícios

✅ **Rápido** - Gera link em 1 segundo  
✅ **Fácil** - 1 clique para copiar  
✅ **Seguro** - Token único, expira em 24h  
✅ **Flexível** - Ilimitado de usos  
✅ **Automático** - Sem entrada manual  

---

## 🛑 Limitações

❌ Link válido apenas durante 24h (depois expira)  
❌ Alunos precisam fazer login após clicar  
❌ Apenas funciona durante a aula (não antes)  

---

## 💡 Dicas

**Dica 1:** Partilha o link quando a aula começa  
**Dica 2:** Se aluno perder o link, gera novo  
**Dica 3:** Podes partilhar no Discord/Grupo também  
**Dica 4:** Link funciona no telemóvel também  

---

## 🆘 Troubleshooting

### "Botão não aparece"
- ✓ Verificar se estás a dar uma aula ao vivo
- ✓ Verificar se és professor/admin
- ✓ Recarregar página (F5)

### "Erro ao gerar link"
- ✓ Verificar Firebase connection
- ✓ Verificar console (F12)

### "Link não funciona"
- ✓ Verificar se ainda está dentro de 24h
- ✓ Verificar se aluno está autenticado

---

## 🎓 Comparação: Antes vs Depois

### ❌ ANTES (Manual)
```
1. Professor escreve ao aluno
2. Aluno pede para entrar
3. Professor entra no Admin
4. Professor atualiza manualmente
5. Aluno recarrega página
⏱️ TEMPO: 5+ minutos
```

### ✅ DEPOIS (Link Automático)
```
1. Professor clica "Partilhar"
2. Professor copia link
3. Professor envia ao aluno
4. Aluno clica no link
5. Aluno entra automaticamente
⏱️ TEMPO: 30 segundos
```

**Ganho: 85% mais rápido!** 🚀

---

## 📊 Casos de Uso

### Caso 1: Aluno Atrasado Que Pagou
```
"Professor, paguei mas cheguei atrasado!"
→ Professor clica "Partilhar"
→ Copia link
→ Envia ao aluno
→ Aluno entra automaticamente
✓ RESOLVIDO em 30 segundos
```

### Caso 2: Múltiplos Alunos Pagaram
```
"Recebemos pagamento de 5 alunos"
→ Professor clica "Partilhar" UMA VEZ
→ Copia link
→ Envia para grupo de WhatsApp
→ Todos os 5 clicam
→ Todos entram automaticamente
✓ RESOLVIDO em 1 minuto
```

### Caso 3: Promo Flash
```
"Vou fazer promo durante a aula"
→ Professor clica "Partilhar"
→ Partilha no Discord/Telegram
→ Pessoas clicam
→ Entram automaticamente
✓ RESOLVIDO em tempo real
```

---

## 🔐 Segurança

### O Link é Seguro?
✅ SIM!
- Token único (não sequencial)
- Expira em 24h
- Ilimitado de usos (mas rastreável)
- Logging completo
- Revogável se necessário

### O Aluno Vê O Quê?
- ✅ URL: `https://academia.../access/abc123xyz456789...`
- ✗ Não vê credentials
- ✗ Não vê informações sensíveis
- ✗ Não precisa saber como funciona

---

## 🚀 Está Pronto!

O botão "Partilhar" está **ATIVO** durante a aula ao vivo.

**Próximo passo:**
1. Entra numa aula ao vivo
2. Procura "Partilhar" no top bar
3. Clica e testa!

---

**Dúvidas? Lê o guia completo: `SHARE_LINK_USAGE.md`**
