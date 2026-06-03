Pour connaître le volume total occupé par une base de données sur l'ensemble

de son historique, on additionne simplement la taille de chaque fichier .dmp

produit depuis le premier backup jusqu'au dernier.

─────────────────────────────────────────────────────────────────────

EXEMPLE avec prod-main

─────────────────────────────────────────────────────────────────────

Chaque backup produit un fichier .dmp dont on enregistre la taille :

01 jan.  →  10,20 Go

08 jan.  →  10,80 Go

15 jan.  →  11,40 Go

22 jan.  →  13,33 Go

29 jan.  →  13,90 Go

05 fév.  →  14,50 Go

12 fév.  →  15,10 Go

19 fév.  →  14,80 Go

26 fév.  →  16,20 Go

Volume total alltime :

10,20 + 10,80 + 11,40 + 13,33 + 13,90 + 14,50 + 15,10 + 14,80 + 16,20

= 120,23 Go

C'est cette valeur (120,23 Go) qui est passée au treemap pour prod-main.

─────────────────────────────────────────────────────────────────────

MÊME LOGIQUE POUR TOUTES LES BASES

─────────────────────────────────────────────────────────────────────

prod-main   →  somme de ses 9 backups  = 120,23 Go

analytics   →  somme de ses N backups  =  57,30 Go  (exemple)

users-db    →  somme de ses N backups  =   3,21 Go  (exemple)

logs-store  →  somme de ses N backups  = 224,85 Go  (exemple)

reporting   →  somme de ses N backups  =  71,28 Go  (exemple)

Total affiché dans le treemap :

120,23 + 57,30 + 3,21 + 224,85 + 71,28 = 476,87 Go

─────────────────────────────────────────────────────────────────────

POURQUOI LA SOMME ET PAS LA DERNIÈRE VALEUR ?

─────────────────────────────────────────────────────────────────────

Prendre uniquement la dernière taille connue (16,20 Go pour prod-main)

représenterait l'état actuel de la base, pas l'espace réellement consommé

sur le stockage.

Si on conserve tous les fichiers .dmp (à des fins de restauration ou d'audit),

chaque fichier occupe de la place sur le disque.

La somme alltime reflète donc le volume de stockage physiquement utilisé

par l'ensemble des sauvegardes de cette base depuis le début.

C'est cette somme qui a du sens pour un treemap d'occupation du volume.
