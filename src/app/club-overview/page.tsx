import { Heading, Body } from "@/components/ui/Typography";
import ClubOverview from "@/app/components/ClubOverview";

export default function ClubOverviewPage() {
  return (
    <main className="min-h-screen p-8">
      <header className="mb-8 text-center">
        <Heading.H1>Club Overview</Heading.H1>
        <Body.Text className="mt-2 text-onyx-600 dark:text-onyx-400">
          Who's progressing, who needs a nudge, and which training gaps show up across the club.
        </Body.Text>
      </header>

      <div className="mx-auto max-w-6xl">
        <ClubOverview />
      </div>
    </main>
  );
}
