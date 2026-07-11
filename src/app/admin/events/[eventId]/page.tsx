"use client";

import React, { useEffect, useState } from 'react'; // Import React
import { useParams, useRouter } from 'next/navigation';
import { Event } from '@/types/Event';
import { Player } from '@/types/Player';
import { EventStatus } from '@/types/Enums'; // Import EventStatus enum

import { Button } from "@/components/ui/button"; // Shadcn UI Button
import { Input } from "@/components/ui/input"; // Shadcn UI Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Shadcn UI Select
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Shadcn UI Card
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Shadcn UI Tabs
import { toast } from "sonner"; // Sonner for toasts
import AdminPasswordDialog from '@/app/components/AdminPasswordDialog'; // Import password dialog
import { AUTH_ERROR_MESSAGES } from '@/lib/auth'; // Import auth error messages

// Instantiate repositories


type TabValue = "overview" | "participants"; // Define possible tab values
type PasswordAction = 'add' | 'remove' | 'start' | 'sync'; // Define possible password actions

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  // const [allPlayers, setAllPlayers] = useState<Player[]>([]); // Removed: Fetching all players initially
  const [participantDetails, setParticipantDetails] = useState<Player[]>([]); // Added: To store details of current participants
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedPlayerId, setSelectedPlayerId] = useState<string>(''); // Removed: Replaced by selectedPlayerToAdd
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Player[]>([]); // Added: For search results
  const [isSearching, setIsSearching] = useState<boolean>(false); // Added: Loading state for search
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState<Player | null>(null); // Added: Player object to add
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  // State for password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordAction, setPasswordAction] = useState<PasswordAction | null>(null); // Use the PasswordAction type
  const [passwordActionPayload, setPasswordActionPayload] = useState<any>(null); // Store player ID for action
  const [isStartingEvent, setIsStartingEvent] = useState<boolean>(false); // New state for start action loading
  const [isSyncingEvent, setIsSyncingEvent] = useState<boolean>(false); // New state for sync action loading

  // Player search function
  const searchPlayers = async (query: string): Promise<Player[]> => {
    console.log('[UI] Starting player search:', {
      query,
      url: `/api/players/search?q=${encodeURIComponent(query)}`
    });

    const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }
    const results: Player[] = await response.json();
    console.log('[UI] Raw search results:', results);
    return results;
  };

  // Event loading effect
  useEffect(() => {
    if (!eventId) {
      setError("Event ID is missing.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      setParticipantDetails([]); // Reset participant details
      try {
        console.log(`[UI] Fetching event data for ID: ${eventId}`);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }
        const eventData = await response.json();
        console.log("[UI] Fetched event data:", eventData);

        setEvent(eventData);

        // Fetch details for existing participants if any
        if (eventData.playerIds && eventData.playerIds.length > 0) {
          console.log(`[UI] Fetching details for ${eventData.playerIds.length} participants...`);
          const playersResponse = await fetch('/api/players');
          if (!playersResponse.ok) {
            throw new Error('Failed to fetch players');
          }
          const allPlayers = await playersResponse.json();
          const participants = allPlayers.filter((p: Player) => eventData.playerIds.includes(p.id));
          console.log("[UI] Fetched participant details:", participants);
          setParticipantDetails(participants);
        }

      } catch (err) {
        console.error("[UI] Error fetching event/participant details:", err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load event data';
        setError(errorMessage);
        toast.error(`Error loading event data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [eventId]);

  // Debounced search effect
  useEffect(() => {
    console.log('[UI] Search term changed:', {
      term: searchTerm,
      isEmpty: !searchTerm.trim(),
      currentParticipants: event?.playerIds
    });

    // Clear previous results and selection
    setSearchResults([]);
    setSelectedPlayerToAdd(null);

    if (!searchTerm.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const results = await searchPlayers(searchTerm);
        // Filter out current participants
        const currentParticipantIds = event?.playerIds || [];
        const filteredResults = results.filter(p => !currentParticipantIds.includes(p.id));
        console.log('[UI] Filtered results:', {
          total: results.length,
          filtered: filteredResults.length,
          excluded: results.length - filteredResults.length
        });
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('[UI] Search error:', err);
        toast.error(err instanceof Error ? err.message : 'Player search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, event?.playerIds]);

  // --- Password Handling ---
  const triggerPasswordDialog = (action: PasswordAction, payload: any) => { // Use PasswordAction type
    setPasswordAction(action);
    setPasswordActionPayload(payload);
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!passwordAction || !passwordActionPayload) return;

    try {
      // Verify password first (optional but recommended)
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
      });
      if (!verifyResponse.ok) throw new Error(AUTH_ERROR_MESSAGES.INVALID_PASSWORD);

      // Proceed with the original action
      if (passwordAction === 'add') {
        await executeAddPlayer(password, passwordActionPayload);
      } else if (passwordAction === 'remove') {
        await executeRemovePlayer(password, passwordActionPayload);
      } else if (passwordAction === 'start') {
        await executeStartEvent(password);
      } else if (passwordAction === 'sync') {
        await executeSyncEvent(password);
      }
      setShowPasswordDialog(false); // Close dialog on success
    } catch (error) {
      console.error(`Error during ${passwordAction} action:`, error);
      toast.error(`Error: ${error instanceof Error ? error.message : `Failed to execute ${passwordAction} action`}`);
    } finally {
       // Reset state regardless of success/failure?
       // setPasswordAction(null);
       // setPasswordActionPayload(null);
    }
  };
  // --- End Password Handling ---


  // --- Player Actions ---
  const handleAddPlayerClick = () => {
    if (!selectedPlayerToAdd || !event) { // Use selectedPlayerToAdd
      toast.warning('Please select a player to add.');
      return;
    }
    triggerPasswordDialog('add', selectedPlayerToAdd.id); // Pass ID
  };

  const executeAddPlayer = async (password: string, playerIdToAdd: string) => {
    if (!event) return; // Should not happen if button is enabled, but check anyway

    try {
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password // Send password in header
        },
        body: JSON.stringify({ playerId: playerIdToAdd })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      // Optimistic update
      const newPlayerIds = [...(event.playerIds || []), playerIdToAdd];
      setEvent({ ...event, playerIds: newPlayerIds });
      setSelectedPlayerToAdd(null); // Clear selected player object
      setSearchTerm(''); // Clear search term
      setSearchResults([]); // Clear search results
      toast.success('Player added successfully!'); // Use toast

      // Re-fetch participant details to include the newly added one
      const playersResponse = await fetch('/api/players');
      if (playersResponse.ok) {
        const allPlayers = await playersResponse.json();
        const updatedParticipants = allPlayers.filter((p: Player) => newPlayerIds.includes(p.id));
        setParticipantDetails(updatedParticipants);
      }

    } catch (error) {
      console.error("Error adding player:", error);
      // Error is handled in handlePasswordConfirm, re-throw to signal failure
      throw error;
    }
  };

  const handleRemovePlayerClick = (playerIdToRemove: string) => {
     if (!event) return;
     // Find participant details from the state
     const participant = participantDetails.find(p => p.id === playerIdToRemove);
     const confirmation = confirm(`Are you sure you want to remove ${participant ? participant.name : 'this player'} from the event?`);
     if (!confirmation) return;
     triggerPasswordDialog('remove', playerIdToRemove);
  };

  const executeRemovePlayer = async (password: string, playerIdToRemove: string) => {
     if (!event) return; // Should not happen

    try {
      const response = await fetch(`/api/events/${eventId}/participants/${playerIdToRemove}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': password // Send password in header
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      // Optimistic update
      const newPlayerIds = (event.playerIds || []).filter(id => id !== playerIdToRemove);
      setEvent({ ...event, playerIds: newPlayerIds });
      // Update participant details state
      setParticipantDetails(prevDetails => prevDetails.filter(p => p.id !== playerIdToRemove));
      toast.success('Player removed successfully!'); // Use toast

    } catch (error) {
      console.error("Error removing player:", error);
      // Error is handled in handlePasswordConfirm, re-throw to signal failure
      throw error;
    }
  };
  // --- End Player Actions ---


  // --- Event Actions ---
  const executeStartEvent = async (password: string) => {
    if (!event) return;
    setIsStartingEvent(true);
    console.log(`[UI] Attempting to start event ${eventId} with password.`);
    toast.info("Attempting to start event..."); // Placeholder feedback

    try {
      // TODO: Implement API call to POST /api/events/[eventId]/start
      const response = await fetch(`/api/events/${eventId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to start event: ${response.status}`);
      }

      const updatedEventData = await response.json(); // Assuming the API returns the updated event

      // --- Success ---
      console.log("[UI] Event started successfully:", updatedEventData);
      setEvent(updatedEventData); // Update local event state
      toast.success("Event started successfully! Round 1 pairings generated.");
      // Optionally navigate or switch tab
      // setActiveTab("rounds"); // If a rounds tab exists

    } catch (error) {
      console.error("Error starting event:", error);
      // Error is handled in handlePasswordConfirm, re-throw to signal failure
      throw error; // Re-throw so handlePasswordConfirm can show the toast
    } finally {
      setIsStartingEvent(false);
    }
  };

  const handleStartEventClick = () => {
    if (!event || event.status !== EventStatus.OPEN) {
      toast.warning("Event cannot be started in its current state.");
      return;
    }
     const confirmation = confirm(`Are you sure you want to start the event \"${event.name}\"? This will generate Round 1 pairings and cannot be undone easily.`);
     if (!confirmation) return;

    triggerPasswordDialog('start', eventId); // Use eventId or null as payload if not needed
  };

  const executeSyncEvent = async (password: string) => {
    if (!event) return;
    setIsSyncingEvent(true);
    console.log(`[UI] Attempting to sync event ${eventId} with password.`);
    const toastId = toast.loading("Syncing matches and resolving weekly duels...");

    try {
      const response = await fetch(`/api/events/${eventId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to sync event: ${response.status}`);
      }

      const data = await response.json();

      // --- Success ---
      console.log("[UI] Event sync complete:", data);
      toast.success(data.message || "Event synced successfully!", { id: toastId });

      // Re-fetch event data
      const eventResponse = await fetch(`/api/events/${eventId}`);
      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setEvent(eventData);

        if (eventData.playerIds && eventData.playerIds.length > 0) {
          const playersResponse = await fetch('/api/players');
          if (playersResponse.ok) {
            const allPlayers = await playersResponse.json();
            const participants = allPlayers.filter((p: Player) => eventData.playerIds.includes(p.id));
            setParticipantDetails(participants);
          }
        }
      }
    } catch (error) {
      console.error("Error syncing event:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Failed to sync event"}`, { id: toastId });
      throw error;
    } finally {
      setIsSyncingEvent(false);
    }
  };
  // --- End Event Actions ---

  // Helper to get player name from ID using participantDetails state
  const getPlayerName = (playerId: string): string => {
    const player = participantDetails.find(p => p.id === playerId);
    return player ? player.name : `Loading... (ID: ${playerId})`; // Indicate loading if details not yet fetched
  };

  // Removed availablePlayersToAdd - using searchResults state now

  // Format dates for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {/* Consider using a Shadcn Skeleton component if installed */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amethyste-500"></div>
      </div>
    );
  }

  if (error && !event) { // Show error prominently only if event failed to load
    return (
      <div className="container mx-auto p-4 py-12 text-center">
        <Card className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Error Loading Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/admin/events')} variant="destructive">
              Back to Events List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) { // Handles the case where loading finished but event is still null
    return (
       <div className="container mx-auto p-4 py-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested event could not be loaded or does not exist.</p>
             <Button onClick={() => router.push('/admin/events')}>
              Back to Events List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  // --- End Render Logic ---


  // --- Component Return ---
  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
              {/* Start Event Button */}
              {event.status === EventStatus.OPEN && (
                <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Event Actions</h4>
                  <Button 
                    onClick={handleStartEventClick}
                    disabled={isStartingEvent}
                    variant="secondary" // Or choose another appropriate variant
                  >
                    {isStartingEvent ? 'Starting...' : 'Start Event & Generate Round 1'}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Starts the event, generates the first round pairings, and changes status to 'IN_PROGRESS'.
                  </p>
                </div>
              )}
              {event.status === EventStatus.IN_PROGRESS && (
                <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Event Actions</h4>
                  <Button 
                    onClick={() => triggerPasswordDialog('sync', eventId)}
                    disabled={isSyncingEvent}
                    variant="secondary"
                  >
                    {isSyncingEvent ? 'Syncing...' : 'Sync & Auto-Resolve Matches'}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Queries ISC for results of pending matches, and automatically declares unplayed matches past the 7-day deadline as double forfeits.
                  </p>
                </div>
              )}
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Manage Event: {event.name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {event.id}</p>
      </header>

      {/* Tabs Navigation & Content */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants ({event.playerIds?.length || 0})</TabsTrigger>
          {/* Add more tabs here later e.g. Rounds, Settings */}
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic information about the event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</p>
                  <p className="text-md font-semibold text-gray-900 dark:text-white">{event.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                  {/* Corrected status comparison */}
                  <p className={`text-md font-semibold ${event.status === EventStatus.CLOSED ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {event.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</p>
                  <p className="text-md text-gray-900 dark:text-white">{event.type || 'N/A'}</p>
                </div>
                 <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Rounds</p>
                  {/* Corrected access to totalRounds */}
                  <p className="text-md text-gray-900 dark:text-white">{event.metadata?.totalRounds ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
                  {/* Corrected date formatting */}
                  <p className="text-md text-gray-900 dark:text-white">{formatDate(event.startDate ? new Date(event.startDate).toISOString() : undefined)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                  {/* Corrected date formatting */}
                  <p className="text-md text-gray-900 dark:text-white">{formatDate(event.endDate ? new Date(event.endDate).toISOString() : undefined)}</p>
                </div>
              </div>
               {/* Add more details as needed */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab Content */}
        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Manage Participants</CardTitle>
              <CardDescription>Add or remove players registered for this event.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Player Section */}
              <div className="mb-6 pb-6 border-b dark:border-gray-700">
                <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Add New Participant</h3>
                 <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                   <div className="w-full sm:flex-grow">
                     <label htmlFor="player-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Search Available Players
                     </label>
                     {/* Corrected Input onChange type */}
                     <Input
                       id="player-search"
                       type="text"
                       placeholder="Type to search..."
                       value={searchTerm}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                       className="mb-1" // Reduced margin
                     />
                     {/* Search Results List */}
                     <div className="relative">
                       {(!selectedPlayerToAdd && (isSearching || searchResults.length > 0 || (searchTerm && !isSearching && searchResults.length === 0))) && (
                         <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                           {isSearching ? (
                             <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">Searching...</div>
                           ) : searchResults.length > 0 ? (
                             <ul>
                               {searchResults.map((player) => (
                                 <li
                                   key={player.id}
                                   onClick={() => {
                                     setSelectedPlayerToAdd(player);
                                     // setSearchTerm(''); // Don't clear search term here, it resets the selection via useEffect
                                     setSearchResults([]); // Clear results to hide the list
                                   }}
                                   className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                 >
                                   {player.name} ({player.wooglesUsername || player.iscUsername || 'N/A'})
                                 </li>
                               ))}
                             </ul>
                           ) : (
                             <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">No matching players found.</div>
                           )}
                         </div>
                       )}
                     </div>
                      {/* Display selected player */}
                      {selectedPlayerToAdd && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          Selected: <span className="font-medium">{selectedPlayerToAdd.name}</span>
                        </div>
                      )}
                   </div>
                   <Button
                     onClick={handleAddPlayerClick}
                     disabled={!selectedPlayerToAdd} // Disable based on selectedPlayerToAdd object
                     className="w-full sm:w-auto whitespace-nowrap mt-2 sm:mt-0" // Adjust margin
                   >
                     Add Selected Player
                   </Button>
                 </div>
              </div>

              {/* Current Participants List */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                  Current Participants ({event.playerIds?.length || 0})
                </h3>
                {event.playerIds && event.playerIds.length > 0 ? (
                  <ul className="space-y-2">
                    {event.playerIds.map(playerId => (
                      <li key={playerId} className="flex justify-between items-center p-3 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-onyx-800/50">
                        <span className="text-gray-800 dark:text-gray-200">{getPlayerName(playerId)}</span>
                        <Button
                          variant="ghost" // Use Shadcn variants
                          size="sm"
                          onClick={() => handleRemovePlayerClick(playerId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No participants have been added to this event yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

       {/* Password Dialog */}
      <AdminPasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onConfirm={handlePasswordConfirm}
        title={
          passwordAction === 'sync'
            ? 'Confirm Match Sync & Resolution'
            : passwordAction === 'start'
            ? 'Confirm Event Start'
            : `Confirm ${passwordAction === 'add' ? 'Add' : 'Remove'} Player`
        }
        description={
          passwordAction === 'sync'
            ? 'Please enter your admin password to trigger match fetching from ISC and auto-resolve unplayed matches.'
            : passwordAction === 'start'
            ? 'Please enter your admin password to start the event and generate the first round pairings.'
            : `Please enter your admin password to ${passwordAction} the selected player ${passwordAction === 'add' ? 'to' : 'from'} the event.`
        }
      />
    </div>
  );
  // --- End Component Return ---
}
