import { Heading, Body } from "@/components/ui/Typography";

const card =
  "bg-white dark:bg-onyx-900 p-6 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${card} space-y-3`}>
      <Heading.H3 className="text-onyx-900 dark:text-white">{title}</Heading.H3>
      <div className="space-y-3 text-onyx-700 dark:text-onyx-300">{children}</div>
    </section>
  );
}

const categoryRows: { name: string; range: string; className: string }[] = [
  { name: "ONYX", range: "< 1400", className: "bg-onyx-100 text-onyx-800 dark:bg-onyx-800 dark:text-onyx-100" },
  { name: "AMÉTHYSTE", range: "1400 – 1699", className: "bg-amethyste-100 text-amethyste-800 dark:bg-amethyste-800 dark:text-amethyste-100" },
  { name: "TOPAZE", range: "1700 – 1899", className: "bg-topaze-100 text-topaze-800 dark:bg-topaze-800 dark:text-topaze-100" },
  { name: "DIAMANT", range: "≥ 1900", className: "bg-diamant-100 text-diamant-800 dark:bg-diamant-800 dark:text-diamant-100" },
];

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-onyx-50 dark:bg-onyx-950">
      <div className="bg-white shadow dark:bg-onyx-900">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Heading.H1 className="text-onyx-900 dark:text-white">Règlement du club</Heading.H1>
          <Body.Text className="mt-2 text-onyx-500 dark:text-onyx-400">
            Word Warriors League — FAIZERS Scrabble Club
          </Body.Text>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Section title="Le principe">
          <Body.Text>
            La ligue tourne en continu — ce n&apos;est pas un tournoi ponctuel. Chaque joueur a
            une <strong>cote Elo</strong> permanente, qui mesure son niveau et n&apos;est jamais
            remise à zéro. En parallèle, un <strong>championnat de saison</strong> (12 semaines)
            classe les joueurs sur leurs performances récentes, avant de repartir de zéro à la
            saison suivante.
          </Body.Text>
        </Section>

        <Section title="Catégories">
          <Body.Text>
            La catégorie d&apos;un joueur dépend directement de sa cote Elo :
          </Body.Text>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoryRows.map((c) => (
              <div key={c.name} className="text-center">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${c.className}`}>
                  {c.name}
                </span>
                <Body.Caption className="block mt-1 text-onyx-500 dark:text-onyx-400">
                  {c.range}
                </Body.Caption>
              </div>
            ))}
          </div>
          <Body.Caption className="text-onyx-500 dark:text-onyx-400">
            La montée de catégorie est immédiate. La descente ne l&apos;est pas : il faut rester
            sous le seuil pendant deux rondes de suite pour être rétrogradé, histoire de ne pas
            changer de catégorie à chaque match quand on est juste à la limite.
          </Body.Caption>
        </Section>

        <Section title="Points de la saison">
          <Body.Text>
            Chaque match rapporte des <strong>Points de Rencontre (PR)</strong> pour le classement
            de la saison en cours :
          </Body.Text>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-onyx-100 dark:divide-onyx-800">
                <tr>
                  <td className="py-2 pr-4">Victoire</td>
                  <td className="py-2 font-semibold text-onyx-900 dark:text-white">3 PR</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Match nul</td>
                  <td className="py-2 font-semibold text-onyx-900 dark:text-white">1 PR</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Défaite</td>
                  <td className="py-2 font-semibold text-onyx-900 dark:text-white">0 PR</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Body.Text>
            En cas d&apos;égalité au classement, le départage se fait dans cet ordre : force des
            adversaires affrontés, puis écart de score cumulé (plafonné à ±100 par match, pour
            qu&apos;un seul gros score n&apos;écrase pas toute la saison), puis confrontation
            directe, puis nombre de victoires, puis cote Elo.
          </Body.Text>
        </Section>

        <Section title="Les rondes et les appariements">
          <Body.Text>
            Une nouvelle ronde est lancée tous les 3 à 5 jours. Avant chaque ronde, on
            vous demande de confirmer votre disponibilité :
          </Body.Text>
          <ul className="list-disc list-inside space-y-1">
            <li>Vous ne vous inscrivez pas : c&apos;est totalement neutre, aucun match ne vous est attribué et rien ne change à votre cote.</li>
            <li>Vous vous inscrivez : vous êtes apparié avec un adversaire de niveau proche (les joueurs proches au classement s&apos;affrontent en priorité).</li>
            <li>Deux joueurs ne se rejouent pas dans les 4 rondes qui suivent leur dernière rencontre.</li>
            <li>En cas de nombre impair d&apos;inscrits, un joueur reçoit un bye (3 PR, aucun impact sur le score ou la cote).</li>
          </ul>
        </Section>

        <Section title="Absences et forfaits">
          <Body.Text>Ne pas s&apos;inscrire à une ronde n&apos;a aucune conséquence. En revanche, une fois apparié :</Body.Text>
          <ul className="list-disc list-inside space-y-1">
            <li>Ne pas jouer son match dans le délai de la ronde compte comme un <strong>forfait</strong> — traité comme une défaite pour la cote et les PR.</li>
            <li>Si l&apos;adversaire ne se présente pas, vous gagnez par forfait (3 PR, gain de cote comme pour une victoire).</li>
            <li>3 forfaits dans la même saison entraînent une suspension d&apos;une ronde.</li>
          </ul>
        </Section>

        <Section title="Jouer un match et saisir le résultat">
          <ul className="list-disc list-inside space-y-1">
            <li>Les matchs se jouent sur <strong>Woogles.io</strong> (lexique français).</li>
            <li>Renseignez votre pseudo Woogles dans votre profil une seule fois — le site va ensuite chercher automatiquement le résultat de vos parties.</li>
            <li>Vous pouvez aussi saisir le score manuellement depuis la page du match si besoin.</li>
            <li>Un résultat saisi peut être contesté dans les 24 heures ; passé ce délai, il est définitif.</li>
          </ul>
        </Section>

        <Section title="Suivi personnel">
          <Body.Text>
            Chaque joueur peut suivre sa cote, son historique de matchs et l&apos;analyse
            détaillée de ses parties (coup par coup) depuis son profil, accessible via{" "}
            <strong>My Dashboard</strong>. Une vue d&apos;ensemble du club (activité, progression
            des catégories, points à travailler collectivement) est disponible dans{" "}
            <strong>Club Overview</strong>.
          </Body.Text>
        </Section>
      </div>
    </div>
  );
}
