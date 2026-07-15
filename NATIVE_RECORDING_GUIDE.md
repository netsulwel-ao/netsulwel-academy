# Guia de Gravação Nativa sem LiveKit

Este guia explica como usar o sistema de gravação nativo (WebRTC MediaRecorder) que está integrado no estúdio do professor.

---

## Visão Geral

### O que é?
Sistema de gravação que funciona **sem depender do LiveKit Egress**. Usa a API nativa do navegador (WebRTC MediaRecorder) para:
- ✅ Gravar vídeo do professor
- ✅ Capturar áudio (microfone + sistema)
- ✅ Enviar para Cloudflare R2
- ✅ Disponibilizar para alunos após aula
- ✅ Mais barato que LiveKit Egress

### Vantagens
| Aspecto | LiveKit Egress | Nativo (MediaRecorder) |
|--------|---|---|
| **Custo** | Alto (pay-per-minute) | Grátis (R2 storage) |
| **Complexidade** | Alta | Baixa |
| **Compatibilidade** | Mais compatível | Navegadores modernos |
| **Controle** | Servidor | Cliente |
| **Qualidade** | Excelente | Excelente |

---

## Como Usar

### 1. Acessar o Gravador
Na aba **"Gravar"** do estúdio do professor:

```
Sidebar → "Gravar" tab
```

### 2. Iniciar Gravação
1. Clicar em **"Iniciar Gravação"**
2. Permitir acesso ao microfone (prompt do navegador)
3. Ver o indicador vermelho piscando: **"A gravar..."**

### 3. Durante a Aula
- Ver contador de duração em tempo real
- Pausar/retomar conforme necessário
- Chat, Palavra e outras abas continuam funcionando

### 4. Parar Gravação
Clicar em **"Parar"** quando terminar a aula
- Áudio e vídeo são processados localmente
- Pré-visualização do vídeo aparece no painel

### 5. Enviar Gravação
Clicar em **"Enviar Gravação"**
- Status mostra "A enviar..."
- Após conclusão: "Gravação Concluída!"
- Gravação agora disponível em R2

---

## Componentes Implementados

### Hook: `useScreenRecording()`
**Arquivo**: `src/hooks/useScreenRecording.ts`

Gerencia todo o ciclo de vida da gravação:

```typescript
const recording = useScreenRecording();

// Iniciar
await recording.startRecording(videoElement);

// Pausar/Retomar
recording.pauseRecording();
recording.resumeRecording();

// Parar e obter Blob
const blob = await recording.stopRecording();

// Upload para R2
const url = await recording.uploadRecording(blob, filename, authToken);
```

### Componente UI: `SimpleRecorder`
**Arquivo**: `src/components/SimpleRecorder.tsx`

Interface amigável com:
- Botões Iniciar/Pausar/Parar
- Contador de duração
- Pré-visualização de vídeo
- Status de upload
- Indicador visual de estado

### API: Upload do Vídeo
**Arquivo**: `src/app/api/livekit/recording/upload/route.ts`

Endpoint para receber vídeo:
```
POST /api/livekit/recording/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <video blob>
```

---

## Integração no Studio

O gravador foi integrado no `StudioPage.tsx`:

```typescript
// Novo tab no sidebar
const tabs = [
  { id: "simple-recorder", label: "Gravar", icon: <Radio /> },
  // ... outros tabs
];

// Renderizar componente
{sideTab === "simple-recorder" && (
  <SimpleRecorder liveId={live.id!} liveTitle={live.title} />
)}
```

---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│  Professor no Estúdio (Browser)                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. LiveKit Room → Canvas Element               │
│  2. Canvas + Áudio → MediaRecorder              │
│  3. MediaRecorder → Blob (WebM)                 │
│  4. Blob → Upload API                           │
│  5. API → Cloudflare R2                         │
│  6. URL → Firestore (recordings collection)     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Detalhes Técnicos

1. **Captura de Vídeo**
   - Canvas 1920x1080 (configurável)
   - 30 FPS
   - Codec: VP9 (eficiente)

2. **Captura de Áudio**
   - Microfone do utilizador
   - Comprimido com Opus
   - Mono ou estéreo

3. **Formato do Vídeo**
   - Tipo MIME: `video/webm;codecs=vp9,opus`
   - Tamanho: ~50-100MB por hora
   - Duração: Ilimitado (por arquivo)

4. **Upload para R2**
   - Multipart upload para arquivos > 100MB
   - Retentativas automáticas
   - Nome: `recordings/{timestamp}-{random}.webm`

---

## Firestore Schema

### Collection: `recordings`

```json
{
  "fileName": "aula-math-2026-07-15.webm",
  "objectKey": "recordings/1721043200000-abc1234.webm",
  "size": 524288000,
  "mimeType": "video/webm",
  "uploadedAt": "2026-07-15T10:30:45.000Z",
  "uploadedBy": "professor-uid-123",
  "url": "https://r2.example.com/recordings/1721043200000-abc1234.webm",
  "status": "ready", // "pending", "uploading", "ready", "failed"
  "duration": 3600,
  "liveId": "live-session-id",
  "title": "Aula de Matemática"
}
```

---

## Configuração Necessária

### Variáveis de Ambiente

```env
# .env.production
NEXT_PUBLIC_R2_BUCKET=your-bucket-name
NEXT_PUBLIC_R2_REGION=auto
R2_ENDPOINT_URL=https://your-endpoint.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-public-domain.com
```

---

## Limitações Conhecidas

1. **Navegadores Suportados**
   - Chrome/Edge: ✅ Completo
   - Firefox: ✅ Completo
   - Safari: ⚠️ Áudio pode não funcionar (limitações WebKit)
   - Opera: ✅ Completo

2. **Tamanho de Arquivo**
   - Máximo: 5GB por arquivo
   - Para aulas muito longas: Gravar em múltiplos arquivos

3. **Qualidade de Áudio**
   - Depende da qualidade do microfone
   - Usar microfone externo para melhor qualidade

4. **Performance**
   - CPU: ~10-15% durante gravação
   - RAM: ~100-200MB
   - Rede: Necessária para upload

---

## Troubleshooting

### "Permissão de Câmara Negada"
1. Verificar permissões do navegador
2. Recarregar página
3. Tentar incognito/privado

### "Arquivo Muito Grande"
1. Parar gravação mais cedo
2. Gravar em múltiplos segmentos
3. Comprimir vídeo antes de enviar (ffmpeg)

### "Erro no Upload"
1. Verificar conexão internet
2. Verificar espaço em R2
3. Verificar credenciais (env vars)

### "Áudio Não Grava"
1. Verificar permissões de microfone
2. Testar microfone em Settings do SO
3. Safari: limitações conhecidas do WebKit

---

## Próximos Passos

### Melhorias Futuras
- [ ] Suporte para múltiplas câmaras
- [ ] Seleção de qualidade (720p, 1080p, 4K)
- [ ] Compressão no cliente (WASM)
- [ ] Gravação em segmentos automáticos
- [ ] Download local antes de enviar

### Para o Backend
- [ ] Dashboard de gravações
- [ ] Replay player melhorado
- [ ] Busca/filtro de gravações
- [ ] Análise de duração/tamanho
- [ ] Espaço de armazenamento

### Otimizações
- [ ] Usar Web Workers para processamento
- [ ] Streaming upload em tempo real
- [ ] Cache local antes de enviar
- [ ] Retry automático com backoff

---

## Exemplos de Código

### Usar o Hook Diretamente

```typescript
import { useScreenRecording } from "@/hooks/useScreenRecording";

function MyRecorder() {
  const recording = useScreenRecording();

  const handleStart = async () => {
    await recording.startRecording();
  };

  const handleStop = async () => {
    const blob = await recording.stopRecording();
    if (blob) {
      console.log("Gravação pronta:", blob.size, "bytes");
    }
  };

  return (
    <div>
      <button onClick={handleStart}>
        {recording.isRecording ? "Gravando..." : "Iniciar"}
      </button>
      <button onClick={handleStop}>Parar</button>
      <p>Duração: {recording.duration}s</p>
    </div>
  );
}
```

### Enviar para Servidor

```typescript
const blob = await recording.stopRecording();
const authToken = await user.getIdToken();

const recordingUrl = await recording.uploadRecording(
  blob,
  "aula-math.webm",
  authToken
);

if (recordingUrl) {
  console.log("Gravação disponível em:", recordingUrl);
  // Atualizar Firestore
  await updateDoc(doc(db, "lives", liveId), {
    recordingUrl,
    recordingStatus: "ready",
  });
}
```

---

## FAQ

**P: Qual é o tamanho típico de uma gravação?**  
R: ~50-100MB por hora em VP9, menos com compressão adicional.

**P: Posso pausar e retomar?**  
R: Sim! Usar "Pausar" e "Retomar" durante a gravação.

**P: Funciona em Safari?**  
R: Sim, mas com limitações de áudio (WebKit). Vídeo funciona bem.

**P: Quantas gravações posso ter?**  
R: Ilimitado, enquanto houver espaço em R2.

**P: Posso deletar uma gravação?**  
R: Sim, apenas admin pode deletar via dashboard.

---

## Support

Para problemas:
1. Verificar console do navegador (F12)
2. Ver logs do servidor
3. Contactar suporte com screenshot do erro
