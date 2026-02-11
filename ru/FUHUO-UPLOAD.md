# FUHUO-UPLOAD

## Цель
Сгенерировать локальный `FUHUO-FILES-TREE.json` и выполнить дифференциальную синхронизацию (загрузка и удаление).

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
- Правила сопоставления:
  - Локально `/root/clawd/xxx` → Удалённо `openclaw/xxx`
  - Локально `/root/.openclaw/yyy` или `/root/.clawdbot/yyy` → Удалённо `openclaw/_config/yyy`

## Структура хранения в облаке

```
FUHUO-FILES-TREE.json    # Индекс дерева файлов (корень)
openclaw/                # Каталог файлов
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## Стратегия различий

- Новые файлы: загрузить
- Изменения содержимого: загрузить на основе изменений hash
- Удалено локально: удалить удалённо

## Использование

1. Установить зависимости
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. Сохранить скрипт как `/root/clawd/scripts/fuhuo_upload.js` (уже сохранён)

3. Выполнить Upload
```bash
node /root/clawd/scripts/fuhuo_upload.js
```
