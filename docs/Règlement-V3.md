# Règlement V3 — Word Warriors League

**Système de classement, d'appariement et d'évolution de la cote**
*Pour le club de Scrabble FAIZERS — ligue continue à cadence fixe*

> **Statut :** Version 3, remplace le règlement V2. Adopté le ___ / ___ / 2026 par le comité.
> **Ce qui change par rapport à la V2 :** la cadence devient fixe (3 jours) et automatique ; la phase d'inscription à la ronde est supprimée — tout le monde est apparié à chaque ronde ; ne pas jouer coûte des points ; la saison passe de 12 à 8 semaines.

---

## I. Objectifs et principes généraux

1. **Transparence et équité** — classement fondé sur des résultats réels, formules publiques, historique archivé.
2. **Éternité maîtrisée** — la ligue ne s'arrête jamais, mais elle est rythmée par des **saisons** afin que le classement ne fossilise pas et que chaque joueur garde un objectif atteignable.
3. **Jouer est la norme** — la ligue tourne toute seule tous les 3 jours. Ne pas jouer coûte des points ; jouer et perdre n'en coûte aucun. Le système sanctionne le désengagement, jamais la faiblesse.
4. **Responsabilité mutuelle** — un match non joué pénalise **les deux** joueurs. Faire jouer son adversaire fait partie du jeu.
5. **Deux mesures, deux rôles** — la **cote Elo** mesure la force (éternelle, traverse les saisons) ; les **Points de Rencontre** mesurent la performance saisonnière (remis à zéro chaque saison). Aucune des deux ne récompense le simple volume de matchs.
6. **Coaching intégré** — le système alimente le suivi du club (assiduité, progression de catégorie, axes d'entraînement) visible dans le Club Overview de l'application.

---

## II. Architecture à deux couches

| | **Couche 1 : Cote Elo** | **Couche 2 : Championnat saisonnier** |
|---|---|---|
| **Mesure** | La force du joueur | La performance sur la saison |
| **Durée de vie** | Éternelle, jamais remise à zéro | Remise à zéro à chaque saison |
| **Sert à** | Catégories (ONYX → DIAMANT), appariements, classement « officiel » du club | Podium de saison, enjeux, motivation |
| **Évolue par** | Formule Elo après chaque match joué | PR (3 / 1 / 0 / −1) après chaque ronde |

**Saison :** **8 semaines**, soit environ **19 rondes**. Six saisons par an. Le comité annonce les dates de début et de fin. Entre deux saisons, une semaine de pause est possible (matchs amicaux hors classement).

*Pourquoi 8 semaines et non 12 : à une ronde tous les 3 jours, une saison de 12 semaines compte 28 rondes. Un joueur décroché à mi-parcours doit alors supporter six semaines sans objectif atteignable. Huit semaines garantit qu'un nouveau départ n'est jamais à plus de deux mois.*

---

## III. Rythme des rondes

### A. Cadence fixe et automatique

Une ronde dure **exactement 3 jours** et se clôture à **20 h 00, heure du Bénin (UTC+1)**.

À l'instant de la bascule, le système, sans intervention humaine :

1. récupère sur Woogles les parties jouées pendant la fenêtre de la ronde ;
2. applique les résultats (PR, spread, cote) ;
3. applique la pénalité d'absence aux matchs non joués (§V) ;
4. met à jour les classements ;
5. clôture la ronde et **génère immédiatement les appariements de la suivante** ;
6. met en sommeil les joueurs concernés (§VI).

Il n'y a **aucune phase d'inscription**. Tout joueur actif est apparié à chaque ronde, automatiquement.

*Pourquoi la suppression de l'inscription préalable de la V2 : dans une ligue où l'absence est gratuite, chacun optimise en ne s'inscrivant que lorsque cela l'arrange, et la ligue se vide. La contrepartie de l'appariement obligatoire est que la sanction reste faible et bornée (§V, §VI).*

### B. Fenêtre de validité d'une partie

Chaque ronde possède un **instant de début et un instant de fin** enregistrés en dur. Une partie ne compte pour la ronde que si elle a été **commencée à l'intérieur de cette fenêtre**.

- Une partie dont Woogles ne fournit pas de date est **rejetée** — jamais acceptée par défaut.
- Une partie jouée avant le début ou après la fin de la fenêtre ne compte pas, même entre les deux joueurs appariés.
- **Si les deux joueurs jouent plusieurs parties pendant la ronde, seule la première fait foi.** Les suivantes sont amicales : elles n'entrent ni dans le classement, ni dans la cote, mais restent enregistrées et analysées dans le suivi coaching.

*Pourquoi cette rigueur : sans borne haute ni règle de première partie, deux joueurs peuvent rejouer jusqu'à ce que le résultat convienne, et une vieille partie peut être comptée à tort pour une ronde récente.*

### C. Relances

- **T−24 h** et **T−5 h** avant la clôture, le système établit la liste des matchs non joués et prépare le message de relance à diffuser dans le groupe du club.
- Chaque joueur dispose à tout moment d'un bouton **« Relancer mon adversaire »** qui ouvre une conversation WhatsApp pré-remplie.

La relance est une **convocation, jamais une accusation** : elle ne modifie aucun point et n'exonère de rien.

---

## IV. Système de notation

### A. Points de Rencontre (PR) — barème saisonnier

| Résultat | PR |
|---|---|
| Victoire | **3** |
| Match nul | **1** |
| Défaite | **0** |
| **Match non joué** | **−1** |
| Bye (nombre impair de joueurs) | **3** |

**Le seul écart qui compte : jouer et perdre (0) est toujours strictement meilleur que ne pas jouer (−1).** Un joueur faible a donc toujours intérêt à se présenter, et la défaite n'est jamais punie.

### B. Le Spread

Le **spread** d'un match est la différence brute de score, **plafonnée à ±100 points** :

```
spread = min(100, max(-100, score_joueur − score_adversaire))
```

Le **spread cumulé** d'un joueur est la somme de ses spreads sur la saison.

- **Match non joué :** aucun spread. Aucune partie, aucune performance à mesurer — on n'invente pas de score fictif.
- **Bye :** aucun spread.

### C. Départage saisonnier

En cas d'égalité de PR, dans l'ordre :

1. **Buchholz** — somme des PR finaux de tous les adversaires rencontrés dans la saison.
2. **Spread cumulé** (plafonné, voir IV.B).
3. **Confrontation directe** — uniquement si les joueurs à départager se sont tous affrontés dans la saison.
4. **Nombre de victoires** dans la saison.
5. **Cote Elo** au moment du départage.

---

## V. Le match non joué

À la clôture d'une ronde, si aucune partie valide n'a été trouvée entre deux joueurs appariés :

| | PR | Spread | Cote Elo |
|---|---|---|---|
| **Les deux joueurs** | **−1 chacun** | aucun | **inchangée** |

Sans exception et sans arbitrage automatique. Le silence de l'adversaire coûte un point à chacun : c'est ce qui rend chacun responsable d'aller chercher l'autre.

**Pourquoi la cote Elo n'est pas touchée.** L'Elo mesure la force, pas l'assiduité — et une pénalité sur une valeur éternelle produit exactement le découragement que ce règlement cherche à éviter. La V2 sanctionnait le forfait en cote pour empêcher qu'on esquive les adversaires dangereux : cet argument disparaît avec l'appariement obligatoire, puisque personne ne choisit plus ni son adversaire ni sa ronde. Cela évite aussi de gagner de la cote contre un joueur absent, ce qui n'apprend rien sur la force de personne.

**Recours.** Un joueur qui a réellement cherché à jouer sans réponse s'adresse au comité. L'administrateur peut **annuler la pénalité** de ce joueur : celui-ci repasse à 0 PR pour la ronde. Il ne reçoit **pas** les 3 points de la victoire — aucune partie n'a été jouée, donc aucun point de performance n'est distribué. L'adversaire conserve son −1.

---

## VI. Mise en sommeil

Un joueur qui accumule **3 absences consécutives** (soit 9 jours sans jouer ni répondre) passe au statut **« en sommeil »** :

- il n'est plus apparié et **cesse immédiatement de perdre des points** ;
- il reste visible au classement, signalé comme tel ;
- il revient sur décision de l'administrateur, ou automatiquement dès qu'il joue une partie de ligue.

**C'est le garde-fou central du règlement.** Une disparition, quelle que soit sa durée, coûte au maximum **−3 PR** : le système arrête de sanctionner dès qu'il a compris que le joueur n'est pas là. Personne ne peut donc se retrouver mathématiquement hors-course pour avoir été absent.

Le sommeil protège aussi les joueurs actifs : sans lui, un joueur parti trois semaines priverait un adversaire différent de sa partie tous les 3 jours.

*La règle V2 « 3 forfaits → suspension d'une ronde » est supprimée : la mise en sommeil la remplace, et une suspension serait aujourd'hui une double peine.*

---

## VII. Appariements et byes

### A. Algorithme — suisse par groupes de points

À chaque ronde, sur l'ensemble des joueurs actifs (non endormis) :

1. **Tri** : PR saisonniers décroissants, puis cote Elo décroissante.
2. **Groupes de points** : les joueurs à égalité de PR forment un groupe. On apparie moitié haute contre moitié basse du même groupe. Si un groupe est impair, le joueur restant « flotte » vers le groupe inférieur.
3. **Contrainte de re-match** : deux joueurs ne peuvent pas se rencontrer deux fois dans les **4 dernières rondes**. En cas de conflit, permutation avec le voisin le plus proche dans le groupe. Si l'effectif rend la contrainte insatisfiable, elle est relâchée à 3, puis 2 rondes — l'appariement a toujours une solution.

### B. Byes

Si le nombre de joueurs actifs est impair :

- Le bye est attribué au joueur **le moins bien classé n'ayant pas eu de bye dans les 3 dernières rondes**.
- Le bye rapporte **3 PR, aucun spread, aucun changement de cote**.

---

## VIII. Évolution de la cote Elo

### A. Formule

Après chaque match **joué** :

```
E₁ = E₀ + K × (W − We)
```

- **E₀** : cote avant le match (1000 pour tout nouveau joueur).
- **W** : résultat (1 victoire, 0.5 nul, 0 défaite).
- **We** : probabilité de victoire estimée : `We = 1 / (1 + 10^((E_adv − E₀) / 400))`.
- **Plancher : 800.**

Un match non joué et un bye ne modifient jamais la cote.

### B. Coefficient K

| Situation | K |
|---|---|
| Moins de 15 matchs joués (période provisoire) | **40** |
| Retour de sommeil — pendant 5 matchs | **30** |
| Régime normal | **20** |
| Cote ≥ 1900 (élite) | **10** |

### C. Pas de bonus de spread dans la cote

La cote est un Elo pur, à somme (quasi) nulle. L'ampleur des victoires est valorisée là où elle a sa place : le spread, au départage saisonnier.

### D. Inactivité

- La cote **ne se dégrade jamais** par inactivité : elle mesure la force.
- Un joueur en sommeil depuis **6 semaines** est masqué par défaut de la vue « joueurs actifs ».
- Un joueur ne peut figurer au podium de la saison s'il a joué moins de **1/3 des rondes** de celle-ci.

---

## IX. Classement de forme

En parallèle du classement de saison, l'application affiche en permanence un **classement des 10 dernières rondes**.

Il ne décerne aucun titre : c'est un instrument de motivation. Un joueur qui revient d'une absence y figure en tête en dix rondes au maximum, et a donc toujours quelque chose à gagner cette semaine, même si le titre de la saison lui échappe.

---

## X. Saisie, validation et litiges

1. **Résultats automatiques** : les scores sont lus sur Woogles, dans la fenêtre de la ronde (§III.B). Aucune saisie manuelle n'est nécessaire.
2. **Délai de contestation : 24 heures** après la clôture de la ronde. Passé ce délai, le résultat est définitif.
3. **Comité d'arbitrage** : tranche les litiges, annule les pénalités justifiées (§V) ; toute modification rétroactive est annotée dans l'historique.
4. **Archivage** : historique complet des rencontres, contestations et modifications, accessible aux administrateurs.

---

## XI. Catégories

| Catégorie | Cote |
|---|---|
| **ONYX** | E < 1400 |
| **AMÉTHYSTE** | 1400 ≤ E < 1700 |
| **TOPAZE** | 1700 ≤ E < 1900 |
| **DIAMANT** | E ≥ 1900 |

**Hystérésis anti yo-yo :**
- **Promotion : immédiate** dès que la cote atteint le seuil.
- **Rétrogradation : différée** — un joueur n'est rétrogradé que si sa cote est **sous le seuil − 25 points** à l'issue de **deux rondes consécutives**.

---

## XII. Paramètres du comité

| Paramètre | Valeur V3 | Section |
|---|---|---|
| Durée d'une ronde | **3 jours** | III.A |
| Heure de bascule | **20 h 00 (UTC+1, Bénin)** | III.A |
| Durée d'une saison | **8 semaines (~19 rondes)** | II |
| PR victoire / nul / défaite | 3 / 1 / 0 | IV.A |
| **PR match non joué** | **−1 (les deux joueurs)** | IV.A, V |
| PR bye | 3 | IV.A |
| Plafond de spread par match | ±100 | IV.B |
| Partie retenue si plusieurs dans la ronde | **la première** | III.B |
| Relances automatiques | T−24 h et T−5 h | III.C |
| **Absences consécutives avant sommeil** | **3** | VI |
| Fenêtre anti re-match | 4 rondes | VII.A |
| Fenêtre anti re-bye | 3 rondes | VII.B |
| K provisoire / retour / normal / élite | 40 / 30 / 20 / 10 | VIII.B |
| Seuil « période provisoire » | 15 matchs | VIII.B |
| Plancher de cote | 800 | VIII.A |
| Cote initiale | 1000 | VIII.A |
| Rondes minimum pour le podium | 1/3 des rondes de la saison | VIII.D |
| Classement de forme | 10 dernières rondes | IX |
| Délai de contestation | 24 h | X |
| Marge d'hystérésis (rétrogradation) | 25 points, 2 rondes | XI |

---

## XIII. Conclusion

La V2 avait bien séparé la force (Elo) de la performance (PR), mais elle avait rendu l'absence gratuite — dans une ligue où chacun choisit ses rondes, la ligue finit par ne plus tourner. La V3 inverse le défaut par défaut : **la ligue tourne toute seule tous les 3 jours, tout le monde est apparié, et ne pas jouer coûte un point.**

Pour que cette contrainte reste supportable, trois protections sont inscrites dans le règlement : la sanction ne touche jamais la cote, elle s'arrête d'elle-même après trois absences, et la saison redémarre toutes les huit semaines. **La cote dit qui est fort, la saison dit qui s'engage, et personne n'est jamais mathématiquement éliminé par une absence.**

---

## Annexe A — Ce qui change depuis la V2

| Règle | V2 | V3 |
|---|---|---|
| Cadence | 3 à 5 jours, au choix du comité | **3 jours, fixe et automatique** |
| Inscription à la ronde | Obligatoire, absence neutre | **Supprimée, tout le monde apparié** |
| Ne pas jouer | 0 PR si non inscrit, forfait si apparié | **−1 PR pour les deux, sans exception** |
| Forfait et cote | Compté comme une défaite | **Cote inchangée** |
| Spread de forfait | ±50 | **Aucun** |
| Saison | 12 semaines (~28 rondes) | **8 semaines (~19 rondes)** |
| Absence prolongée | Suspension après 3 forfaits | **Sommeil après 3 absences consécutives** |
| Plusieurs parties dans la ronde | Non traité | **La première fait foi** |
| Classement de forme | Inexistant | **10 dernières rondes** |

---

## Annexe B — Notes d'implémentation

État constaté au 25/07/2026, à traiter pour appliquer la V3.

### Corrections de bugs — ✅ faites le 25/07/2026

| Problème | Où | Correctif appliqué |
|---|---|---|
| Une partie Woogles sans `created_at` contournait le filtre de date et était acceptée quel que soit son âge | `WooglesService` | Toute partie sans date est rejetée (`isGameWithinWindow`) |
| Aucune borne haute sur la fenêtre — seul « après le début » était vérifié | `WooglesService` | Fenêtre semi-ouverte `[début, fin[` appliquée aux deux bornes |
| Repli sur `event.startDate` si la date de ronde manquait → acceptait n'importe quelle partie depuis la création de la ligue | `cron/auto-resolve`, `events/[id]/sync` | `resolveRoundWindow` lève une erreur au lieu de deviner ; l'événement est ignoré et l'erreur remontée |
| `games.find()` retenait la partie la plus récente de la fenêtre | `WooglesService` | `findMatchInWindow` retient la **première** de la fenêtre |
| Validation d'un score saisi à la main **sans aucune borne de date** (découvert en cours de route) | `matches/result` | La fenêtre de la ronde du match est désormais obligatoire |
| Délai de forfait à 7 jours alors que la ronde en dure 3 | `cron/auto-resolve`, `events/[id]/sync` | Le délai **est** la fin de fenêtre (`isRoundOver`) ; paramètre `?days=` supprimé |
| Fuseau implicite (Vercel en UTC, club en UTC+1) | partout | `src/lib/roundWindow.ts` est le seul endroit qui convertit |

Nouveau module : **`src/lib/roundWindow.ts`** — source unique du temps de la ligue (fuseau, heure de bascule, durée de ronde). 30 tests (`src/lib/__tests__/roundWindow.test.ts`, `WooglesService.test.ts`).

`RoundStats` porte désormais `startsAt` / `endsAt`, figés à la génération des appariements. Les rondes créées avant la V3 n'ont que `date` : leur fin est déduite, sans jamais retomber sur l'événement.

### Chantiers V3

| Règle | État |
|---|---|
| PR 3/1/0 | ✅ Déjà en place |
| **PR −1 pour match non joué** | ✅ `scoring.ts` (`MISSED_ROUND_PR`), `MatchService`, `RankingService` |
| **Cote inchangée en cas d'absence** | ✅ `processDoubleForfeit` ne touchait déjà pas la cote |
| **Une absence ne compte ni comme match joué ni dans le Buchholz** | ✅ `RankingService` |
| **Bascule automatique tous les 3 jours** | ✅ Cron `0 19 * * *` UTC = 20 h Bénin, clôture + assiduité + génération de la ronde suivante |
| **Suppression de la phase de disponibilité** | ✅ Route supprimée, pool = tous sauf les endormis |
| **Statut « en sommeil » + compteur d'absences** | ✅ `AttendanceService`, champs sur `Player`, onglet admin « Assiduité » |
| **Annulation admin d'une pénalité** | ✅ `POST /api/matches/[eventId]/[matchId]/waive` |
| **Réveil admin d'un joueur** | ✅ `POST /api/players/[id]/wake` |
| Saisons de 8 semaines | ❌ **Non fait** — entité inexistante, ne bloque pas le lancement |
| Classement de forme (10 rondes) | ❌ **Non fait** |
| Bouton « Relancer » (lien `wa.me`) | ❌ **Non fait** — nécessite un champ téléphone sur `Player` |
| Relances automatiques T−24 h / T−5 h | ❌ **Non fait** — nécessite le canal WhatsApp |
| Spread plafonné ±100 | ⚠️ Anciens matchs en DS pourcentage ; recalculer depuis `result.score` |
| Buchholz | ✅ En place (`RankingService`) |
| K par expérience | ⚠️ Bug V2 non corrigé : K=30 pour tous |
| Plancher de cote 800 | ❌ Toujours à 1000 |
| Hystérésis catégories | ⚠️ Marge −25 en place, condition « 2 rondes consécutives » non implémentée |

**Conséquence des chantiers non faits :** la ligue tourne et le barème s'applique, mais les PR ne sont pas encore remis à zéro tous les 2 mois (pas de saisons) et les relances restent manuelles (message WhatsApp à poster par l'administrateur).

### Limite structurelle à connaître

L'application n'a **aucune authentification joueur** — un mot de passe admin unique protège `/admin/*`, tout le reste est public et anonyme. Aucun bouton actionné par un joueur ne peut donc décider d'une attribution de points : n'importe qui pourrait cliquer sous n'importe quel nom. C'est la raison pour laquelle la V3 pénalise les deux joueurs sans exception et confie les recours à l'administrateur, seul acteur authentifié. Le jour où une connexion joueur existera, un bouton d'exonération vérifiable pourra être réintroduit.
