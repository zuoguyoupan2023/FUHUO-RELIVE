# FUHUO-BIRTH

## Objectif
Quand `FUHUO-FILES-TREE.json` n’existe ni localement ni dans le cloud, générer l’arborescence de base et initialiser la base cloud.

## Portée

Analyse par défaut (enregistre path/hash/size/mtimeMs) :
- `/root/clawd/core`
- `/root/clawd/skills`
- `/root/clawd/scripts`
- `/root/clawd/config`
- `/root/clawd/memory`
- `/root/clawd/fuhuo`
- `/root/.openclaw/openclaw.json` ou `/root/.clawdbot/clawdbot.json`
- `/root/clawd/*.md` fichiers cœur (AGENTS/IDENTITY/MEMORY/SOUL/USER/TOOLS/HEARTBEAT/MAIL-NEWS-MEMORY)

Répertoires exclus :
- `.git`
- `node_modules`

## Étapes

### 1. Générer l’arborescence locale

```bash
node /root/clawd/scripts/generate_file_tree.js
```

### 2. Exécuter le protocole Upload

```bash
node /root/clawd/scripts/fuhuo_upload.js
```

Référence : [FUHUO-UPLOAD.md](./FUHUO-UPLOAD.md)

### 3. Modifier HEARTBEAT.md

Ajouter une règle dans HEARTBEAT.md :

Exécuter le protocole Relive et décider s’il faut exécuter le protocole Relive-Upload ; si nécessaire, l’exécuter.

## Chemins des scripts

- Génération de l’arborescence : `/root/clawd/scripts/generate_file_tree.js`
- Script Upload : `/root/clawd/scripts/fuhuo_upload.js`

## Structure de stockage cloud

```
FUHUO-FILES-TREE.json    # Index de l’arborescence (racine)
openclaw/                # Répertoire des fichiers
├── AGENTS.md
├── IDENTITY.md
├── MEMORY.md
├── SOUL.md
├── USER.md
├── TOOLS.md
├── HEARTBEAT.md
├── MAIL-NEWS-MEMORY.md
├── config/
├── scripts/
├── skills/
├── fuhuo/
└── _config/
```

## Cas d’usage

- **Premier déploiement** : initialiser la sauvegarde cloud
- **Réinitialiser la sauvegarde** : reconstruire la base après nettoyage du cloud
- **Migration de stockage** : reconstruire lors du changement de bucket
