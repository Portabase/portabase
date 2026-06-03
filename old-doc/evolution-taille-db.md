Pour chaque base de données, on stocke à chaque backup la date d'exécution et la taille du fichier
.dmp produit (exprimée en Mo).

Exemple avec prod-main (9 sauvegardes) :

- 01 jan.  → 10,20 Mo

- 08 jan.  → 10,80 Mo

- 15 jan.  → 11,40 Mo

- 22 jan.  → 13,33 Mo

- 29 jan.  → 13,90 Mo

- 05 fév.  → 14,50 Mo

- 12 fév.  → 15,10 Mo

- 19 fév.  → 14,80 Mo

- 26 fév.  → 16,20 Mo

---

Taille initiale (premier backup connu) : 10,20 Mo

Taille actuelle (dernier backup)       : 16,20 Mo

Croissance totale : ((16,20 - 10,20) / 10,20) × 100 = 58,8 %

---

Delta entre chaque backup (variation d'un backup au suivant) :

- 01→08 jan.  : 10,80 - 10,20 = +0,60 Mo

- 08→15 jan.  : 11,40 - 10,80 = +0,60 Mo

- 15→22 jan.  : 13,33 - 11,40 = +1,93 Mo  ← pic de croissance

- 22→29 jan.  : 13,90 - 13,33 = +0,57 Mo

- 29→05 fév.  : 14,50 - 13,90 = +0,60 Mo

- 05→12 fév.  : 15,10 - 14,50 = +0,60 Mo

- 12→19 fév.  : 14,80 - 15,10 = -0,30 Mo  ← légère réduction (ex: purge)

- 19→26 fév.  : 16,20 - 14,80 = +1,40 Mo

Croissance moyenne par backup : (16,20 - 10,20) / 8 intervalles = +0,75 Mo par backup

---

Maximum atteint : 16,20 Mo (26 fév.)

Minimum enregistré : 10,20 Mo (01 jan.)

Un delta négatif indique une réduction de la base entre deux backups

(suppression de données, purge, optimisation, etc.).
