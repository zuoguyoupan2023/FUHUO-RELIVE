# FUHUO-PROTOCOL

## Цель
При запуске контейнера или в ключевых точках автоматически определить, какой подпроtocol выполнить: Birth, Upload или Relive.

## Проверки входа

1. Существует ли `FUHUO-FILES-TREE.json` в локальной корневой директории (по умолчанию: `/root/clawd/FUHUO-FILES-TREE.json`)

2. Можно ли прочитать следующие переменные окружения и не пусты ли они:

   - BACKUP_R2_ACCOUNT_ID
   - BACKUP_R2_ACCESS_KEY_ID
   - BACKUP_R2_SECRET_ACCESS_KEY
   - BACKUP_R2_BUCKET_NAME

3. При провале проверки вывести полный результат человеку

## Проверка облака

Считать `FUHUO-FILES-TREE.json` из бакета BACKUP_R2_BUCKET_NAME (по умолчанию: `{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`, или `FUHUO-FILES-TREE.json` без префикса) и сравнить с локальным `FUHUO-FILES-TREE.json`. Если удалённого файла нет, считать это различием.

## Структура хранения в облаке

```
FUHUO-FILES-TREE.json    # Индекс дерева файлов (корень)
openclaw/                # Каталог файлов
├── AGENTS.md            # Отображается на /root/clawd/AGENTS.md
├── IDENTITY.md          # Отображается на /root/clawd/IDENTITY.md
├── MEMORY.md            # Отображается на /root/clawd/MEMORY.md
├── SOUL.md              # Отображается на /root/clawd/SOUL.md
├── USER.md              # Отображается на /root/clawd/USER.md
├── TOOLS.md             # Отображается на /root/clawd/TOOLS.md
├── HEARTBEAT.md         # Отображается на /root/clawd/HEARTBEAT.md
├── MAIL-NEWS-MEMORY.md  # Отображается на /root/clawd/MAIL-NEWS-MEMORY.md
├── config/              # Отображается на /root/clawd/config/
├── scripts/             # Отображается на /root/clawd/scripts/
├── skills/              # Отображается на /root/clawd/skills/
├── fuhuo/               # Отображается на /root/clawd/fuhuo/
└── _config/             # Отображается на /root/.openclaw/ или /root/.clawdbot/
    └── openclaw.json
```

## Выбор подпроtocolа

- Нет `FUHUO-FILES-TREE.json` ни локально, ни в облаке: выполнить **Birth** FUHUO-BIRTH.md
- Локально есть, в облаке нет: выполнить **Upload** FUHUO-UPLOAD.md
- И локально, и в облаке есть:
  - Есть различия:
    - Если количество файлов в облаке > локального: выполнить **Relive** FUHUO-RELIVE.md
    - Иначе (локальное больше или равно): выполнить **Upload** FUHUO-UPLOAD.md
  - Нет различий: не выполнять Upload
- Локально нет, в облаке есть: выполнить **Relive** FUHUO-RELIVE.md

### Детали логики решения

Если дерево есть и локально, и в облаке, но оно отличается, решение принимается по количеству файлов:

| Сценарий | Локальные файлы | Облачные файлы | Протокол |
|----------|-----------------|----------------|----------|
| В облаке больше | 49 | 50 | Relive |
| Локально больше | 50 | 49 | Upload |
| Количество равно, но контент отличается | 49 | 49 | Upload |

**Причина**:
- В облаке больше → возможно, локальные файлы потеряны после перезапуска, нужна восстановление
- Локально больше → есть новые локальные файлы, нужно загрузить в облако
- Равно, но отличается → локальные файлы изменены, загрузить новые версии
