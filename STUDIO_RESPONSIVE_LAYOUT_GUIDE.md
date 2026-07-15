# Studio Responsiveness & Layout Guide

Este guia documenta as melhorias de responsividade e layout para o estúdio do professor e visualização do aluno.

---

## Overview

### O que mudou?
1. ✅ **StudioLayout** - Layout modular e responsivo
2. ✅ **SidebarTabs** - Abas adaptáveis (horizontal/vertical)
3. ✅ **ImprovedControlsBar** - Controles otimizados para mobile
4. ✅ **StudioHeader** - Cabeçalho limpo e responsivo
5. ✅ **StudentLiveViewer** - Visualização otimizada para aluno
6. ✅ **CSS Global** - Estilos de responsividade universal

---

## Novos Componentes

### 1. StudioLayout
**Arquivo**: `src/components/studio/StudioLayout.tsx`

Componente base que gerencia:
- Layout flex responsivo (desktop, tablet, mobile)
- Sidebar colapsável
- Transições suaves
- Desktop controls no topo
- Mobile header integrado

```typescript
<StudioLayout
  header={<StudioHeader ... />}
  stage={<Stage ... />}
  controlsBar={<ImprovedControlsBar ... />}
  sidebar={<SidebarContent ... />}
  sidebarTabs={<SidebarTabs ... />}
/>
```

**Responsive Behavior**:
- **Mobile** (<768px): Stack vertical, sidebar como bottom sheet
- **Tablet** (768-1024px): Sidebar flex, controls em 2 rows
- **Desktop** (>1024px): Layout ideal com sidebar colapsável

### 2. SidebarTabs
**Arquivo**: `src/components/studio/SidebarTabs.tsx`

Gerencia abas do sidebar com dois modos:
- **Horizontal**: Mobile (abas em row, scrollável)
- **Vertical**: Desktop (abas em coluna, com ícones e labels)

```typescript
<SidebarTabs
  tabs={[
    { id: "chat", label: "Chat", icon: <MessageSquare /> },
    { id: "users", label: "Alunos", icon: <Users /> },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  orientation="horizontal" // ou "vertical"
/>
```

**Features**:
- Toggle para mostrar/esconder labels (desktop only)
- Badges com contador
- Overflow scrolling em mobile
- Smooth transitions

### 3. ImprovedControlsBar
**Arquivo**: `src/components/studio/ImprovedControlsBar.tsx`

Barra de controles adaptável:
- Botões compactos em mobile
- Layout horizontal com divisores
- Confirmação de encerramento
- Responsividade para touch

```typescript
<ImprovedControlsBar
  isMicOn={mic}
  isCamOn={cam}
  isScreenOn={screen}
  isFullscreen={fullscreen}
  onToggleMic={toggleMic}
  onToggleCam={toggleCam}
  onToggleScreen={toggleScreen}
  onToggleFullscreen={toggleFullscreen}
  onEnd={endCall}
/>
```

**Mobile Optimization**:
- Icon-only buttons (<640px)
- Text labels hidden, ícones visíveis
- Scroll horizontal para mais opções
- Touch-friendly hit targets (44px mín)

### 4. StudioHeader
**Arquivo**: `src/components/studio/StudioHeader.tsx`

Cabeçalho limpo do estúdio:
- Live indicator
- Título da aula
- Badge "AO VIVO"
- Contagem de participantes
- Botão de partilha

**Responsiveness**:
- Desktop: All elements visible
- Tablet: Hide timer, keep essentials
- Mobile: Menu button, hide share button inline

### 5. StudentLiveViewer
**Arquivo**: `src/components/StudentLiveViewer.tsx`

Componente completo para alunos:
- Layout responsivo (video + chat side-by-side ou stacked)
- Chat integrado
- Botão de pedir palavra
- Informações da aula

**Breakpoints**:
- **Mobile**: Video full width, chat como bottom sheet
- **Tablet**: Video 60%, chat 40% lado a lado
- **Desktop**: Video 70%, chat 30% com mais espaço

---

## Breakpoints & Media Queries

### Tailwind Breakpoints
```
sm:  640px   (small phones)
md:  768px   (tablets)
lg:  1024px  (small desktops)
xl:  1280px  (desktops)
2xl: 1536px  (large displays)
```

### Uso no Studio
```typescript
// Mobile first
<div className="flex flex-col md:flex-row">
  {/* Mobile: vertical */}
  {/* Tablet+: horizontal */}
</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">
  {/* Desktop only */}
</div>
```

---

## Layout Responsividade Detalhada

### Desktop (1024px+)
```
┌─────────────────────────────────────────────┐
│ Header (44px)                               │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   Stage (Video)      │   Sidebar (320px)    │
│                      │  ┌──────────────────┐│
│   (Flex-1)           │  │ Tabs  | Chat     ││
│                      │  ├──────────────────┤│
│                      │  │ Messages (flex)  ││
│                      │  ├──────────────────┤│
│                      │  │ Input (bottom)   ││
│                      │  └──────────────────┘│
├──────────────────────┴──────────────────────┤
│ Controls Bar (56px)                         │
└─────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌──────────────────────────────────────────┐
│ Compact Header (40px)                    │
├──────────────────────┬───────────────────┤
│                      │ Sidebar (280px)   │
│   Stage (Video)      │ ┌─────────────────┤
│                      │ │ Tabs (scroll)   │
│   (Flex-1)           │ ├─────────────────┤
│                      │ │ Content (flex)  │
│                      │ └─────────────────┤
├──────────────────────┴───────────────────┤
│ Controls (wrap, 48px)                    │
└──────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────────┐
│ Header + Menu (40px)   │
├────────────────────────┤
│                        │
│   Stage (Video)        │
│   (Full Width)         │
│                        │
├────────────────────────┤
│ Action Buttons (48px)  │
├────────────────────────┤
│ Chat/Panel             │
│ (Bottom Sheet)         │
│ [━━━━━━━━━━━━━━]       │
└────────────────────────┘
```

---

## CSS Classes & Utilities

### Responsive Classes Adicionadas
```css
/* Scrollbar hiding */
.scrollbar-hide          /* Hide scrollbar, keep scroll */
.hide-scrollbar-webkit   /* Webkit-specific */

/* Layout */
.flex-center             /* flex, center items/justify */
.flex-between            /* flex, space-between */
.studio-stage            /* Video container setup */

/* Adaptiveness */
.btn-adaptive            /* Button with responsive padding */
.tab-responsive          /* Tab with mobile/desktop styles */
.chat-message            /* Message with break-word */

/* Safe Areas (Notched devices) */
.safe-top                /* padding-top with safe-area */
.safe-bottom             /* padding-bottom with safe-area */
.safe-left               /* padding-left with safe-area */
.safe-right              /* padding-right with safe-area */

/* Animations */
.control-btn-active      /* Button pulse animation */
```

### Exemplo de Uso
```jsx
// Sidebar responsivo
<div className="w-full md:w-[280px] lg:w-[320px] transition-all duration-300">
  {/* Width varies by breakpoint */}
</div>

// Controls bar adaptável
<div className="flex gap-1 sm:gap-2 flex-wrap md:flex-nowrap">
  {/* Wrap on mobile, no wrap on desktop */}
</div>

// Chat input (prevent iOS zoom)
<input className="studio-input" />
```

---

## Mobile Optimizations

### 1. iOS Keyboard
```css
/* Prevent zoom on input focus */
input, textarea, select {
  font-size: 16px; /* >= 16px prevents zoom */
}
```

### 2. Safe Area Insets
```css
/* Notch/home indicator support */
@supports (padding: max(0px)) {
  .safe-bottom {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
}
```

### 3. Touch Targets
```css
/* Minimum 44x44px for touch */
button {
  min-width: 44px;
  min-height: 44px;
}
```

### 4. Viewport Meta Tag
```html
<meta name="viewport" 
  content="width=device-width, 
           initial-scale=1.0,
           maximum-scale=1.0,
           user-scalable=no,
           viewport-fit=cover">
```

---

## Migração do StudioPage Antigo

### Antes
```jsx
function StudioPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-11 border-b">Header</div>
      <div className="flex flex-1">
        <Stage />
        <Sidebar />
      </div>
      <ControlsBar />
    </div>
  )
}
```

### Depois
```jsx
function StudioPage() {
  return (
    <StudioLayout
      header={<StudioHeader ... />}
      stage={<Stage ... />}
      controlsBar={<ImprovedControlsBar ... />}
      sidebar={<SidebarContent ... />}
      sidebarTabs={<SidebarTabs ... />}
    />
  )
}
```

---

## Student View Improvements

### Antes
- Layout simples, pouco responsivo
- Chat sempre visível em desktop
- Não havia modo mobile optimizado

### Depois
```typescript
<StudentLiveViewer
  live={live}
  videoElement={<LiveKitRoom ... />}
  participantCount={count}
/>
```

**Features**:
- ✅ Bottom sheet chat no mobile
- ✅ Side-by-side layout em desktop
- ✅ Botão "Pedir Palavra" integrado
- ✅ Informações da aula acessíveis
- ✅ Tabs (Chat/Info) em mobile

---

## Testing Responsiveness

### Desktop
```bash
# Chrome DevTools
- Set device to "Responsive Design Mode"
- Test at 1920x1080, 1440x900, 1024x768
- Verify sidebar collapse works
- Check controls bar spacing
```

### Tablet
```bash
# iPad Pro (1024x1366)
# iPad Air (768x1024)
- Verify sidebar width is correct
- Check tab label visibility
- Test chat scrolling
```

### Mobile
```bash
# iPhone 14 (390x844)
# iPhone SE (375x667)
- Verify full-screen video
- Check bottom sheet interaction
- Test keyboard doesn't cover input
- Verify safe area padding
```

### Screen Reader
```bash
# Test with VoiceOver/NVDA
- Tab order correct
- Buttons labeled properly
- Active states announced
```

---

## Performance Considerations

### Avoid Layout Shifts
```css
/* Reserve space for scrollbar */
html {
  overflow-y: scroll;
}

/* Or use scrollbar-gutter (modern browsers) */
html {
  scrollbar-gutter: stable;
}
```

### Smooth Animations
```css
/* Use transform instead of width/left */
.sidebar-collapse {
  transition: transform 300ms, opacity 300ms;
}
```

### Image Optimization
```jsx
// Use responsive images
<img 
  src="image.jpg"
  srcSet="image-sm.jpg 640w, image-md.jpg 1024w"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## Troubleshooting

### Sidebar não fecha no mobile
✅ Use `sidebarOpen` state com button trigger
✅ Verifique `md:hidden` classes

### Video fica pixelado
✅ Use `object-fit: cover` ou `contain`
✅ Verifique aspect ratio da fonte

### Chat input vai atrás do keyboard iOS
✅ Adicione `pb-[max(12px,env(safe-area-inset-bottom))]`
✅ Use `position: fixed` com bottom calculado

### Botões muito pequenos no mobile
✅ Aumente tamanho com `h-10 sm:h-12`
✅ Verifique mínimo de 44x44px

### Layout fica bugado em landscape
✅ Use `100dvh` (dynamic viewport height)
✅ Teste em Safari iOS

---

## Future Improvements

- [ ] Modo picture-in-picture para chat
- [ ] Fullscreen sidebar no mobile
- [ ] Gesture controls (swipe para abrir/fechar)
- [ ] Modo dark/light automático
- [ ] Acessibilidade com keyboard navigation
- [ ] Suporte a split-screen em tablets

---

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Safe Area Inset](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [WebKit Viewport Meta](https://webkit.org/blog/7434/new-webkit-features-in-ios-11/)
- [WCAG Mobile Accessibility](https://www.w3.org/WAI/WCAG2AAA-Conformance.html)

