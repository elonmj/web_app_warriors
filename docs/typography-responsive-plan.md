# Typography and Responsive Design Enhancement Plan

## 1. Typography System

### Font Family
```css
/* Use DM Sans for its excellent readability */
--font-primary: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
```

### Font Scale (Following Major Third - 1.250)
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Font Weights
```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

## 2. Typography Classes

### Headings
```tsx
// In Tailwind config
fontSize: {
  h1: ['2.25rem', { lineHeight: '1.25', fontWeight: '700' }],
  h2: ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
  h3: ['1.5rem', { lineHeight: '1.375', fontWeight: '600' }],
  h4: ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
  h5: ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }],
  h6: ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
}
```

### Body Text
```tsx
text-base: ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
text-lg: ['1.125rem', { lineHeight: '1.625', fontWeight: '400' }],
text-sm: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
text-xs: ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
```

## 3. Responsive Breakpoints

### Custom Breakpoints
```js
screens: {
  'xs': '475px',     // Extra small devices
  'sm': '640px',     // Small devices
  'md': '768px',     // Medium devices
  'lg': '1024px',    // Large devices
  'xl': '1280px',    // Extra large devices
  '2xl': '1536px',   // 2X large devices
}
```

### Container Sizes
```js
container: {
  center: true,
  padding: {
    DEFAULT: '1rem',
    sm: '2rem',
    lg: '4rem',
    xl: '5rem',
  },
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
}
```

## 4. Responsive Design Patterns

### Grid System
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Content */}
}
```

### Spacing Scale
```js
spacing: {
  'xs': '0.25rem',   // 4px
  'sm': '0.5rem',    // 8px
  'md': '1rem',      // 16px
  'lg': '1.5rem',    // 24px
  'xl': '2rem',      // 32px
  '2xl': '2.5rem',   // 40px
  '3xl': '3rem',     // 48px
}
```

### Font Size Responsiveness
```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
  Heading
</h1>

<p className="text-sm sm:text-base md:text-lg">
  Body text
</p>
```

## 5. Implementation Steps

1. Update tailwind.config.js:
   - Add custom font family
   - Configure custom spacing
   - Set up breakpoints
   - Define typography scale

2. Create Typography Components:
   ```tsx
   // components/ui/Typography.tsx
   export const H1 = ({ children, className = '' }) => (
     <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${className}`}>
       {children}
     </h1>
   );
   // Similar for H2-H6, Paragraph, etc.
   ```

3. Update Layout Components:
   - Add proper container classes
   - Implement responsive padding
   - Add breakpoint-specific styles

4. Enhance Content Areas:
   - Apply responsive typography
   - Add proper spacing
   - Implement fluid layouts

5. Create Media Query Utilities:
   ```js
   export const screens = {
     sm: '640px',
     md: '768px',
     lg: '1024px',
     xl: '1280px',
   };
   ```

## 6. Component Updates

### Headers
```tsx
// Before
<h1 className="text-3xl">Title</h1>

// After
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
  Title
</h1>
```

### Cards
```tsx
// Before
<div className="p-4">

// After
<div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
```

### Lists
```tsx
// Before
<ul className="space-y-2">

// After
<ul className="space-y-2 sm:space-y-3 md:space-y-4">
```

## 7. Example Components

### Navigation
```tsx
<nav className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4">
  <div className="flex flex-col sm:flex-row items-center justify-between">
    <Logo className="h-8 sm:h-10" />
    <div className="mt-4 sm:mt-0 space-x-4">
      {/* Nav items */}
    </div>
  </div>
</nav>
```

### Content Section
```tsx
<section className="px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
  <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6">
    Section Title
  </h2>
  <p className="text-sm sm:text-base md:text-lg leading-relaxed">
    Content text
  </p>
</section>
```

## 8. Quality Checklist

1. Typography:
   - [ ] Consistent font scale across all components
   - [ ] Proper line heights for readability
   - [ ] Responsive font sizes
   - [ ] Adequate contrast ratios

2. Spacing:
   - [ ] Consistent spacing scale
   - [ ] Responsive padding and margins
   - [ ] Proper content density

3. Responsiveness:
   - [ ] No horizontal scrolling
   - [ ] Content fits viewport
   - [ ] Touch targets are appropriate size
   - [ ] Layouts adapt smoothly

4. Performance:
   - [ ] Font loading optimization
   - [ ] Layout shift minimization
   - [ ] Responsive image handling