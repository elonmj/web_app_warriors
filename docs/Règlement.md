# Règlement de la Word Warriors League

## Introduction

**Présentation brève :** Notre tournoi en ligne, la Word Warriors League, vise à organiser un duel par semaine pour chaque membre.

**NB :** Le nom de la ligue est encore en version bêta. Toutes les améliorations, propositions ou contestations concernant son choix sont encore possibles pour un bref délai.

## Concept

**Explication :** Il s'agit d'une ligue qui structure des duels hebdomadaires pour ses membres.

**Caractéristiques :**

*   La ligue est organisée en saisons, comme toute ligue digne de ce nom. Elle n'est donc pas occasionnelle, à l'instar de nos autres tournois en présentiel et en ligne.
*   Une saison dure au minimum 12 semaines, soit 12 duels.

**Objectif gagnant :** Atteindre le sommet du classement.

**Les duels :** Ils servent à établir un classement basé sur les Points de Rencontre (PR), le Points de Départage Interne (PDI), la Différence de Score (DS), et la côte ELO.

## Système de Classement

Le classement est déterminé par les éléments suivants :

1.  **Points de Rencontre (PR)**
    *   Victoire : 3 PR
    *   Match Nul : 2 PR
    *   Défaite : 1 PR
    *   Absence (Joueur Présent) : 3 PR
    *   Absence (Joueur Absent) : 0 PR

2.  **Points de Départage Interne (PDI)**
    *   Utilisés pour départager les joueurs ayant le même nombre de PR.
    *   Calculés uniquement si tous les joueurs se sont affrontés.

3.  **Différence de Score (DS)**
    *   Calculée en pourcentage : `DS = min(100, (ΔS / S_perdant) * 100)`
    *   Peut être cumulée via somme ou moyenne pondérée.

4.  **Côte ELO**
    *   Évolution basée sur la formule : `E1 = E0 + K * (W - We)`
    *   Probabilité de victoire : `P(victoire) = 1 / (1 + 10^((E_adversaire - E0) / 400))`
    *   Ajustement possible avec le DS : `E1 = E0 + K * ((W - We) + α * (DS/100))`

## Catégories des Joueurs

Les joueurs sont répartis dans les catégories suivantes en fonction de leur côte ELO :

*   **ONYX :** 1000 ≤ E < 1400
*   **AMÉTHYSTE :** 1400 ≤ E < 1700
*   **TOPAZE :** 1700 ≤ E < 1900
*   **DIAMANT :** E ≥ 1900

## Ressources

### Dossier Drive

*   **Lien :** [Insérer le lien vers le dossier Drive ici]

### Fichier Parcours

*   **Description :** Ce fichier offre les statistiques de l'évolution des joueurs depuis leur premier duel jusqu'à la phase actuelle.
*   **Lien :** [Insérer le lien vers le fichier Parcours ici]

### Fichier Catégories

*   **Description :** Ce fichier, sans doute le plus important, sert de feuille de route de la Word Warriors League en offrant à chaque étape du tournoi le classement des joueurs.
*   **Lien :** [Insérer le lien vers le fichier Catégories ici]

## Code Source

**NB :** Les fichiers `main.py` et `Functions.py` contiennent le code d'attribution et de génération des duels. Toute suggestion à ce sujet est la bienvenue.

## Contact

Pour toute question ou suggestion, veuillez contacter [Insérer l'adresse email ou le moyen de contact ici].
