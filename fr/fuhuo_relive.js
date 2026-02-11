const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const required = [
  'BACKUP_R2_ACCESS_KEY_ID',
  'BACKUP_R2_SECRET_ACCESS_KEY',
  'BACKUP_R2_ACCOUNT_ID',
  'BACKUP_R2_BUCKET_NAME',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(', ')}`);
  process.exit(1);
}

const accountId = process.env.BACKUP_R2_ACCOUNT_ID;
const endpoint = process.env.BACKUP_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
const bucket = process.env.BACKUP_R2_BUCKET_NAME;
const prefix = (process.env.BACKUP_R2_PREFIX || '').replace(/^\/+|\/+$/g, '');
const basePrefix = prefix ? `${prefix}/` : '';

const client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.BACKUP_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.BACKUP_R2_SECRET_ACCESS_KEY,
  },
});

const rootDir = '/root/clawd';
const openclawDir = fs.existsSync('/root/.openclaw') ? '/root/.openclaw' : '/root/.clawdbot';

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const safeJoin = (base, rel) => {
  const normalized = path.normalize(rel);
  if (normalized.startsWith('..')) {
    throw new Error(`Invalid path: ${rel}`);
  }
  return path.join(base, normalized);
};

const fetchObject = async (key) => {
  const res = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
  return streamToBuffer(res.Body);
};

const parseTree = (content) => {
  const data = JSON.parse(content);
  if (!data || !Array.isArray(data.files)) return [];
  return data.files.map((item) => item.path).filter(Boolean);
};

const restoreFile = async (rel) => {
  const key = `${basePrefix}openclaw/${rel}`;
  const data = await fetchObject(key);

  let targetBase = rootDir;
  let targetRel = rel;

  if (rel.startsWith('_config/')) {
    // Mapper _config/ vers /root/.openclaw ou /root/.clawdbot
    targetBase = openclawDir;
    targetRel = rel.slice('_config/'.length);
  }

  const targetPath = safeJoin(targetBase, targetRel);
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  await fsp.writeFile(targetPath, data);
};

const run = async () => {
  console.log('🔄 Démarrage du protocole FUHUO Relive...\n');

  const treeKey = `${basePrefix}FUHUO-FILES-TREE.json`;
  const treeBody = await fetchObject(treeKey);
  const treeContent = treeBody.toString('utf8');
  const relPaths = parseTree(treeContent);

  console.log(`📋 ${relPaths.length} fichiers à restaurer\n`);

  for (const rel of relPaths) {
    await restoreFile(rel);
    console.log(`  ✅ ${rel}`);
  }

  await fsp.writeFile(path.join(rootDir, 'FUHUO-FILES-TREE.json'), treeContent);

  console.log('\n' + '─'.repeat(60));
  console.log('✅ FUHUO Relive terminé !');
  console.log(`📦 Bucket: ${bucket}`);
  console.log(`📁 Emplacement de restauration: ${rootDir}`);
  console.log('─'.repeat(60));
};

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
