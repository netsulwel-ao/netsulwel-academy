# 🎨 Refactoring para Design System Profissional

## Objetivo
Refatorar completamente o layout de autenticação para seguir um sistema de grid 12-colunas, espaçamento de 8px, e princípios de Product Design modernos (referência: Stripe, Linear, Vercel, Clerk, Notion, Raycast).

---

## 📐 GRID & LAYOUT

### Container Principal
- **Desktop (1920x1080):**
  - Container Width: 1440px
  - Max Width: 1440px
  - Margin Horizontal: Auto
  - Grid: 12 colunas
  - Gutter: 32px
  - Padding externo: 80px
  - **Regra:** Nunca colar elementos às bordas

### Divisão Login + Hero
```
Desktop:
┌─────────────────────────────────────────────────────┐
│ 45% Login         │         55% Hero                 │
└─────────────────────────────────────────────────────┘
(5.4 cols)        (6.6 cols)

Tablet (768px):
┌─────────────────────────────────────────────────────┐
│ 40% Login         │         60% Hero                 │
└─────────────────────────────────────────────────────┘

Mobile (< 640px):
┌─────────────────────────────────────────────────────┐
│                    100% Login                        │
│               (Hero desaparece)                      │
│                   Padding 24px                       │
└─────────────────────────────────────────────────────┘
```

---

## 🎴 LOGIN CARD DIMENSÕES

```css
.login-card {
  width: 460px;
  max-width: 480px;
  min-width: 420px;
  padding: 48px;
  border-radius: 24px;
  gap-between-elements: 24px;
}
```

**Mobile override:**
```css
max-width: 100%;
padding: 32px;
border-radius: 16px;
```

---

## 📝 TIPOGRAFIA

### Hierarchy
| Elemento | Font-Size | Weight | Line-Height | Notes |
|----------|-----------|--------|-------------|-------|
| H1 (Título) | 44px | 700 | 52px | - |
| H2 (Subtitle) | 18px | 400 | 28px | Opacity 70% |
| Label | 12px | 600 | - | Uppercase, Letter-Spacing 0.08em |
| Input Text | 16px | 400 | 24px | - |
| Small/Caption | 14px | 400 | 20px | Opacity 60% |
| Body | 16px | 400 | 24px | - |

---

## 🎛️ COMPONENTES

### 1. LOGIN FORM FIELDS

**Inputs:**
```css
.input {
  width: 100% (do card);
  height: 56px;
  border-radius: 14px;
  padding-horizontal: 18px;
  padding-vertical: 14px;
  font-size: 16px;
  
  icon: 20px;
  icon-distance-left: 16px;
}
```

**Labels:**
```css
.label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
```

---

## 🎨 ESPAÇAMENTO (Múltiplos de 8px)

### Form Elements Spacing
```
Título ↓ (12px) ↓ Descrição
Descrição ↓ (32px) ↓ Email Input
Email ↓ (24px) ↓ Password Input
Password ↓ (24px) ↓ Remember/Forgot
Remember ↓ (24px) ↓ Submit Button
Submit Button ↓ (32px) ↓ Social Login
Social Login ↓ (32px) ↓ Sign Up Link
```

### Gaps internos
- Input label → Input: 8px
- Icon → Text (dentro input): 16px
- Card padding: 48px (desktop) / 32px (mobile)
- Form elements gap: 24px
- Social buttons gap: 16px

---

## 🔘 BUTTONS

### Primary Button (Login/Sign Up)
```css
height: 56px;
border-radius: 16px;
font--size: 16px;
font-weight: 600;
gradient: Purple → Indigo;
transition: 250ms;
hover-scale: 1.02;
shadow: 0 12px 40px rgba(120, 70, 255, 0.25);
```

### Social Buttons
```css
width: calc(50% - 8px);
height: 52px;
border-radius: 14px;
gap: 16px;
```

### Secondary Buttons
```css
border: 1px solid
border-radius: 16px;
height: 56px;
```

---

## 🌅 HERO SECTION

### Headlines
- **Headline:** 64px, weight 800
- **Subtitle:** 22px, weight 400, line-height 34px
- Cards flutuantes: 280x180, radius 24px, glass blur 24px

### Hero Cards (Glassmorphism)
```css
.hero-card {
  width: 280px;
  height: 180px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.15);
  blur: 20px;
  opacity: 15%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  icon: 48px;
  title: 20px weight 600;
  subtitle: 14px weight 400 opacity 70%;
}
```

### Exemplos de Cards
```
📚 +500 Cursos
Conteúdo atualizado

👥 Comunidade
Milhares de alunos

🎓 Certificados
Reconhecimento profissional
```

*(Usar ICONS do Lucide, NÃO emojis)*

---

## 🌌 BACKGROUND

### Estrutura Simplificada
1. **Aurora Gradient** (3 cores)
   - Purple → Indigo → Pink
   - Blur: 500px
   - Opacity: 8%

2. **Dot Grid**
   - Opacity: 4%
   - Spacing: 40px

3. **Network Nodes** (2-3 apenas)
   - Positioned: bottom-left, top-right, center
   - Opacity: 6%
   - Size: 100-200px

**Nunca:** Linhas aleatórias, demasiados elementos, grid demais

---

## 🌙 LIGHT MODE

Não invertir cores simplesmente!

```css
[data-theme="light"] {
  background: #F8FAFC (slate-50);
  card: #FFFFFF;
  text: #0F172A (slate-900);
  text-secondary: #475569 (slate-600);
  border: #E2E8F0 (slate-200);
  shadow: 0 30px 60px rgba(0, 0, 0, 0.08);
  
  hero-gradient: Azul + Roxo + Branco (suave);
  input-bg: #FFFFFF;
  input-border: #CBD5E1 (slate-300);
}
```

---

## 📱 RESPONSIVIDADE

### Breakpoints
- **Desktop:** 1440px+
- **Tablet:** 768px - 1023px
- **Mobile:** 320px - 767px

### Mobile Adjustments
- Hero desaparece (display: none)
- Login centralizado (100% width)
- Padding container: 24px
- Font sizes reduzidas 10-15%
- Button height: 48px

### Tablet Adjustments
- Grid mantém 12 colunas
- Padding reduzido: 40px
- Hero visível mas menor (40%)

---

## 🎭 LOGO

```css
.logo {
  size: 48px (icon) + 28px (text);
  text-weight: 700;
  padding: 80px;
  
  positioning: TOP-LEFT
  margin: 32px from edges (nunca colado);
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Estrutura CSS Base
- [ ] Criar arquivo `auth-layout.css` com grid system
- [ ] Definir container, breakpoints
- [ ] Implementar spacing utilities (8px multiples)
- [ ] Configurar CSS custom properties para cores

### Fase 2: Componentes
- [ ] Refatorar LoginCard component
- [ ] Criar InputField com nova estrutura
- [ ] Criar Button component (primary/secondary/social)
- [ ] Criar HeroCard component

### Fase 3: Páginas
- [ ] Refatorar `/login`
- [ ] Refatorar `/register`
- [ ] Refatorar `/register/teacher`
- [ ] Refatorar `/register/institution`
- [ ] Refatorar `/verify-email`

### Fase 4: Light Mode & Responsividade
- [ ] Implementar light mode completo
- [ ] Testar em breakpoints (320, 768, 1440)
- [ ] Validar acessibilidade

### Fase 5: Polishing
- [ ] Animações suaves (transitions 250-300ms)
- [ ] Hover states elegantes
- [ ] Focus states acessíveis
- [ ] Performance (lazy load backgrounds)

---

## 🎯 REFERÊNCIAS DE INSPIRAÇÃO

Analisar para capturar essência (NÃO copiar):
- **Stripe Dashboard:** Grid preciso, espaçamento limpo
- **Linear:** Tipografia hierárquica, cards minimalistas
- **Vercel:** Hero sections com glassmorphism
- **Clerk:** Onboarding limpo e profissional
- **Raycast:** Feedback visual delicado
- **Notion:** Uso estratégico de espaço negativo

---

## 📋 NOTAS IMPORTANTES

1. **Grid de 12 colunas:** Sempre respeitar, nunca quebrar
2. **Nunca improvizar:** Todos os valores devem estar em múltiplos de 8px
3. **Hierarquia clara:** Usar peso/tamanho/cor consistentemente
4. **Espaço negativo:** É um recurso, não um vazio
5. **Acessibilidade:** Ratios de contraste ≥ 4.5:1, ARIA labels
6. **Performance:** Backgrounds com blur devem ser otimizados
7. **Icons não emojis:** Usar Lucide para ícones em auth

---

## 🚀 RESULTADO ESPERADO

Ao final, as páginas de auth terão:
✅ Proporções equilibradas
✅ Alinhamento preciso
✅ Espaçamento consistente
✅ Tipografia hierárquica clara
✅ Design responsivo verdadeiro
✅ Light + Dark mode profissional
✅ Animações suaves e propositais
✅ Acessibilidade WCAG AAA
✅ Performance otimizada
✅ Código limpo e reutilizável
