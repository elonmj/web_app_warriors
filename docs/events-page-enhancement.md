# Events Page Enhancement Plan

## Header Section

### Title Area
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold bg-gradient-to-r from-amethyste-500 to-amethyste-600 bg-clip-text text-transparent">
      Events
    </h1>
    <p className="mt-1 text-sm text-onyx-600 dark:text-onyx-400">
      Manage and track your scrabble tournaments
    </p>
  </div>
  <button className="inline-flex items-center rounded-md bg-amethyste-500 px-4 py-2.5 text-sm font-semibold text-white
    shadow-sm hover:bg-amethyste-600 gap-2 group transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-amethyste-500 focus:ring-offset-2">
    <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
    Create Event
  </button>
</div>
```

### Events Grid
```tsx
<div className="mt-8">
  {/* Filter/Search Section (Optional) */}
  <div className="mb-6 flex items-center justify-between">
    <div className="flex gap-2">
      <button className="inline-flex items-center rounded-full px-3 py-1 text-sm text-onyx-700 hover:bg-onyx-100
        dark:text-onyx-300 dark:hover:bg-onyx-800 transition-colors">
        All Events
      </button>
      <button className="inline-flex items-center rounded-full px-3 py-1 text-sm text-onyx-700 hover:bg-onyx-100
        dark:text-onyx-300 dark:hover:bg-onyx-800 transition-colors">
        Active
      </button>
      <button className="inline-flex items-center rounded-full px-3 py-1 text-sm text-onyx-700 hover:bg-onyx-100
        dark:text-onyx-300 dark:hover:bg-onyx-800 transition-colors">
        Past
      </button>
    </div>
  </div>

  {/* Events Grid */}
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {events.map((event) => (
      <EventCard key={event.id} event={event} />
    ))}
  </div>
</div>
```

### Empty State
```tsx
<div className="text-center py-12">
  <div className="mx-auto w-24 h-24 rounded-full bg-onyx-100 flex items-center justify-center mb-4
    dark:bg-onyx-800">
    <CalendarIcon className="w-12 h-12 text-onyx-400" />
  </div>
  <h3 className="text-lg font-semibold text-onyx-800 dark:text-white">
    No events found
  </h3>
  <p className="mt-1 text-sm text-onyx-600 dark:text-onyx-400">
    Get started by creating a new event.
  </p>
  <button className="mt-4 inline-flex items-center rounded-md bg-amethyste-500 px-4 py-2 text-sm font-medium text-white
    hover:bg-amethyste-600 transition-colors">
    Create your first event
  </button>
</div>
```

### Error State
```tsx
<div className="rounded-lg border border-red-200 bg-red-50 p-4">
  <div className="flex">
    <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
      <p className="mt-1 text-sm text-red-700">
        Please try refreshing the page or contact support if the problem persists.
      </p>
    </div>
  </div>
</div>
```

## Layout Structure

1. Page Container
   - Max width using Tailwind's max-w-7xl
   - Proper padding with responsive adjustments
   - Background color using our theme

2. Header Section
   - Gradient text for the title
   - Subtle description text
   - Enhanced create button with icon

3. Events Grid
   - Responsive grid layout
   - Proper gap between cards
   - Optional filter/search section

4. Empty & Error States
   - Well-designed empty state with icon
   - User-friendly error message
   - Clear call-to-action buttons

## Animations and Transitions

1. Card Hover Effects
   - Subtle elevation change
   - Border color transition

2. Button Interactions
   - Scale transform on hover
   - Smooth background color transitions

3. Filter Buttons
   - Background color transitions
   - Active state indicators

## Implementation Steps

1. Update the page.tsx component with new layout structure
2. Add proper TypeScript types for all components
3. Implement responsive design patterns
4. Add animation and transition effects
5. Ensure dark mode support
6. Test across different viewport sizes
7. Verify accessibility standards