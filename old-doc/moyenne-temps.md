Pour chaque backup, on mesure le temps écoulé entre le moment où la demande est envoyée et le
moment où la réponse "OK" est reçue. Cette différence, exprimée en secondes, est la durée brute de
l'opération.

Exemple avec prod-main (3 sauvegardes) :

- Backup 1 : départ à 02:00:00, retour à 02:01:15 → 75 secondes

- Backup 2 : départ à 02:00:00, retour à 02:01:42 → 102 secondes

- Backup 3 : départ à 02:00:00, retour à 02:00:58 → 58 secondes

On additionne les trois durées : 75 + 102 + 58 = 235 secondes au total.

On divise par le nombre de sauvegardes : 235 ÷ 3 = 78 secondes, soit 1min 18s de moyenne pour prod-
main.

---

On répète l'opération pour chaque base :

- prod-main   → 75 + 102 + 58 = 235 ÷ 3 = 78s  (1min 18s)

- analytics   → 262 + 235 + 310 = 807 ÷ 3 = 269s (4min 29s)

- users-db    → 32 + 47 + 28 = 107 ÷ 3 = 36s  (36s)

- logs-store  → 490 + 462 + 543 = 1495 ÷ 3 = 498s (8min 18s)

- reporting   → 125 + 153 + 118 = 396 ÷ 3 = 132s (2min 12s)

Moyenne globale : 78 + 269 + 36 + 498 + 132 = 1013 ÷ 5 = 203s (3min 23s)

Une base dont la moyenne dépasse 203s est considérée comme plus lente que la normale.

→ logs-store (498s) et analytics (269s) sont au-dessus de la moyenne globale.
