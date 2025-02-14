# Design Implementation Plan

## 1. Layout Updates (src/app/layout.tsx)

### Navigation Bar
- Update background color to `bg-amethyste-500`
- Change text colors to white for better contrast
- Update navigation links hover states to use `hover:bg-amethyste-700`
- Keep the admin button but update its style to be more distinct

```tsx
// Example nav styling
<nav className="bg-amethyste-500 text-white">
  {/* Content */}
</nav>
```

### Category Indicators
- Update the category badges to use the custom color palette:
  - ONYX: bg-onyx-100 text-onyx-800
  - AMÉTHYSTE: bg-amethyste-100 text-amethyste-800
  - TOPAZE: bg-topaze-100 text-topaze-800
  - DIAMANT: bg-diamant-100 text-diamant-800

## 2. Home Page Updates (src/app/page.tsx)

### Header Section
- Update the page title styling:
  ```tsx
  <h1 className="text-3xl font-bold text-onyx-800 dark:text-white">
    Events
  </h1>
  ```
- Style the Create Event button:
  ```tsx
  <button className="rounded-md bg-amethyste-500 px-4 py-2 text-sm font-medium text-white hover:bg-amethyste-700 focus:outline-none focus:ring-2 focus:ring-amethyste-500 focus:ring-offset-2">
    Create Event
  </button>
  ```

### Event Grid
- Update grid gap and responsive design:
  ```tsx
  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {/* Event cards */}
  </div>
  ```

### Empty State
- Style the empty state message:
  ```tsx
  <div className="mt-8 text-center text-onyx-500 dark:text-onyx-400">
    No events found. Create one to get started.
  </div>
  ```

## 3. Event Card Updates (src/app/components/ClientEventCard.tsx)

### Card Container
- Update the card styling with new shadow and hover effects:
  ```tsx
  <div className="block rounded-lg border border-onyx-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-onyx-800 dark:bg-onyx-900">
  ```

### Event Title
- Update the title styling:
  ```tsx
  <h3 className="text-xl font-semibold text-onyx-800 dark:text-white">
  ```

### Status Badge
- Style status badges using the theme colors:
  - Open: bg-green-100 text-green-800
  - Closed: bg-onyx-100 text-onyx-800

### Event Details
- Update the date and metadata styling:
  ```tsx
  <div className="mt-4 text-sm text-onyx-600 dark:text-onyx-400">
    {/* Date information */}
  </div>
  <div className="mt-2 text-xs text-onyx-500">
    {/* Metadata */}
  </div>
  ```

## 4. Match Result Form Updates (src/app/components/MatchResultForm.tsx)

### Form Container
- Use a clean white background with subtle border
- Add proper spacing between form elements
- Use consistent input styling

### Form Fields
- Style labels using onyx color
- Style input fields with consistent borders and focus states
- Add proper spacing between fields

### Submit Button
- Use amethyste color for the primary action
- Add hover and focus states

## 5. Dark Mode Support

Continue to maintain dark mode support across all components using the existing dark: variants but updated with the new color scheme:

- Dark backgrounds: dark:bg-onyx-900
- Dark text: dark:text-white, dark:text-onyx-400
- Dark borders: dark:border-onyx-800

## Implementation Steps

1. Update layout.tsx with new navigation styling
2. Update page.tsx with new header and grid styling
3. Update ClientEventCard.tsx with new card design
4. Update MatchResultForm.tsx with new form styling
5. Review and update any additional components that need styling adjustments
6. Test all components in both light and dark mode
7. Ensure responsive design works across all screen sizes
8. Verify accessibility requirements are met