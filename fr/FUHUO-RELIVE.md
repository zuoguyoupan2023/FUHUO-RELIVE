# FUHUO-RELIVE

## Objectif
Restaurer les fichiers depuis un bucket R2 indépendant vers le local, en écrasant les chemins locaux correspondants.

## Variables d’environnement requises

- BACKUP_R2_ACCESS_KEY_ID
- BACKUP_R2_SECRET_ACCESS_KEY
- BACKUP_R2_ACCOUNT_ID
- BACKUP_R2_BUCKET_NAME
- BACKUP_R2_ENDPOINT (optionnel)
- BACKUP_R2_PREFIX (optionnel)

## Mappage des chemins

- Racine locale : `/root/clawd`
- Fichier d’arborescence distant : `{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`
- Racine des fichiers distants : `{BACKUP_R2_PREFIX}/openclaw/`
- Chemin relatif distant `openclaw/*` restauré vers `/root/.openclaw` ou `/root/.clawdbot`

## Structure de stockage cloud

```
FUHUO-FILES-TREE.json    # Index de l’arborescence (racine)
openclaw/                # Répertoire des fichiers
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## Utilisation

1. Installer les dépendances
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. Enregistrer le script dans `/root/clawd/scripts/fuhuo_relive.js` (déjà enregistré)

3. Exécuter Relive
```bash
node /root/clawd/scripts/fuhuo_relive.js
```
