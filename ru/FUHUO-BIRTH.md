# FUHUO-BIRTH

## Цель
Когда `FUHUO-FILES-TREE.json` отсутствует и локально, и в облаке, создать базовое дерево файлов и инициализировать базу в облаке.

## Область действия

Сканируются по умолчанию (запись path/hash/size/mtimeMs):
- `/root/clawd/core`
- `/root/clawd/skills`
- `/root/clawd/scripts`
- `/root/clawd/config`
- `/root/clawd/memory`
- `/root/clawd/fuhuo`
- `/root/.openclaw/openclaw.json` или `/root/.clawdbot/clawdbot.json`
- `/root/clawd/*.md` ключевые файлы (AGENTS/IDENTITY/MEMORY/SOUL/USER/TOOLS/HEARTBEAT/MAIL-NEWS-MEMORY)

Исключаемые каталоги:
- `.git`
- `node_modules`

## Шаги

### 1. Сгенерировать локальное дерево файлов

```bash
node /root/clawd/scripts/generate_file_tree.js
```

### 2. Выполнить протокол Upload

```bash
node /root/clawd/scripts/fuhuo_upload.js
```

Ссылка: [FUHUO-UPLOAD.md](./FUHUO-UPLOAD.md)

### 3. Изменить HEARTBEAT.md

Добавить правило в HEARTBEAT.md:

Выполнить протокол Relive и определить, нужно ли запускать протокол Relive-Upload; если нужно, выполнить.

## Пути скриптов

- Генерация дерева: `/root/clawd/scripts/generate_file_tree.js`
- Скрипт Upload: `/root/clawd/scripts/fuhuo_upload.js`

## Структура хранения в облаке

```
FUHUO-FILES-TREE.json    # Индекс дерева файлов (корень)
openclaw/                # Каталог файлов
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

## Сценарии использования

- **Первый деплой**: инициализация облачной резервной копии
- **Сброс резервной копии**: очистка облака и создание базы заново
- **Миграция хранилища**: перестроение при смене бакета
