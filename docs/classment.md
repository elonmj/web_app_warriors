
---

# SYSTÈME DE CLASSEMENT, D’APPARIEMENT ET D’ÉVOLUTION DE LA CÔTE  
*Pour le club de Scrabble FAIZERS, matchs en continu*

---

## I. OBJECTIFS ET PRINCIPES GÉNÉRAUX

- **Transparence et équité** : Garantir une gestion du classement fondée sur des résultats réels et des confrontations directes.
- **Évolution continue** : Mettre à jour le classement et la côte en temps réel, en intégrant directement les nouveaux joueurs dans le classement général.
- **Adaptabilité** : Tenir compte des effectifs (grands ou petits), des absences et des litiges, en ajustant les mécanismes de notation et d’appariement.
- **Catégorisation par "noms" évocateurs** : Les joueurs sont répartis en quatre groupes selon leur côte, avec une super catégorie et trois catégories (voir section VII).

---

## II. SYSTÈME DE NOTATION

### A. Points de Rencontre (PR)

1. **Résultats standards**  
   - **Victoire** : 3 PR  
   - **Match nul** : 2 PR chacun  
   - **Défaite** : 1 PR

2. **Gestion des absences et non-manifestations**  
   - **Absence totale des deux joueurs** : Si aucun ne se manifeste dans le délai imparti, le match est annulé et **0 PR** est attribué à chacun.  
   - **Absence d’un seul joueur** :  
     - Le joueur présent obtient automatiquement 3 PR (victoire forfaitaire).  
     - Le joueur absent reçoit 0 PR.  
     - **Sanction complémentaire en cas d’abus** : Si un joueur accumule un nombre défini d’absences non justifiées (par exemple, 3 absences sur 10 matchs), une sanction supplémentaire pourra être appliquée (suspension temporaire des appariements et/ou réduction de la côte d’un pourcentage fixé par le comité).

---

### B. Points de Départage

#### 1. Points de Départage Interne (PDI)

- **Calcul** :  
  Pour chaque confrontation directe, la répartition se fait selon le tableau suivant :

  | Résultat             | Points attribués |
  |----------------------|------------------|
  | Victoire             | 3 points         |
  | Match nul            | 2 points chacun  |
  | Défaite              | 1 point          |

- **Utilisation** :  
  Le PDI est utilisé pour départager des joueurs ayant le même total de PR **uniquement lorsque tous se sont affrontés** entre eux.  
  - *Cas partiel* : Si, dans un groupe (ex. : joueurs A, B, C), seules certaines confrontations ont eu lieu (A vs B, B vs C, mais pas A vs C), le PDI sera calculé sur le sous-ensemble concerné. Si l’incomplétude risque de fausser le classement, le comité pourra décider d’ignorer le PDI en faveur des autres critères.

#### 2. Différence de Score (DS)

- **Calcul par match** :  
  Le DS est exprimé en pourcentage et se calcule de la manière suivante :

  \[
  DS_{\text{match}} = \min\left(100, \; \frac{\Delta S}{S_{\text{perdant}}} \times 100\right)
  \]

  où :
  - \(\Delta S\) est la différence brute de score entre le gagnant et le perdant,
  - \(S_{\text{perdant}}\) est le score du joueur perdant.

- **Cumul du DS** :  
  Deux options sont possibles :
  - **Somme des pourcentages** : Avantageux pour les joueurs ayant disputé un grand nombre de matchs.
  - **Moyenne pondérée** : Permet d’éviter que la quantité de matchs n’influe excessivement sur le DS.  
  *Le choix (somme ou moyenne) sera défini par le comité afin d’assurer une cohérence sur la saison.*

#### 3. Gestion des "byes" (matchs avec joueur fictif)

- Lorsqu’un joueur se voit attribuer un bye (effectif impair) :
  - Il reçoit automatiquement la victoire forfaitaire, avec un DS fixe (par exemple, 50 %).  
  - Le système veille à limiter le nombre de byes consécutifs afin de préserver l’équilibre du DS global.

---

### C. Cas d’égalité absolue

En cas d’égalité parfaite sur les critères PR, PDI et DS, le départage s’effectuera selon :
1. **Nombre total de matchs joués**  
   - Le joueur ayant disputé le plus grand nombre de rencontres sera favorisé, valorisant l’expérience et la régularité.
2. **Historique récent des performances**  
   - La constance sur les 6 derniers mois (moyenne pondérée des scores, par exemple) sera examinée.
3. **Ancienneté dans le club**  
   - En dernier recours, la date d’inscription ou le classement initial pourra servir de critère de départage.

---

## III. MODALITÉS D’APPARIEMENT

### A. Classement préalable pour l’appariement

Avant chaque ronde, les joueurs sont triés selon l’ordre suivant :
1. **PR décroissants.**
2. **PDI décroissant** (uniquement si toutes les confrontations entre les joueurs concernés existent).
3. **DS cumulée** (exprimée en somme ou moyenne, selon le choix du comité).
4. **Critères historiques** (nombre de matchs joués, ancienneté) en cas d’égalité persistante.

### B. Algorithme d’appariement

1. **Appariement initial**  
   - Le joueur le mieux classé est associé au joueur le moins classé disponible, après vérification de l’historique des rencontres afin d’éviter des répétitions.

2. **Processus de permutation pour éviter les doublons**  
   - **Vérification de l’historique** : Chaque paire proposée est vérifiée pour s’assurer que les deux joueurs ne se soient pas déjà rencontrés.  
   - **Permutation en deux étapes** :
     - **Remontée** : À partir de la position de l’adversaire proposé, recherche vers le haut du classement pour identifier un joueur qui n’a pas encore affronté le joueur concerné.
     - **Descente** : Si aucune solution n’est trouvée en remontant, la recherche se poursuit vers le bas du classement.
   - **Exemple** :  
     Supposons un classement partiel : A, B, C, D, E, F.  
     Si A a déjà joué contre B et C, et que l’appariement proposé est A vs B, le système recherche en remontant ou descendant pour proposer A vs D (par exemple), un adversaire non déjà rencontré par A.  
     La permutation est alors enregistrée pour éviter toute répétition.

### C. Cas particuliers

1. **Effectif réduit / Nombre impair de joueurs**  
   - Un bye est inséré en cas de nombre impair, et le joueur opposé gagne avec un DS fixe (par exemple, 50 %).

2. **Intégration des nouveaux joueurs**  
   - Les nouveaux joueurs intègrent directement le classement général avec une cote de départ de **1000 points**.  
   - Ils ne sont pas isolés dans un sous-classement, afin de favoriser leur progression dès leur première rencontre.

---

## IV. ÉVOLUTION DE LA CÔTE (COTE)

### A. Formule d’évolution

Après chaque session de matchs, la côte évolue selon la formule inspirée du système ELO :

\[
E_1 = E_0 + K \times (W - We)
\]

où :
- **E₀** : Côte antérieure (1000 pour les nouveaux).
- **E₁** : Nouvelle côte.
- **K** : Coefficient de modulation défini objectivement selon le niveau :
  - Pour les débutants : K = 30,
  - Pour les joueurs intermédiaires : K = 20,
  - Pour les joueurs expérimentés : K = 10.
- **W** : Somme des résultats obtenus durant la session (0 pour une défaite, 0.5 pour un match nul, 1 pour une victoire).
- **We** : Somme des probabilités de victoire estimées pour chaque match.

### B. Calcul des probabilités de victoire (We)

Utilisation d’une fonction logistique adaptée :

\[
P(\text{victoire}) = \frac{1}{1 + 10^{\frac{E_{\text{adversaire}} - E_0}{400}}}
\]

- **Exemple** :  
  Si un joueur avec E₀ = 1000 affronte un adversaire à 1200 :

  \[
  P = \frac{1}{1 + 10^{\frac{1200-1000}{400}}} \approx \frac{1}{1 + 10^{0.5}} \approx 0,24 \quad (24\%)
  \]

- **Adaptation** :  
  Le facteur 400 pourra être ajusté en fonction des analyses internes du club pour mieux refléter les spécificités du Scrabble.

### C. Intégration du DS dans l’évolution de la côte

Pour récompenser les victoires convaincantes et pénaliser les défaites sévères, il est possible d’intégrer une part du DS dans la formule d’évolution :

\[
E_1 = E_0 + K \times \left[(W - We) + \alpha \times \left(\frac{DS}{100}\right)\right]
\]

où \(\alpha\) est un coefficient fixé par le comité pour calibrer l’impact de l’écart de score.

---

## V. SAISIE, VALIDATION ET GESTION DES ERREURS

### A. Saisie et validation

- **Enregistrement** :  
  Chaque match est enregistré dans un système centralisé (interface numérique ou feuille officielle) incluant :  
  - Les identifiants des joueurs, scores, PR, DS et PDI.
- **Validation mutuelle** :  
  Les deux joueurs doivent valider le résultat. En cas de désaccord, une procédure de contestation est immédiatement déclenchée.

### B. Gestion des litiges et modifications a posteriori

1. **Délai de contestation**  
   Les contestations doivent être soumises dans un délai court (par exemple, 5 minutes après le match). Au-delà, le résultat devient définitif.

2. **Rôle du comité d’arbitrage**  
   En cas de litige ou d’erreur de saisie, un comité d’arbitrage examine la situation. Toute modification rétroactive est enregistrée avec une annotation dans l’historique.

3. **Archivage**  
   L’historique complet de toutes les rencontres, contestations et modifications est sauvegardé de manière centralisée et accessible aux administrateurs du club.

---

## VI. RÉSOLUTIONS DES POINTS D’OMBRE ET PROBLÈMES POTENTIELS

1. **Gestion des absences répétées**  
   - Mise en place d’un suivi des absences.  
   - Sanctions complémentaires (suspension temporaire et/ou réduction de la côte) en cas d’abus.

2. **Calcul du PDI en cas de confrontations incomplètes**  
   - Utilisation du PDI uniquement sur le sous-groupe ayant joué entre eux, sinon recours aux DS et critères historiques.

3. **Méthode de cumul du DS**  
   - Choix entre somme ou moyenne pondérée, tranché par le comité en fonction de l’équité recherchée.

4. **Appariement pour effectifs réduits**  
   - En cas de répétitions forcées, le système autorise la réapparition des confrontations après un nombre défini de matchs, tout en notant l’historique.

5. **Gestion des byes**  
   - Attribution d’un DS fixe pour les byes, avec limitation du nombre de byes consécutifs pour éviter toute distorsion.

6. **Intégration des nouveaux joueurs**  
   - Les nouveaux joueurs rejoignent immédiatement le classement général avec une côte de 1000, sans être isolés dans un sous-classement.

7. **Définition objective du coefficient K**  
   - Des plages claires seront établies (ex. : K = 30 pour débutants, K = 20 pour intermédiaires, K = 10 pour experts).

8. **Calcul des probabilités de victoire**  
   - Bien que la formule ELO standard soit utilisée, des ajustements (par exemple, modifier le diviseur 400) pourront être faits après analyses internes.

9. **Saisie, validation et modifications**  
   - Procédure claire avec délai de contestation, rôle du comité d’arbitrage et archivage pour assurer la transparence.

10. **Intégration du DS dans la cote**  
    - Possibilité d’inclure une composante DS dans l’évolution de la côte pour mieux refléter l’ampleur des victoires/défaites.

---

## VII. CATÉGORISATION DES JOUEURS

Afin de valoriser les performances, le club répartit les joueurs en quatre groupes distincts, dont trois catégories et une super catégorie. La répartition se fait sur la base de la côte :

- **Catégorie ONYX**  
  - **Côte :** 1000 ≤ E < 1400  
  - *Destinée aux nouveaux venus et aux joueurs en phase de développement.*

- **Catégorie AMÉTHYSTE**  
  - **Côte :** 1400 ≤ E < 1700  
  - *Pour des joueurs ayant déjà acquis une première expérience et des résultats réguliers.*

- **Catégorie TOPAZE**  
  - **Côte :** 1700 ≤ E < 1900  
  - *Pour des joueurs confirmés et performants, en voie de percer au niveau supérieur.*

- **Super Catégorie DIAMANT**  
  - **Côte :** E ≥ 1900  
  - *Réservée aux joueurs d’élite, dont la régularité et les résultats démontrent un haut niveau de performance.*

Ces seuils pourront être révisés par le comité du club en fonction de l’évolution du niveau général et de l’effectif.

---

## VIII. CONCLUSION

Le présent document final présente un système complet, détaillé et modulable pour la gestion du classement, des appariements et de l’évolution de la côte au sein d’un club de Scrabble en continu. Il intègre :

- Une notation précise (PR, PDI, DS) tenant compte des absences et des litiges,
- Un algorithme d’appariement type “Swiss” adapté avec permutations pour éviter les doublons,
- Une intégration directe des nouveaux joueurs dans le classement général (à partir d’une côte initiale de 1000),
- Une évolution de la côte inspirée du système ELO, avec la possibilité d’inclure l’impact des écarts de score,
- Une catégorisation originale en quatre groupes (ONYX, AMÉTHYSTE, TOPAZE, et Super Catégorie DIAMANT) permettant de valoriser les performances et de favoriser la progression.

--- 
