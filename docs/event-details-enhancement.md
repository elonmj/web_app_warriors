# Event Details Page Enhancement Plan

## 1. Hero Section

### Event Header
```tsx
<div className="relative">
  {/* Background with gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-r from-amethyste-500/10 to-amethyste-600/10 dark:from-amethyste-900/20 dark:to-amethyste-800/20" />
  
  <div className="relative px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {/* Event Title */}
        <h1 className="text-3xl font-bold text-onyx-900 dark:text-white">
          {event.name}
        </h1>
        
        {/* Event Status */}
        <div className="mt-2 flex items-center gap-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
            ${event.status === "open"
              ? "bg-green-100 text-green-800 ring-1 ring-green-600/20 dark:bg-green-900/30 dark:text-green-200"
              : "bg-onyx-100 text-onyx-800 ring-1 ring-onyx-600/20 dark:bg-onyx-800 dark:text-onyx-200"
            }`}
          >
            {event.status === "open" ? "Active" : "Closed"}
          </span>
          
          {/* Event Type Badge */}
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
            bg-amethyste-100 text-amethyste-800 ring-1 ring-amethyste-600/20 
            dark:bg-amethyste-900/30 dark:text-amethyste-200">
            {event.type}
          </span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-onyx-900
          shadow-sm ring-1 ring-inset ring-onyx-300 hover:bg-onyx-50 dark:bg-onyx-800 dark:text-white 
          dark:ring-onyx-700 dark:hover:bg-onyx-700 transition-colors">
          <PencilIcon className="w-4 h-4 mr-2" />
          Edit Event
        </button>
        <button className="inline-flex items-center rounded-md bg-amethyste-500 px-3 py-2 text-sm font-semibold text-white
          shadow-sm hover:bg-amethyste-600 focus:outline-none focus:ring-2 focus:ring-amethyste-500 
          focus:ring-offset-2 dark:hover:bg-amethyste-600 transition-colors">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Match
        </button>
      </div>
    </div>
    
    {/* Event Meta Info */}
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-2 text-onyx-600 dark:text-onyx-300">
        <CalendarIcon className="w-5 h-5" />
        <span>Start: {format(event.startDate, "MMM d, yyyy")}</span>
      </div>
      <div className="flex items-center gap-2 text-onyx-600 dark:text-onyx-300">
        <CalendarIcon className="w-5 h-5" />
        <span>End: {format(event.endDate, "MMM d, yyyy")}</span>
      </div>
      <div className="flex items-center gap-2 text-onyx-600 dark:text-onyx-300">
        <UserGroupIcon className="w-5 h-5" />
        <span>{event.metadata.totalPlayers} Players</span>
      </div>
    </div>
  </div>
</div>
```

## 2. Stats Overview

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mt-6">
  {/* Active Matches */}
  <div className="rounded-lg border border-onyx-200 bg-white p-4 dark:border-onyx-800 dark:bg-onyx-900">
    <div className="flex items-center gap-2">
      <PlayIcon className="w-5 h-5 text-amethyste-500" />
      <h3 className="text-sm font-medium text-onyx-900 dark:text-white">Active Matches</h3>
    </div>
    <p className="mt-2 text-2xl font-semibold text-onyx-900 dark:text-white">
      {activeMatches}
    </p>
  </div>
  
  {/* Similar stat cards for: */}
  {/* - Total Matches */}
  {/* - Current Round */}
  {/* - Average Score */}
</div>
```

## 3. Content Tabs

```tsx
<div className="mt-6">
  <div className="border-b border-onyx-200 dark:border-onyx-800">
    <nav className="-mb-px flex gap-6">
      {/* Dynamic tabs with active state */}
      {['Matches', 'Rankings', 'Statistics'].map((tab) => (
        <button
          key={tab}
          className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors
            ${activeTab === tab
              ? "border-amethyste-500 text-amethyste-600 dark:text-amethyste-400"
              : "border-transparent text-onyx-600 hover:border-onyx-300 hover:text-onyx-700 
                dark:text-onyx-400 dark:hover:border-onyx-700 dark:hover:text-onyx-300"
            }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  </div>

  {/* Tab Content */}
  <div className="py-6">
    {/* Matches Tab */}
    <div className="grid gap-4">
      {matches.map((match) => (
        <div key={match.id} className="rounded-lg border border-onyx-200 bg-white p-4 
          hover:border-amethyste-200 transition-colors
          dark:border-onyx-800 dark:bg-onyx-900 dark:hover:border-amethyste-700">
          {/* Match content */}
        </div>
      ))}
    </div>

    {/* Rankings Tab */}
    <div className="overflow-hidden rounded-lg border border-onyx-200 bg-white 
      dark:border-onyx-800 dark:bg-onyx-900">
      {/* Rankings table */}
    </div>

    {/* Statistics Tab */}
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Stats cards/charts */}
    </div>
  </div>
</div>
```

## 4. Page Loading States

```tsx
{/* Skeleton loading state */}
<div className="animate-pulse">
  <div className="h-8 w-1/3 bg-onyx-200 rounded dark:bg-onyx-800" />
  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="h-4 bg-onyx-200 rounded dark:bg-onyx-800" />
    <div className="h-4 bg-onyx-200 rounded dark:bg-onyx-800" />
    <div className="h-4 bg-onyx-200 rounded dark:bg-onyx-800" />
  </div>
</div>
```

## 5. Error State

```tsx
<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
  <div className="flex">
    <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
        Error loading event
      </h3>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
        Unable to load event details. Please try again later.
      </p>
    </div>
  </div>
</div>
```

## Implementation Steps

1. Update EventHeader component with new design
2. Create new StatsOverview component
3. Implement tabbed interface for different data views
4. Add loading and error states
5. Ensure responsive design works
6. Verify dark mode support
7. Test accessibility features

## Key Features

1. Visual Hierarchy
   - Clear event title and status
   - Important metadata highlighted
   - Action buttons prominently displayed

2. Interactive Elements
   - Smooth transitions on hover
   - Clear active states for tabs
   - Responsive buttons

3. Data Organization
   - Tabbed interface for different views
   - Grid layout for stats and matches
   - Clean table design for rankings

4. User Experience
   - Loading states for better feedback
   - Error handling with clear messages
   - Consistent spacing and alignment

5. Accessibility
   - Proper heading structure
   - ARIA labels where needed
   - Keyboard navigation support