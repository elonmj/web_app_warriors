import { Heading, Body } from "@/components/ui/Typography";
import PlayerPicker from "@/app/components/PlayerPicker";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <header className="mb-8 text-center">
        <Heading.H1>My Dashboard</Heading.H1>
        <Body.Text className="mt-2 text-onyx-600 dark:text-onyx-400">
          Pick your name to see your rating, matches and training insights.
        </Body.Text>
      </header>

      <PlayerPicker />
    </main>
  );
}
