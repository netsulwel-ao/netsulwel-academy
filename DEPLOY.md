# 🚀 Guia de Deploy — Netsulwel Academy

## Pré-requisitos

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Acesso ao servidor (Hostinger, VPS, etc.)
- Variáveis de ambiente configuradas (ver `.env.production.example`)

---

## 1. Build de Produção

```bash
# Instalar dependências
npm install

# Build completo (Next.js + standalone)
npm run build
```

O build gera:
- `.next/standalone/` — servidor standalone (sem node_modules completo)
- `.next/static/` — assets estáticos
- `.next/standalone/public/` — ficheiros públicos

### Verificar build localmente

```bash
npm start
# Abre http://localhost:3000
```

---

## 2. Deploy Firestore Rules

```bash
# Login no Firebase
firebase login

# Deploy das security rules
firebase deploy --only firestore:rules

# Deploy dos índices
firebase deploy --only firestore:indexes
```

### Testar rules antes do deploy

```bash
# Requer Firebase Emulator
firebase emulators:start --only firestore
npm run test:rules
```

---

## 3. Deploy na Hostinger (VPS/Node.js)

### 3.1 Preparar servidor

```bash
# No servidor (via SSH)
mkdir -p /var/www/academia
cd /var/www/academia

# Instalar Node.js 18+ (se necessário)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3.2 Transferir ficheiros

```bash
# Na máquina local — copiar standalone build
scp -r .next/standalone/ user@servidor:/var/www/academia/
scp -r .next/static/ user@servidor:/var/www/academia/.next/static/
scp -r public/ user@servidor:/var/www/academia/public/
```

### 3.3 Configurar variáveis de ambiente

No servidor, criar `/var/www/academia/.env`:

```bash
# Firebase (públicas)
NEXT_PUBLIC_FIREBASE_API_KEY=sua_chave_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Firebase Admin
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# LiveKit
NEXT_PUBLIC_LIVEKIT_URL=wss://seu-livekit.livekit.cloud
LIVEKIT_API_KEY=sua_chave
LIVEKIT_API_SECRET=seu_secret

# Cloudflare R2
R2_ACCOUNT_ID=seu_account_id
R2_ACCESS_KEY_ID=sua_chave
R2_SECRET_ACCESS_KEY=seu_secret
R2_BUCKET_NAME=nome-do-bucket
R2_ENDPOINT=https://seu-account.r2.cloudflarestorage.com
NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.seudominio.com

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha_app
EMAIL_FROM=noreply@seudominio.com

# App
NODE_ENV=production
PORT=3000
```

### 3.4 Iniciar com PM2 (recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
cd /var/www/academia
pm2 start server.js --name "netsulwel-academy" --env production

# Configurar auto-restart
pm2 startup
pm2 save

# Ver logs
pm2 logs netsulwel-academy

# Reiniciar
pm2 restart netsulwel-academy
```

### 3.5 Configurar Nginx (proxy reverso)

```nginx
# /etc/nginx/sites-available/academia
server {
    listen 80;
    server_name academia.seudominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name academia.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/academia.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academia.seudominio.com/privkey.pem;

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Assets estáticos — cache longo
    location /_next/static/ {
        alias /var/www/academia/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /var/www/academia/public/;
        expires 7d;
    }

    # Proxy para Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Checklist Pré-Deploy

### Código
- [ ] `npm run build` — build sem erros
- [ ] `npm test` — todos os testes passando (100 testes)
- [ ] `npm run lint` — sem erros de lint
- [ ] TypeScript sem erros de tipo

### Firebase
- [ ] Firestore rules deployadas (`firebase deploy --only firestore:rules`)
- [ ] Índices deployados (`firebase deploy --only firestore:indexes`)
- [ ] Firebase Storage rules configuradas (se aplicável)

### Variáveis de Ambiente
- [ ] Todas as variáveis obrigatórias configuradas no servidor
- [ ] `FIREBASE_PRIVATE_KEY` com `\n` corretos (não quebras de linha literais)
- [ ] URLs de produção corretas (LiveKit, R2, etc.)

### Servidor
- [ ] Node.js 18+ instalado
- [ ] PM2 configurado com auto-restart
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/TLS ativo (Let's Encrypt ou similar)
- [ ] Firewall: portas 80 e 443 abertas

### Monitorização
- [ ] PM2 logs configurados
- [ ] Alertas de erro configurados (opcional: Sentry)

---

## 5. Deploy Automático (CI/CD)

### GitHub Actions (exemplo)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          # ... outras variáveis

      - name: Deploy to server
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: '.next/standalone/'
          target: '/var/www/academia/'

      - name: Restart PM2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: pm2 restart netsulwel-academy
```

---

## 6. Rollback

```bash
# Se o deploy falhar, reverter para versão anterior
pm2 stop netsulwel-academy

# Restaurar backup anterior
cp -r /var/www/academia-backup/ /var/www/academia/

pm2 start netsulwel-academy
```

**Boa prática:** Antes de cada deploy, fazer backup:
```bash
cp -r /var/www/academia/ /var/www/academia-backup-$(date +%Y%m%d)/
```

---

## 7. Monitorização Pós-Deploy

```bash
# Ver estado da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs netsulwel-academy --lines 100

# Ver métricas de CPU/memória
pm2 monit

# Verificar se o site responde
curl -I https://academia.seudominio.com
```

---

## Troubleshooting

### "FIREBASE_PRIVATE_KEY: invalid"
O private key precisa de `\n` literais, não quebras de linha:
```bash
# Correto (num ficheiro .env)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...\n-----END PRIVATE KEY-----\n"
```

### "Cannot find module 'server.js'"
```bash
# O standalone build é gerado em:
ls .next/standalone/server.js
# Se não existir, correr npm run build novamente
```

### "Port 3000 already in use"
```bash
pm2 stop netsulwel-academy
pm2 delete netsulwel-academy
pm2 start server.js --name "netsulwel-academy"
```

### Erros de Firestore (PERMISSION_DENIED)
Verificar se as rules foram deployadas:
```bash
firebase firestore:rules:get --project=seu-projeto
```
