# FUHUO-PROTOCOL

## Objectif
Lors du démarrage du conteneur ou à des points clés, décider automatiquement d’exécuter l’un des sous-protocoles Birth, Upload ou Relive.

## Vérifications d’entrée

1. Le fichier `FUHUO-FILES-TREE.json` existe-t-il dans la racine locale (par défaut : `/root/clawd/FUHUO-FILES-TREE.json`)

2. Les variables d’environnement suivantes sont-elles lisibles et non vides :

   - BACKUP_R2_ACCOUNT_ID
   - BACKUP_R2_ACCESS_KEY_ID
   - BACKUP_R2_SECRET_ACCESS_KEY
   - BACKUP_R2_BUCKET_NAME

3. En cas d’échec, afficher le résultat complet au humain

## Vérification cloud

Lire `FUHUO-FILES-TREE.json` dans le bucket défini par BACKUP_R2_BUCKET_NAME (par défaut : `{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`, ou `FUHUO-FILES-TREE.json` sans préfixe) et comparer avec le `FUHUO-FILES-TREE.json` local. Si le fichier distant n’existe pas, cela compte comme une différence.

## Structure de stockage cloud

```
FUHUO-FILES-TREE.json    # Index de l’arborescence (racine)
openclaw/                # Répertoire des fichiers
├── AGENTS.md            # Mappé vers /root/clawd/AGENTS.md
├── IDENTITY.md          # Mappé vers /root/clawd/IDENTITY.md
├── MEMORY.md            # Mappé vers /root/clawd/MEMORY.md
├── SOUL.md              # Mappé vers /root/clawd/SOUL.md
├── USER.md              # Mappé vers /root/clawd/USER.md
├── TOOLS.md             # Mappé vers /root/clawd/TOOLS.md
├── HEARTBEAT.md         # Mappé vers /root/clawd/HEARTBEAT.md
├── MAIL-NEWS-MEMORY.md  # Mappé vers /root/clawd/MAIL-NEWS-MEMORY.md
├── config/              # Mappé vers /root/clawd/config/
├── scripts/             # Mappé vers /root/clawd/scripts/
├── skills/              # Mappé vers /root/clawd/skills/
├── fuhuo/               # Mappé vers /root/clawd/fuhuo/
└── _config/             # Mappé vers /root/.openclaw/ ou /root/.clawdbot/
    └── openclaw.json
```

## Choisir le sous-protocole

- Ni local ni distant `FUHUO-FILES-TREE.json` : exécuter **Birth** FUHUO-BIRTH.md
- Local présent, distant absent : exécuter **Upload** FUHUO-UPLOAD.md
- Local et distant présents :
  - Différences présentes :
    - Si le nombre de fichiers distants > locaux : exécuter **Relive** FUHUO-RELIVE.md
    - Sinon (local supérieur ou égal) : exécuter **Upload** FUHUO-UPLOAD.md
  - Aucune différence : ne pas uploader
- Local absent, distant présent : exécuter **Relive** FUHUO-RELIVE.md

### Détails de la logique de décision

Quand les deux arbres existent mais diffèrent, décider selon le nombre de fichiers :

| Scénario | Fichiers locaux | Fichiers distants | Protocole |
|----------|------------------|-------------------|----------|
| Distant supérieur | 49 | 50 | Relive |
| Local supérieur | 50 | 49 | Upload |
| Même nombre mais contenu différent | 49 | 49 | Upload |

**Raisons** :
- Distant supérieur → possible perte locale après redémarrage, restaurer depuis le cloud
- Local supérieur → nouveaux fichiers locaux, sauvegarder vers le cloud
- Même nombre mais différent → modifications locales, uploader les nouvelles versions
