# Règlement V2 — Word Warriors League

**Système de classement, d'appariement et d'évolution de la cote**
*Pour le club de Scrabble FAIZERS — ligue continue à cadence variable*

> **Statut :** Version 2, remplace le règlement V1. Adopté le ___ / ___ / 2026 par le comité.
> **Principe de conception :** la V1 était écrite pour un tournoi ; la V2 est écrite pour une **ligue éternelle** à rondes espacées de 3 à 5 jours, avec des joueurs qui ne sont pas toujours disponibles.

---

## I. Objectifs et principes généraux

1. **Transparence et équité** — classement fondé sur des résultats réels, formules publiques, historique archivé.
2. **Éternité maîtrisée** — la ligue ne s'arrête jamais, mais elle est rythmée par des **saisons** afin que le classement ne fossilise pas et que chaque joueur garde un objectif atteignable.
3. **Absence sans injustice** — ne pas être disponible pour une ronde est **neutre** ; être apparié et ne pas jouer est un **forfait** sanctionné. Ces deux situations ne sont plus confondues.
4. **Deux mesures, deux rôles** — la **cote Elo** mesure la force (éternelle, traverse les saisons) ; les **Points de Rencontre** mesurent la performance saisonnière (remis à zéro chaque saison). Aucune des deux ne récompense le simple volume de matchs.
5. **Coaching intégré** — le système alimente directement le suivi du club (activité, progression de catégorie, axes d'entraînement) visible dans le Club Overview de l'application.

---

## II. Architecture à deux couches

| | **Couche 1 : Cote Elo** | **Couche 2 : Championnat saisonnier** |
|---|---|---|
| **Mesure** | La force du joueur | La performance sur la saison |
| **Durée de vie** | Éternelle, jamais remise à zéro | Remise à zéro à chaque saison |
| **Sert à** | Catégories (ONYX → DIAMANT), appariements, classement « officiel » du club | Podium de saison, enjeux, motivation |
| **Évolue par** | Formule Elo après chaque match | PR (3 / 1 / 0) après chaque match |

**Saison :** 12 semaines (~un trimestre). Le comité annonce les dates de début et de fin. Entre deux saisons, une semaine de pause est possible (matchs amicaux hors classement).

**Rondes :** la cadence est **variable** — une ronde tous les 3, 4 ou 5 jours, au choix du comité selon la période. Une saison de 12 semaines contient donc environ 17 à 28 rondes. Le nombre exact n'a pas besoin d'être fixé à l'avance : le classement saisonnier utilise des départages qui ne dépendent pas d'un nombre de rondes prédéfini.

---

## III. Système de notation

### A. Points de Rencontre (PR) — barème saisonnier

| Résultat | PR |
|---|---|
| Victoire | **3** |
| Match nul | **1** |
| Défaite | **0** |
| Victoire par forfait (adversaire apparié absent) | **3** |
| Défaite par forfait (joueur apparié absent) | **0** |
| Bye (nombre impair de joueurs) | **3** |
| Non inscrit à la ronde (indisponible) | — (aucun match, aucun PR, aucune pénalité) |

**Pourquoi 3 / 1 / 0 et plus 3 / 2 / 1 :** avec l'ancien barème, une défaite rapportait 1 point — un joueur pouvait donc grimper au classement en accumulant des défaites. Le nouveau barème ne récompense que les résultats ; l'assiduité est déjà récompensée naturellement (plus on joue, plus on a d'occasions de marquer), et elle est suivie par ailleurs dans le volet coaching.

### B. Le Spread — remplace la « Différence de Score » (DS)

Le **spread** d'un match est la différence brute de score, **plafonnée à ±100 points** :

```
spread = min(100, max(-100, score_joueur − score_adversaire))
```

Le **spread cumulé** d'un joueur est la somme de ses spreads sur la saison.

**Pourquoi ce changement :** l'ancienne formule `ΔS / S_perdant` explosait dès que le perdant faisait un petit score (450–200 donnait le même DS maximal qu'un écrasement historique) et nécessitait un choix arbitraire entre somme et moyenne. Le spread plafonné est la norme des fédérations de Scrabble (FISF, NASPA) : simple, compréhensible par tous, et le plafond empêche qu'un seul match massacre ou gonfle une saison entière.

**Cas particuliers :**
- **Forfait :** spread forfaitaire de **+50 / −50** (score fictif non enregistré comme performance).
- **Bye :** **aucun spread** (ni gain ni perte) — le bye donne 3 PR et c'est tout.

### C. Départage saisonnier

En cas d'égalité de PR au classement saisonnier, les critères s'appliquent dans cet ordre :

1. **Buchholz** — somme des PR finaux de tous les adversaires rencontrés dans la saison. Récompense d'avoir affronté des joueurs performants. Toujours calculable, contrairement à l'ancien PDI qui exigeait que tous les ex æquo se soient affrontés entre eux (cas quasi inexistant en système suisse).
2. **Spread cumulé** (plafonné, voir III.B).
3. **Confrontation directe** — uniquement si les joueurs à départager se sont tous affrontés dans la saison.
4. **Nombre de victoires** dans la saison.
5. **Cote Elo** au moment du départage.

L'ancien PDI est **supprimé** : le Buchholz le remplace dans tous les cas, sans ses cas d'échec.

---

## IV. Disponibilité, appariements et byes

### A. Phase d'inscription à la ronde

Chaque ronde commence par une **fenêtre de disponibilité** (annoncée par le comité, p. ex. 24 h avant la génération des appariements) :

- Seuls les joueurs **inscrits** (ayant confirmé leur disponibilité) entrent dans le pool d'appariement.
- Ne pas s'inscrire est **totalement neutre** : pas de match, pas de PR, pas de perte de cote, pas de sanction.
- Un joueur inscrit puis apparié qui ne joue pas dans le délai de la ronde est **forfait** (voir VI).

C'est le changement le plus important de la V2 : dans une ligue à vie avec des rondes tous les 3-5 jours, l'absence ponctuelle est normale et ne doit rien coûter. Seul l'engagement non tenu (être apparié et disparaître) est sanctionné.

### B. Algorithme d'appariement — suisse par groupes de points

À chaque ronde, sur le pool des inscrits :

1. **Tri** : PR saisonniers décroissants, puis cote Elo décroissante.
2. **Groupes de points** : les joueurs à égalité de PR forment un groupe. On apparie **moitié haute contre moitié basse du même groupe** (le 1er du groupe contre le joueur du milieu, etc.). Si un groupe est impair, le joueur restant « flotte » vers le groupe inférieur.
3. **Contrainte de re-match** : deux joueurs ne peuvent pas se rencontrer deux fois dans les **4 dernières rondes**. En cas de conflit, permutation avec le voisin le plus proche dans le groupe (remontée puis descente, comme en V1). Si l'effectif du pool rend la contrainte insatisfiable, elle est relâchée à 3, puis 2 rondes — l'appariement a toujours une solution.

**Pourquoi plus « le premier contre le dernier » :** l'appariement fold de la V1 maximise les matchs déséquilibrés. Le suisse par groupes de points produit des matchs serrés, plus formateurs et plus intéressants — et c'est précisément ce qu'un système Elo mesure le mieux. L'interdiction *éternelle* de re-match de la V1 était de toute façon intenable dans un club de taille réelle ; la fenêtre glissante de 4 rondes garde la variété sans bloquer le système.

### C. Byes

Si le pool est impair :

- Le bye est attribué au joueur **le moins bien classé du pool n'ayant pas eu de bye dans les 3 dernières rondes** auxquelles il était inscrit.
- Le bye rapporte **3 PR, aucun spread, aucun changement de cote**.

**Pourquoi plus de « DS fixe à 50 % » :** un bye n'est pas une performance ; lui attribuer un écart de score fictif polluait les statistiques et les départages.

---

## V. Évolution de la cote Elo

### A. Formule

Après chaque match :

```
E₁ = E₀ + K × (W − We)
```

- **E₀** : cote avant le match (1000 pour tout nouveau joueur, intégré directement au classement général).
- **W** : résultat (1 victoire, 0.5 nul, 0 défaite).
- **We** : probabilité de victoire estimée : `We = 1 / (1 + 10^((E_adv − E₀) / 400))`.
- **Plancher : 800.** (Le plancher V1 à 1000 — le point d'entrée — rendait les nouveaux « incassables » : ils ne pouvaient pas perdre de points, ce qui faussait aussi la cote de leurs adversaires.)

### B. Coefficient K — par expérience, plus par catégorie

| Situation | K |
|---|---|
| Moins de 15 matchs joués (période provisoire) | **40** |
| Retour d'inactivité (voir V.D) — pendant 5 matchs | **30** |
| Régime normal | **20** |
| Cote ≥ 1900 (élite) | **10** |

**Pourquoi :** un K élevé en début de parcours amène vite le joueur à sa vraie cote ; un K faible en haut stabilise l'élite. Les anciennes plages « débutant / intermédiaire / expert » étaient subjectives — le nombre de matchs joués et la cote sont, eux, objectifs et automatisables. *(Note : en pratique, la V1 appliquait K = 30 à tout le monde à cause d'un défaut d'implémentation ; la V2 corrige et officialise.)*

### C. Suppression du bonus DS dans la cote

La composante `α × (DS/100)` de la V1 est **supprimée**. Telle qu'implémentée (bonus au vainqueur uniquement, sans retrait au perdant), elle injectait des points dans le système à chaque match : la cote moyenne du club montait mécaniquement et les seuils de catégories se dévaluaient avec le temps. La cote V2 est un Elo pur, à somme (quasi) nulle. L'ampleur des victoires est déjà valorisée là où elle a sa place : le spread, au départage saisonnier.

### D. Inactivité — statut, pas punition

- La cote **ne se dégrade jamais** par inactivité : elle mesure la force, pas l'assiduité.
- Un joueur sans match depuis **6 semaines** passe au statut **« inactif »** : il reste dans le classement général mais est signalé comme tel (et masqué par défaut de la vue « joueurs actifs »). C'est la donnée déjà suivie par le Club Overview (`weeksSinceLastActivity`).
- Au retour, le joueur réintègre le pool dès qu'il s'inscrit à une ronde, avec **K = 30 pendant 5 matchs** pour recalibrer rapidement sa cote.
- Un joueur inactif ne peut pas figurer au podium de la saison s'il a joué moins de **1/3 des rondes** de celle-ci (seuil ajustable par le comité).

### E. Forfait et cote

Un forfait est traité comme une **défaite au regard de la cote** (W = 0 contre la cote réelle de l'adversaire), et une victoire pour l'adversaire présent. Justification : dans une ligue continue, le forfait sans conséquence de cote deviendrait une stratégie d'évitement des adversaires dangereux.

---

## VI. Absences, forfaits et sanctions

| Situation | PR | Spread | Cote | Sanction |
|---|---|---|---|---|
| Non inscrit à la ronde | — | — | inchangée | **Aucune** |
| Apparié, absent (forfait) | 0 | −50 | perte comme une défaite | comptabilisé |
| Apparié, adversaire absent | 3 | +50 | gain comme une victoire | — |
| Les deux absents | 0 chacun | 0 | inchangée | forfait pour les deux |

- **3 forfaits dans une même saison** → suspension automatique d'une ronde (le joueur ne peut pas s'inscrire à la ronde suivante).
- Les forfaits sont remis à zéro à chaque saison.
- Un forfait **justifié avant la fin de la ronde** (motif accepté par le comité) est requalifié : le match est annulé, l'adversaire reçoit un bye (3 PR, pas de spread, pas de cote).

---

## VII. Saisie, validation et litiges

1. **Enregistrement centralisé** dans l'application du club : identifiants, scores, PR, spread, cotes avant/après.
2. **Validation mutuelle** : les deux joueurs confirment le résultat dans l'application.
3. **Délai de contestation : 24 heures** après la saisie (les 5 minutes de la V1 étaient inapplicables pour des matchs joués en ligne à des horaires libres). Passé ce délai, le résultat est définitif.
4. **Comité d'arbitrage** : tranche les litiges ; toute modification rétroactive est annotée dans l'historique.
5. **Archivage** : historique complet des rencontres, contestations et modifications, accessible aux administrateurs.

---

## VIII. Catégories

Les seuils sont inchangés :

| Catégorie | Cote |
|---|---|
| **ONYX** | E < 1400 |
| **AMÉTHYSTE** | 1400 ≤ E < 1700 |
| **TOPAZE** | 1700 ≤ E < 1900 |
| **DIAMANT** | E ≥ 1900 |

**Nouveauté — hystérésis anti yo-yo :**
- **Promotion : immédiate** dès que la cote atteint le seuil.
- **Rétrogradation : différée** — un joueur n'est rétrogradé que si sa cote est **sous le seuil − 25 points** à l'issue de **deux rondes consécutives**.

Sans cela, un joueur à 1395–1405 changerait de catégorie à chaque match, ce qui rend l'historique de progression (suivi dans le Club Overview) illisible et démoralisant. Les seuils restent révisables par le comité.

---

## IX. Paramètres du comité

Tous les nombres « réglables » du système, réunis en un seul endroit. Toute modification est annoncée avant le début d'une saison, jamais en cours de saison.

| Paramètre | Valeur V2 | Section |
|---|---|---|
| Durée d'une saison | 12 semaines | II |
| Cadence des rondes | 3 à 5 jours (variable) | II |
| Plafond de spread par match | ±100 | III.B |
| Spread forfaitaire | ±50 | III.B |
| Fenêtre anti re-match | 4 rondes | IV.B |
| Fenêtre anti re-bye | 3 rondes | IV.C |
| K provisoire / retour / normal / élite | 40 / 30 / 20 / 10 | V.B |
| Seuil « période provisoire » | 15 matchs | V.B |
| Durée du K de retour | 5 matchs | V.B |
| Plancher de cote | 800 | V.A |
| Cote initiale | 1000 | V.A |
| Seuil d'inactivité | 6 semaines | V.D |
| Rondes minimum pour le podium | 1/3 des rondes de la saison | V.D |
| Forfaits avant suspension | 3 par saison | VI |
| Délai de contestation | 24 h | VII |
| Marge d'hystérésis (rétrogradation) | 25 points, 2 rondes | VIII |

---

## X. Conclusion

La V2 conserve ce qui faisait la force de la V1 — formule Elo publique, intégration directe des nouveaux à 1000, catégories évocatrices — et corrige ses quatre défauts structurels : un barème PR qui récompensait le volume, l'absence de saisons dans une ligue sans fin, la confusion entre indisponibilité et forfait, et des mécanismes de départage (DS en pourcentage, PDI) à la fois fragiles et inflationnistes. Le résultat est un système où **la cote dit qui est fort, la saison dit qui performe, et l'activité est un statut observable — jamais une punition.**

---

## Annexe — Alignement avec l'application (notes d'implémentation)

État constaté au 12/07/2026 :

| Règle V2 | État dans le code | Action |
|---|---|---|
| PR 3/1/0 | ✅ Déjà appliqué (`MatchService.calculatePR`) | Aucune — la V1 papier était en retard sur le code |
| Spread plafonné ±100 | ❌ DS actuel = `|s1−s2|/(s1+s2)` en % (`MatchService.calculateDS`) | Remplacer DS par le spread dans les types, la saisie et les départages |
| Buchholz | ❌ Inexistant | À ajouter dans `RankingService` |
| K par expérience | ⚠️ Bug : K=30 pour tous (joueurs temporaires créés avec `totalMatches: 0` dans `RatingSystem.processMatchRatings`) | Réécrire `determineKFactor` sur le vrai nombre de matchs |
| Suppression bonus DS sur l'Elo | ❌ Bonus vainqueur seul (`RatingSystem.calculateNewRating`) — inflationniste | Supprimer |
| Plancher 800 | ❌ Plancher à 1000 | Modifier |
| Saisons | ❌ Inexistant | Nouvelle entité + remise à zéro des PR |
| Pool de disponibilité | ❌ Appariement sur tous les participants de l'événement | Phase d'inscription avant `generatePairingsForRound` |
| Bye sans spread ni cote | ⚠️ Partiel (`byeHistory` existe) | Ajuster le traitement du bye |
| Hystérésis catégories | ❌ Bascule immédiate (`CategoryManager`) | Ajouter la marge de 25 pts / 2 rondes |
| Statut inactif 6 semaines | ✅ Donnée déjà calculée (`weeksSinceLastActivity` dans `/api/club/overview`) | Exposer le statut dans le classement |
| Forfait = défaite Elo | ⚠️ À vérifier (`MatchManager.processForfeitMatch` utilise un score fictif 400–0 et DS 100) | Aligner sur V2 (W=0, spread ±50) |
