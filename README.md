# Commune Eco — Hackathon Product Design

Prototype web réalisé pendant le hackathon Product Design d'Epitech (B-TBM-100, janvier 2026), sur le thème de l'écologie.

L'utilisateur saisit le nom de sa commune et obtient un score environnemental calculé à partir de données publiques ouvertes. Une page pédagogique « Le saviez-vous ? » donne des repères sur l'empreinte carbone, le mix énergétique français et la comparaison train / avion.

## Fonctionnalités

- Recherche d'une commune et récupération de son code INSEE
- Score environnemental combinant trois indicateurs :
  - **Qualité de l'eau potable** : taux de non-conformité bactériologique (E. coli, entérocoques)
  - **Consommation d'énergie** des logements (diagnostics de performance énergétique)
  - **Consommation électrique** de la commune
- Page pédagogique avec chiffres clés sur l'empreinte carbone

## Données utilisées

Toutes les données sont interrogées en direct depuis des API publiques :

| Donnée | Source |
| --- | --- |
| Code INSEE des communes | [geo.api.gouv.fr](https://geo.api.gouv.fr) |
| Qualité de l'eau potable | [Hub'Eau](https://hubeau.eaufrance.fr) |
| Performance énergétique des logements (DPE) | [ADEME](https://data.ademe.fr) |
| Consommation électrique | [Agence ORE](https://opendata.agenceore.fr) |

## Stack technique

HTML, CSS, JavaScript (`fetch`, `async/await`), API REST publiques.

## Lancer le projet

Ouvrir `frontend/eco.html` dans un navigateur, ou servir le dossier `frontend/` avec n'importe quel serveur statique :

```bash
cd frontend && python3 -m http.server 8000
```

## Équipe

Léandre Boubault--Lefebvre, Leon, Mattis et Mathieu Jin — Epitech, 2026.
