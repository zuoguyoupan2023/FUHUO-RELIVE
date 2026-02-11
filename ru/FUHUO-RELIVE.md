# FUHUO-RELIVE

## Цель
Восстановить файлы из независимого бакета R2 на локальную машину, перезаписав соответствующие пути.

## Требуемые переменные окружения

- BACKUP_R2_ACCESS_KEY_ID
- BACKUP_R2_SECRET_ACCESS_KEY
- BACKUP_R2_ACCOUNT_ID
- BACKUP_R2_BUCKET_NAME
- BACKUP_R2_ENDPOINT (опционально)
- BACKUP_R2_PREFIX (опционально)

## Сопоставление путей

- Локальный корень: `/root/clawd`
- Удалённый файл дерева: `{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`
- Корень удалённых файлов: `{BACKUP_R2_PREFIX}/openclaw/`
- Удалённый относительный путь `openclaw/*` восстанавливается в `/root/.openclaw` или `/root/.clawdbot`

## Структура хранения в облаке

```
FUHUO-FILES-TREE.json    # Индекс дерева файлов (корень)
openclaw/                # Каталог файлов
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## Использование

1. Установить зависимости
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. Сохранить скрипт как `/root/clawd/scripts/fuhuo_relive.js` (уже сохранён)

3. Выполнить Relive
```bash
node /root/clawd/scripts/fuhuo_relive.js
```
