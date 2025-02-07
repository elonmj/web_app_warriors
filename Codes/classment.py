# Fonction pour attribuer des points en fonction de la catégorie
def attribuer_points_par_categorie(parcours):
    
    categories = {'A': [2,-1], 'B': [1.75,-1.5], 'C': [1.25,-1.75], 'D': [1,-2]}
    

    return points

# Fonction pour attribuer des points en fonction des victoires/défaites
def attribuer_points_par_victoire(parcours):
    categories = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
    nb_victoires = 0
    nb_defaites = 0
    
    for i in range(len(parcours) - 1):
        categorie_actuelle = parcours[i]
        categorie_suivante = parcours[i + 1]
        
        points_actuelle = categories[categorie_actuelle]
        points_suivante = categories[categorie_suivante]
        
        if points_suivante > points_actuelle:
            nb_victoires += 1
        elif points_suivante < points_actuelle:
            nb_defaites += 1
        else :
            if categorie_actuelle =='A':
                nb_victoires +=1
            if categorie_actuelle =='E':
                nb_defaites +=1
    
    return (nb_victoires , nb_defaites )

# Fonction pour calculer la catégorie moyenne
def calculer_categorie_moyenne(parcours):
    categories = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
    nb_matchs = len(parcours)
    points_joueur = sum(categories[cat] for cat in parcours)
    
    # Calculer les bornes pour chaque catégorie
    bornes = {}
    for cat, points in categories.items():
        bornes[cat] = ((points-1) * nb_matchs, points * nb_matchs)
    
    # Trouver la catégorie correspondante aux points du joueur
    for cat, (borne_inf, borne_sup) in sorted(bornes.items(), reverse=True):
        if borne_inf < points_joueur <= borne_sup:
            return cat

def calculer_score_classement(points_par_categorie, nb_victoire, categorie_moyenne):
    categories = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
    alpha = 0.5
    beta = 0.3
    gamma = 0.2
    
    score_categorie = points_par_categorie
    score_victoire = nb_victoire * 3
    score_categorie_moyenne = categories[categorie_moyenne]
    
    score_final = alpha * score_categorie + beta * score_victoire + gamma * score_categorie_moyenne
    
    return score_final *20
# Exemple d'utilisation
parcours_joueurs = {
    "Glok07":   ["A", "A", "A", "B", "A", "B", "A", "B", "A", "A"],
    "Toxicboy": ["A", "A", "B", "C", "D", "C", "B", "A", "A", "B"],
    "Caerys":   ["B", "A", "A", "B", "C", "D", "C", "B", "A", "A"],
    "Honorat":  ["B", "A", "B", "A", "A", "A", "A", "A", "A", "B"],
    "StWill":   ["C", "B", "A", "A", "B", "C", "D", "C", "B", "A"],
    "joselonm": ["C", "B", "C", "B", "A", "B", "C", "B", "C", "D"],
    "NYANKO":   ["D", "C", "D", "C", "B", "A", "B", "A", "B", "C"],
    "Gerse3":   ["D", "C", "D", "E", "D", "E", "E", "E", "E", "E"],
    "bado":     ["A", "B", "A", "A", "B", "A", "A", "A", "B", "C"],
    "Night47":  ["A", "B", "C", "D", "C", "D", "E", "D", "C", "D"],
    "Bzorp":    ["B", "C", "B", "A", "A", "A", "B", "C", "D", "C"],
    "Naofal":   ["B", "C", "B", "C", "B", "C", "D", "E", "D", "E"],
    "Pagando":  ["C", "D", "C", "B", "C", "B", "C", "D", "E", "E"],
    "Seruch":   ["C", "D", "E", "E", "D", "E", "D", "E", "E", "E"],
    "Brando19": ["D", "D"],
    "JessIda":  ["D", "D", "C", "D", "C", "B", "A", "B", "C", "B"],
    "Arlcel":   ["E"],
    "fofolle24":["E", "D", "C", "D", "C", "B", "C", "B", "A"],
    "YasminaS": ["E"],
    "ManuHdl":  ["E", "E", "E", "E", "D", "E", "D", "E", "D"],
    "EmoHnl10": ["E", "D", "E", "E", "D", "C", "D", "E"],
    "klenz22":  ["E", "D", "C", "D", "C", "B"],
    "OLIMIDE":  ["E", "E", "E", "E", "E", "E"],
    "Orens":    ["E", "D", "C"],
    "Divino":   ["E", "E", "D"]
}
import csv


# Ouvrir un fichier CSV en mode écriture
import csv
from collections import defaultdict

# Fonction pour attribuer des points en fonction de la catégorie
# ... (les autres fonctions inchangées) ...

# Ouvrir un fichier CSV en mode écriture avec encodage UTF-8
with open('resultats.csv', 'w', newline='', encoding='utf-8') as fichier_csv:
    writer = csv.writer(fichier_csv, delimiter=';')
    
    # Écrire l'en-tête du fichier CSV
    writer.writerow(['Rang', 'Joueur', 'Points', 'Nb_victoires', 'Nb_defaites', 'Catégorie moyenne', 'Cête', 'Nb de matchs joués'])
    
    # Calculer les scores et stocker les joueurs dans un dictionnaire
    joueurs = {}
    for joueur, parcours in parcours_joueurs.items():
        points = attribuer_points_par_categorie(parcours)
        victoires, defaites = attribuer_points_par_victoire(parcours)
        categorie_moyenne = calculer_categorie_moyenne(parcours)
        cote = calculer_score_classement(points, victoires, categorie_moyenne)
        nb_matchs = len(parcours)
        joueurs[joueur] = (cote, points, victoires, defaites, categorie_moyenne, nb_matchs)
    
    # Trier les joueurs par ordre décroissant de leur score
    joueurs_tries = sorted(joueurs.items(), key=lambda x: x[1][0], reverse=True)
    
    # Écrire les résultats des joueurs dans le fichier CSV
    rang = 1
    for joueur, (cote, points, victoires, defaites, categorie_moyenne, nb_matchs) in joueurs_tries:
        writer.writerow([rang, joueur, points, victoires, defaites, categorie_moyenne, cote, nb_matchs])
        rang += 1
