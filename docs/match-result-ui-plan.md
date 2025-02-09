# Match Result UI Improvements

## Current Issues
- Need a way to return to event page after match result submission
- "Match result already submitted" message needs to be shown in a popup
- Current implementation doesn't show full match result details after submission

## Proposed Changes

### 1. MatchResultForm Component Updates
- Add `eventId` prop for navigation
- Add success state management
- Add navigation button to return to event page
- Integrate with next/navigation for client-side routing

```typescript
interface MatchResultFormProps {
  onSubmit: (score: [number, number]) => void;
  player1Name: string;
  player2Name: string;
  eventId: string; // New prop
}
```

### 2. New MatchResultPopup Component
Create a new component to show match result details in a popup:

```typescript
interface MatchResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  matchResult: {
    player1: { name: string; score: number };
    player2: { name: string; score: number };
    pr: number;
    pdi: number;
    ds: number;
  };
  eventId: string;
}
```

Features:
- Modal/popup UI
- Display match details
- "Return to Event" button
- Backdrop click to close

### 3. Implementation Steps

1. Create MatchResultPopup component with:
   - Modal overlay
   - Result display
   - Navigation button

2. Update MatchResultForm to:
   - Accept new eventId prop
   - Manage popup state
   - Show popup on successful submission

3. Update parent components to:
   - Pass eventId to MatchResultForm
   - Handle navigation state

### 4. Technical Considerations

- Use Next.js App Router for navigation
- Implement proper popup accessibility
- Ensure smooth transitions
- Handle loading states during navigation

### 5. UI/UX Details

Popup Design:
- Centered modal with overlay
- Clear match result display
- Prominent "Return to Event" button
- Clean, consistent styling with app theme

Navigation Flow:
1. Submit match result
2. Show confirmation popup with details
3. Provide option to return to event page
4. Handle popup dismissal properly

### 6. Benefits

- Better user feedback
- Clear navigation path
- Improved result visibility
- Consistent with modern UI patterns