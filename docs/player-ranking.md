## Analyse et Améliorations du Système de Classement des Joueurs

## Système Actuel

Le système de classement actuel se base sur plusieurs critères combinés : Points de Rencontre (PR), Points de Départage Interne (PDI), Différence de Score (DS), et une côte ELO. Les joueurs sont classés en tenant compte de ces éléments, avec des ajustements pour l'inactivité.

**Points Forts :**

*   Prend en compte plusieurs facteurs pour un classement plus précis.
*   Intègre la force des adversaires via la côte ELO.
*   Gère l'inactivité des joueurs.
*   Permet une catégorisation des joueurs.

**Points Faibles :**

*   Peut être complexe à comprendre sans une explication détaillée.
*   Nécessite une maintenance régulière pour ajuster les paramètres.

## Améliorations Proposées

### 1. Système de Points de Rencontre (PR)

*   **Victoire :** 3 PR
*   **Match Nul :** 2 PR
*   **Défaite :** 1 PR
*   **Absence (Joueur Présent) :** 3 PR
*   **Absence (Joueur Absent) :** 0 PR

### 2. Points de Départage Interne (PDI)

*   Utilisés pour départager les joueurs ayant le même nombre de PR.
*   Calculés uniquement si tous les joueurs se sont affrontés.

### 3. Différence de Score (DS)

*   Calculée en pourcentage : `DS = min(100, (ΔS / S_perdant) * 100)`
*   Peut être cumulée via somme ou moyenne pondérée.

### 4. Côte ELO

*   Évolution basée sur la formule : `E1 = E0 + K * (W - We)`
*   Probabilité de victoire : `P(victoire) = 1 / (1 + 10^((E_adversaire - E0) / 400))`
*   Ajustement possible avec le DS : `E1 = E0 + K * ((W - We) + α * (DS/100))`

### 5. Catégorisation des Joueurs

*   **ONYX :** 1000 ≤ E < 1400
*   **AMÉTHYSTE :** 1400 ≤ E < 1700
*   **TOPAZE :** 1700 ≤ E < 1900
*   **DIAMANT :** E ≥ 1900

### 6. Gestion de l'Inactivité

*   Réduction progressive de la côte et du bénéfice lié à la catégorie en cas d'inactivité.
*   Possibilité de remonter via des matchs joués.

## Conclusion

Le nouveau système de classement offre une approche plus complète et dynamique, tenant compte de divers facteurs pour évaluer la performance des joueurs. Il permet une gestion plus fine et une meilleure représentation du niveau de jeu.