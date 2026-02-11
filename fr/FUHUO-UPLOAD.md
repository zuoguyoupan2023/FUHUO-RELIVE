# FUHUO-UPLOAD

## Objectif
Générer le `FUHUO-FILES-TREE.json` local et effectuer la synchronisation différentielle (upload et suppression).

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
- Règles de mappage :
  - Local `/root/clawd/xxx` → Distant `openclaw/xxx`
  - Local `/root/.openclaw/yyy` ou `/root/.clawdbot/yyy` → Distant `openclaw/_config/yyy`

## Structure de stockage cloud

```
FUHUO-FILES-TREE.json    # Index de l’arborescence (racine)
openclaw/                # Répertoire des fichiers
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## Stratégie de diff

- Nouveaux fichiers : upload
- Modifications de contenu : upload basé sur le hash
- Suppressions locales : suppression distante synchronisée

## Utilisation

1. Installer les dépendances
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. Enregistrer le script dans `/root/clawd/scripts/fuhuo_upload.js` (déjà enregistré)

3. Exécuter Upload
```bash
node /root/clawd/scripts/fuhuo_upload.js
```
