# 🎨 MediaProcessor Design System

## Color System

### Primary Palette

```css
/* Gradient Accent */
--gradient-primary: linear-gradient(to bottom right, 
  rgb(59 130 246),    /* blue-500 */
  rgb(139 92 246),    /* violet-500 */
  rgb(147 51 234)     /* purple-600 */
);

/* Background Colors */
--bg-light: rgb(250 250 250);      /* zinc-50 */
--bg-light-alt: rgb(248 250 252);  /* slate-50 */
--bg-dark: rgb(9 9 11);            /* zinc-950 */
--bg-dark-alt: rgb(2 6 23);        /* slate-950 */

/* Surface Colors */
--surface-light: rgb(255 255 255);  /* white */
--surface-dark: rgb(24 24 27);      /* zinc-900 */

/* Border Colors */
--border-light: rgb(228 228 231 / 0.5);  /* zinc-200/50 */
--border-dark: rgb(39 39 42 / 0.5);      /* zinc-800/50 */
```

### Semantic Colors

```css
/* Success */
--success: rgb(34 197 94);          /* emerald-500 */
--success-bg: rgb(236 253 245);     /* emerald-50 */
--success-border: rgb(167 243 208); /* emerald-200 */

/* Error */
--error: rgb(239 68 68);            /* red-500 */
--error-bg: rgb(254 242 242);       /* red-50 */
--error-border: rgb(254 202 202);   /* red-200 */

/* Warning */
--warning: rgb(245 158 11);         /* amber-500 */
--warning-bg: rgb(255 251 235);     /* amber-50 */
--warning-border: rgb(253 230 138); /* amber-200 */

/* Info */
--info: rgb(59 130 246);            /* blue-500 */
--info-bg: rgb(239 246 255);        /* blue-50 */
--info-border: rgb(191 219 254);    /* blue-200 */
```

### Text Colors

```css
/* Light Mode */
--text-primary-light: rgb(24 24 27);    /* zinc-900 */
--text-secondary-light: rgb(82 82 91);  /* zinc-600 */
--text-tertiary-light: rgb(113 113 122); /* zinc-500 */

/* Dark Mode */
--text-primary-dark: rgb(244 244 245);   /* zinc-100 */
--text-secondary-dark: rgb(161 161 170); /* zinc-400 */
--text-tertiary-dark: rgb(113 113 122);  /* zinc-500 */
```

---

## Typography

### Font Stack

```css
/* Default (Inter) */
font-family: Inter, -apple-system, BlinkMacSystemFont, 
             "Segoe UI", Roboto, sans-serif;

/* Monospace (for code/technical) */
font-family: "JetBrains Mono", "Fira Code", 
             Monaco, monospace;
```

### Type Scale

```css
/* Display */
.text-display {
  font-size: 2rem;      /* 32px */
  line-height: 2.5rem;  /* 40px */
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Heading 1 */
.text-h1 {
  font-size: 1.5rem;    /* 24px */
  line-height: 2rem;    /* 32px */
  font-weight: 700;
}

/* Heading 2 */
.text-h2 {
  font-size: 1.125rem;  /* 18px */
  line-height: 1.75rem; /* 28px */
  font-weight: 600;
}

/* Body Large */
.text-body-lg {
  font-size: 1rem;      /* 16px */
  line-height: 1.5rem;  /* 24px */
  font-weight: 400;
}

/* Body */
.text-body {
  font-size: 0.875rem;  /* 14px */
  line-height: 1.25rem; /* 20px */
  font-weight: 400;
}

/* Small */
.text-small {
  font-size: 0.75rem;   /* 12px */
  line-height: 1rem;    /* 16px */
  font-weight: 400;
}

/* Caption */
.text-caption {
  font-size: 0.625rem;  /* 10px */
  line-height: 0.875rem; /* 14px */
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Spacing

### Scale

```css
/* Base unit: 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Common Patterns

```css
/* Container padding */
padding: 1.5rem;  /* 24px - mobile */
padding: 2rem;    /* 32px - desktop */

/* Section spacing */
margin-bottom: 2rem;   /* 32px - mobile */
margin-bottom: 3rem;   /* 48px - desktop */

/* Card padding */
padding: 1.5rem;  /* 24px */

/* Button padding */
padding: 0.75rem 1.5rem;  /* 12px 24px */

/* Input padding */
padding: 0.5rem 0.75rem;  /* 8px 12px */
```

---

## Border Radius

```css
--radius-sm: 0.5rem;   /* 8px - small elements */
--radius-md: 0.75rem;  /* 12px - buttons */
--radius-lg: 1rem;     /* 16px - cards */
--radius-xl: 1.5rem;   /* 24px - large cards */
--radius-full: 9999px; /* circles/pills */
```

---

## Shadows

### Elevation System

```css
/* Level 1 - Subtle */
box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Level 2 - Card */
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1),
            0 1px 2px -1px rgb(0 0 0 / 0.1);

/* Level 3 - Raised */
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Level 4 - Modal */
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
            0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Level 5 - Popover */
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Glow Effect */
box-shadow: 0 0 0 3px rgb(139 92 246 / 0.2),
            0 8px 16px -4px rgb(139 92 246 / 0.3);
```

---

## Component Patterns

### Card

```tsx
<div className="
  bg-white dark:bg-zinc-900
  border border-zinc-200 dark:border-zinc-800
  rounded-2xl
  p-6
  shadow-lg shadow-zinc-200/50 dark:shadow-zinc-950/50
  hover:shadow-xl
  transition-shadow
">
  {/* Content */}
</div>
```

### Button - Primary

```tsx
<button className="
  px-6 py-3
  bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600
  text-white
  font-semibold
  rounded-xl
  shadow-lg shadow-violet-500/20
  hover:shadow-xl hover:shadow-violet-500/30
  active:scale-98
  transition-all
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Click Me
</button>
```

### Button - Secondary

```tsx
<button className="
  px-6 py-3
  bg-zinc-100 dark:bg-zinc-800
  text-zinc-900 dark:text-zinc-100
  font-medium
  rounded-xl
  border border-zinc-200 dark:border-zinc-700
  hover:bg-zinc-200 dark:hover:bg-zinc-700
  active:scale-98
  transition-all
">
  Secondary
</button>
```

### Input

```tsx
<input className="
  w-full
  px-3 py-2
  bg-white dark:bg-zinc-800
  border border-zinc-300 dark:border-zinc-700
  rounded-lg
  text-sm
  text-zinc-900 dark:text-zinc-100
  placeholder:text-zinc-500
  focus:ring-2 focus:ring-violet-500
  focus:border-transparent
  transition-all
" />
```

### Badge

```tsx
<span className="
  inline-flex items-center gap-1.5
  px-2 py-1
  bg-emerald-500/10
  border border-emerald-500/20
  text-emerald-700 dark:text-emerald-400
  text-xs font-medium
  rounded-full
">
  <div className="w-1 h-1 rounded-full bg-emerald-500" />
  Active
</span>
```

### Status Indicator

```tsx
{/* Live Pulse */}
<div className="
  w-1.5 h-1.5
  rounded-full
  bg-emerald-500
  animate-pulse
" />

{/* Static Dot */}
<div className="
  w-1 h-1
  rounded-full
  bg-violet-500
" />
```

---

## Animation Patterns

### Transitions

```tsx
{/* Standard transition */}
className="transition-all duration-200"

{/* Color transition */}
className="transition-colors duration-150"

{/* Transform transition */}
className="transition-transform duration-300"

{/* Shadow transition */}
className="transition-shadow duration-200"
```

### Hover Effects

```tsx
{/* Lift */}
className="hover:scale-102 hover:-translate-y-1"

{/* Glow */}
className="hover:shadow-xl hover:shadow-violet-500/30"

{/* Color shift */}
className="hover:text-violet-600 dark:hover:text-violet-400"

{/* Background */}
className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
```

### Framer Motion Presets

```tsx
{/* Fade in */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>

{/* Slide up */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
/>

{/* Scale in */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
/>

{/* Spring */}
<motion.div
  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
/>

{/* Stagger children */}
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.div>
```

---

## Layout Patterns

### Container

```tsx
<div className="
  max-w-7xl
  mx-auto
  px-6 lg:px-8
">
  {/* Content */}
</div>
```

### Grid - Bento

```tsx
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4 lg:gap-5
">
  {/* Cards with variable spans */}
  <div className="lg:col-span-2 lg:row-span-2" />
  <div className="lg:col-span-2" />
  <div /> {/* 1x1 default */}
</div>
```

### Flex - Center

```tsx
<div className="
  flex
  items-center
  justify-center
  min-h-screen
">
  {/* Centered content */}
</div>
```

### Stack

```tsx
<div className="space-y-4">
  {/* Vertically stacked items */}
</div>

<div className="space-x-4">
  {/* Horizontally stacked items */}
</div>
```

---

## Responsive Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Tablet */
md: 768px   /* Small desktop */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Usage Example

```tsx
<div className="
  text-sm          /* Mobile: 14px */
  lg:text-base     /* Desktop: 16px */
  px-4             /* Mobile: 16px padding */
  lg:px-8          /* Desktop: 32px padding */
  grid-cols-1      /* Mobile: 1 column */
  md:grid-cols-2   /* Tablet: 2 columns */
  lg:grid-cols-3   /* Desktop: 3 columns */
">
```

---

## Accessibility

### Focus States

```tsx
className="
  focus:outline-none
  focus:ring-2
  focus:ring-violet-500
  focus:ring-offset-2
  focus:ring-offset-white
  dark:focus:ring-offset-zinc-900
"
```

### Color Contrast

```
✅ Primary text on white: 15.67:1 (AAA)
✅ Secondary text on white: 7.37:1 (AAA)
✅ White text on violet-600: 4.51:1 (AA)
✅ Emerald-700 on emerald-50: 7.81:1 (AAA)
```

### Screen Reader

```tsx
<span className="sr-only">
  Loading...
</span>
```

---

## Best Practices

### DO ✅

- Use semantic HTML
- Maintain consistent spacing
- Apply hover states to interactive elements
- Use transitions for smooth UX
- Keep color palette limited
- Test in both light and dark modes
- Ensure minimum 4.5:1 contrast ratio

### DON'T ❌

- Mix spacing scales
- Overuse animations
- Use more than 3 brand colors
- Forget hover states
- Ignore dark mode
- Skip focus states
- Use arbitrary values

---

## Quick Reference

### Most Used Classes

```tsx
/* Spacing */
p-6          /* Padding: 24px */
space-y-5    /* Gap: 20px vertical */
gap-4        /* Grid gap: 16px */

/* Typography */
text-sm font-medium               /* Label */
text-zinc-900 dark:text-zinc-100  /* Primary text */
text-zinc-600 dark:text-zinc-400  /* Secondary text */

/* Borders */
border border-zinc-200 dark:border-zinc-800
rounded-xl   /* Border radius: 12px */

/* Backgrounds */
bg-white dark:bg-zinc-900
bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600

/* Effects */
shadow-lg shadow-zinc-200/50 dark:shadow-zinc-950/50
backdrop-blur-xl
hover:scale-102
transition-all
```

---

## Component Library Mapping

If you want to add shadcn/ui or Radix UI:

```tsx
/* Our System → shadcn/ui */
Button (Primary) → Button variant="default"
Button (Secondary) → Button variant="outline"
Card → Card
Badge → Badge
Input → Input
```

---

This design system ensures **consistency, scalability, and premium quality** across your entire application! 🎨
