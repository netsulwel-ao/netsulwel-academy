# Page Transition System Guide

A professional page transition system inspired by Stripe, Linear, and Vercel. Provides smooth, intentional animations between pages with theme persistence and intelligent scroll handling.

## Overview

The page transition system consists of:

1. **TransitionProvider** - Context-based state management for transitions
2. **TransitionOverlay** - Visual feedback during transitions (blur + loading indicator)
3. **PageTransition** - Wrapper component for entrance animations
4. **usePageTransition** - Hook for programmatic navigation with transitions
5. **CSS Animations** - Keyframe animations for various page types

## Architecture

### Components

#### TransitionContext (`src/contexts/TransitionContext.tsx`)

Manages transition state globally:

```typescript
interface TransitionContextType {
  isTransitioning: boolean;      // Current transition state
  startTransition: () => void;   // Begin exit animation
  endTransition: () => void;     // Begin entrance animation
  preserveScroll: boolean;       // Save/restore scroll position
  setPreserveScroll: (val: boolean) => void;
}
```

**Features:**
- Tracks active transitions
- Manages scroll position preservation
- Auto-saves scroll position during transitions

#### TransitionOverlay (`src/components/TransitionOverlay.tsx`)

Visual feedback component showing during transitions:

```tsx
- Backdrop blur effect (100ms)
- Animated loading indicator
- Non-interactive overlay (pointer-events-none)
```

**Timing:**
- Blur duration: 200ms
- Shows only when transitioning

#### PageTransition (`src/components/PageTransition.tsx`)

Wraps page content with entrance animations:

```tsx
<PageTransition type="auth" preserveScroll={false}>
  <YourPageContent />
</PageTransition>
```

**Types:**
- `"default"` - Standard fade + scale (300ms)
- `"auth"` - Staggered card entrance with slight delay
- `"dashboard"` - Smooth scale transition (350ms)

### Hook

#### usePageTransition (`src/hooks/usePageTransition.ts`)

Programmatic navigation with automatic transitions:

```typescript
const navigate = usePageTransition();
navigate("/dashboard");  // Triggers full transition sequence
```

**Behavior:**
1. Calls `startTransition()` → Exit animation begins
2. Waits 200ms → Blur + fade out
3. Triggers navigation
4. New page component calls `endTransition()`
5. Entrance animation plays (300-350ms)

## Animation Timeline

### Complete Transition Sequence

```
T=0ms     │ startTransition() called
          │ ├─ Overlay appears with blur
          │ └─ Current page fades out + scales up
          ↓
T=200ms   │ Navigation occurs
          │ └─ Old page unmounts
          ↓
T=100ms   │ New page mounts
(offset)  │ └─ Calls endTransition()
          ├─ Overlay blur/fade ends
          └─ New page entrance animation begins
          ↓
T=300-350ms │ Entrance animation completes
            └─ Page interactive
```

## CSS Animations

### Page Enter Animations

#### Standard Page Enter
```css
@keyframes page-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
/* Duration: 300ms */
/* Easing: cubic-bezier(0.4, 0, 0.2, 1) */
```

#### Auth Page Enter (Staggered)
```css
@keyframes page-enter-auth-card {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Stagger delays: 50ms, 100ms, 150ms, 200ms, 250ms */
```

#### Dashboard Page Enter
```css
@keyframes page-enter-dashboard {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
/* Duration: 350ms */
```

### Exit Animation

```css
@keyframes page-exit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.05);  /* Zoom out effect */
  }
}
/* Duration: 200ms */
```

## Usage Examples

### Basic Page Wrapping

```tsx
// src/app/login/page.tsx
import { PageTransition } from "@/components/PageTransition";

export default function LoginPage() {
  return (
    <PageTransition type="auth">
      <main>
        {/* Login form content */}
      </main>
    </PageTransition>
  );
}
```

### Programmatic Navigation

```tsx
import { usePageTransition } from "@/hooks/usePageTransition";

export function MyComponent() {
  const navigate = usePageTransition();
  
  const handleSubmit = async (data) => {
    await submitForm(data);
    navigate("/dashboard");  // Smooth transition
  };
  
  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Scroll Preservation

```tsx
<PageTransition type="default" preserveScroll={true}>
  <YourContent />
</PageTransition>
```

This will:
1. Save scroll position before exit animation
2. Restore scroll position after entrance animation

## Theme Persistence

The layout wraps the entire app with both providers:

```tsx
<TransitionProvider>
  <AuthProvider>
    <TransitionOverlay />
    {children}
    <Toaster />
  </AuthProvider>
</TransitionProvider>
```

**Theme handling:**
- Stored in `localStorage` as `public-theme`
- Preserved across page transitions
- Smooth CSS transitions (200ms) when toggling
- Auto-applied via `data-theme` attribute

## Performance Optimizations

### 1. Smooth 60fps Animations
- Uses `transform` and `opacity` (GPU-accelerated)
- Avoid reflows/repaints with CSS animations
- Loading overlay is non-interactive

### 2. Efficient Context Updates
- Context only triggers re-renders for components that use `useTransition()`
- `TransitionOverlay` uses separate mounted state to avoid hydration issues

### 3. Scroll Handling
- Only saves/restores scroll if `preserveScroll={true}`
- Passive event listeners prevent jank
- Smart scroll restoration timing

## Customization

### Adding New Page Types

1. **Add keyframe to CSS:**
```css
@keyframes page-enter-custom {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-page-enter-custom {
  animation: page-enter-custom 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

2. **Update PageTransition component:**
```tsx
type PageType = "default" | "auth" | "dashboard" | "custom";

const getAnimationClass = () => {
  // Add case for "custom"
};
```

3. **Use it:**
```tsx
<PageTransition type="custom">
  <Content />
</PageTransition>
```

### Adjusting Timing

All durations are configurable in `globals.css`:

```css
/* Exit animation duration */
@keyframes page-exit {
  /* ... change duration from 200ms to whatever */
}

/* Entrance animation duration */
@keyframes page-enter {
  /* ... change duration from 300ms to whatever */
}

/* Overlay blur transition */
.blur-transition {
  animation: blur-transition 300ms ease-in-out;
  /* Adjust from 300ms */
}
```

## Testing Transitions

### Manual Testing

1. Navigate between login and register:
   ```
   / → /login → /register → /
   ```

2. Verify overlay appears:
   - Blur effect visible during transition
   - Loading spinner shows

3. Check entrance animations:
   - Auth pages: staggered card entrance
   - Dashboard: smooth scale fade
   - Landing: default fade

4. Theme persistence:
   - Toggle light/dark on login page
   - Navigate away and back
   - Theme should persist

### Performance Testing

```bash
# Check build size
npm run build

# Test with local dev server
npm run dev

# Check Chrome DevTools:
# - Performance tab → record navigation
# - Look for consistent 60fps
# - No layout shifts (CLS = 0)
```

## Browser Support

- Modern browsers with CSS animations support
- Smooth scroll behavior optional (graceful degradation)
- Fallback to instant transitions if CSS animations disabled

## Troubleshooting

### Transitions Not Triggering

1. Ensure `TransitionProvider` wraps your app in `layout.tsx`
2. Verify `PageTransition` wrapper on your pages
3. Check that `TransitionOverlay` is rendered

### Scroll Not Restoring

- Set `preserveScroll={true}` on `PageTransition`
- Verify page doesn't have `scroll-smooth` on body

### Animation Jank

- Check for expensive operations during transition
- Ensure no heavy re-renders in `endTransition()` callback
- Use Performance tab to identify bottlenecks

### Theme Not Persisting

- Check browser localStorage is enabled
- Verify `public-theme` key exists in localStorage
- Ensure theme is set before page renders

## Integration Checklist

- [x] TransitionContext created and integrated
- [x] TransitionOverlay component added to layout
- [x] PageTransition wrapper created
- [x] usePageTransition hook implemented
- [x] CSS animations added to globals.css
- [x] Login page updated with transitions
- [x] Register page updated with transitions
- [x] Layout.tsx wrapped with providers
- [x] Build verification passed
- [x] Theme persistence working

## Files Modified

- `src/contexts/TransitionContext.tsx` - NEW
- `src/components/TransitionOverlay.tsx` - NEW
- `src/components/PageTransition.tsx` - NEW
- `src/hooks/usePageTransition.ts` - NEW
- `src/app/globals.css` - UPDATED (animations added)
- `src/app/layout.tsx` - UPDATED (providers added)
- `src/app/login/page.tsx` - UPDATED (wrapper + hook)
- `src/app/register/page.tsx` - UPDATED (wrapper + hook)

## Premium Features Implemented

✅ Fade out current page (200ms)
✅ Blur effect during transition (100ms)
✅ Fade in new page (300ms)
✅ Scale/zoom effect (smooth, not jarring)
✅ Transition provider with theme persistence
✅ Loading overlay during transitions
✅ Page content animation in/out
✅ Intelligent scroll position preservation
✅ Auth pages with staggered entrance
✅ Premium feel like Stripe/Linear/Vercel
