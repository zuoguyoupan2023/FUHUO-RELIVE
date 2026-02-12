#!/usr/bin/env node
/**
 * R2 Native Client - 自包含 R2 客户端
 * 只依赖 Node.js 内置模块，实现 AWS SigV4 签名和 R2 API 调用
 *
 * 使用方法:
 * const r2 = require('./lib/r2-client-native');
 * const data = await r2.getObject('openclaw/test.txt');
 */

const https = require('https');
const crypto = require('crypto');
const { parse } = require('url');

// 检查环境变量
const requiredEnvVars = [
  'BACKUP_R2_ACCESS_KEY_ID',
  'BACKUP_R2_SECRET_ACCESS_KEY',
  'BACKUP_R2_ACCOUNT_ID',
  'BACKUP_R2_BUCKET_NAME',
];

/**
 * 检查环境变量
 */
function checkEnvVars() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`缺少环境变量: ${missing.join(', ')}`);
  }
}

/**
 * AWS Signature V4 签名
 */
function signRequest(method, path, queryParams = {}, body = '', contentType = 'application/octet-stream') {
  checkEnvVars();

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';
  const region = 'auto';

  // 构建查询字符串
  const queryString = Object.entries(queryParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  // 规范化 URI
  const canonicalUri = path;

  // 规范化查询字符串
  const canonicalQuery = queryString;

  // 计算 payload hash
  const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex');

  // 规范化头
  const host = `${process.env.BACKUP_R2_BUCKET_NAME}.${process.env.BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;

  // 签名头列表
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  // 规范请求
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

  // 待签名字符串
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  // 计算签名密钥
  const kDate = crypto.createHmac('sha256', `AWS4${process.env.BACKUP_R2_SECRET_ACCESS_KEY}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

  // 计算签名
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  // 构造授权头
  const authorization = `AWS4-HMAC-SHA256 Credential=${process.env.BACKUP_R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'Authorization': authorization,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'Host': host,
    'Content-Type': contentType
  };
}

/**
 * 发送 HTTPS 请求
 */
function request(method, key, body = '', contentType = 'application/octet-stream', additionalHeaders = {}) {
  checkEnvVars();

  return new Promise((resolve, reject) => {
    const host = `${process.env.BACKUP_R2_BUCKET_NAME}.${process.env.BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const path = `/${key}`;

    const headers = signRequest(method, path, {}, body, contentType);

    // 合并额外的请求头
    Object.assign(headers, additionalHeaders);

    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.toString()}`));
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * 获取对象
 */
async function getObject(key) {
  const response = await request('GET', key);
  return response.body;
}

/**
 * 上传对象
 */
async function putObject(key, body, contentType = 'application/octet-stream') {
  await request('PUT', key, body, contentType);
  return true;
}

/**
 * 删除对象
 */
async function deleteObject(key) {
  await request('DELETE', key);
  return true;
}

/**
 * 批量删除对象
 */
async function deleteObjects(keys) {
  if (!keys || keys.length === 0) return { deleted: [] };

  // 构造 XML 请求体
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Delete>
  <Quiet>false</Quiet>
${keys.map(key => `  <Object><Key>${key}</Key></Object>`).join('\n')}
</Delete>`;

  const response = await request('POST', 'delete?delete', xml, 'application/xml', {
    'Content-Md5': crypto.createHash('md5').update(xml).digest('base64')
  });

  // 解析响应
  // TODO: 解析 XML 响应获取删除结果

  return {
    deleted: keys,
    errors: []
  };
}

/**
 * 列出对象 (XML 解析版本)
 */
async function listObjectsV2(prefix = '', continuationToken = null) {
  checkEnvVars();

  const queryParams = {
    'list-type': '2'
  };

  if (prefix) {
    queryParams.prefix = prefix;
  }

  if (continuationToken) {
    queryParams['continuation-token'] = continuationToken;
  }

  // 构建查询字符串
  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const host = `${process.env.BACKUP_R2_BUCKET_NAME}.${process.env.BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = '/';

  const headers = signRequest('GET', path, queryParams);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      path: `/?${queryString}`,
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 解析 XML 响应
          const objects = parseListObjectsV2XML(data);
          resolve(objects);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 解析 ListObjectsV2 XML 响应
 */
function parseListObjectsV2XML(xmlString) {
  const objects = [];

  // 简单的 XML 解析（不依赖外部库）
  const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
  const keyRegex = /<Key>(.*?)<\/Key>/;
  const sizeRegex = /<Size>(.*?)<\/Size>/;
  const lastModifiedRegex = /<LastModified>(.*?)<\/LastModified>/;
  const tokenRegex = /<NextContinuationToken>(.*?)<\/NextContinuationToken>/;

  let match;
  while ((match = contentsRegex.exec(xmlString)) !== null) {
    const content = match[1];
    const keyMatch = content.match(keyRegex);
    const sizeMatch = content.match(sizeRegex);
    const lastModifiedMatch = content.match(lastModifiedRegex);

    if (keyMatch) {
      objects.push({
        Key: keyMatch[1],
        Size: sizeMatch ? parseInt(sizeMatch[1]) : 0,
        LastModified: lastModifiedMatch ? new Date(lastModifiedMatch[1]) : null
      });
    }
  }

  // 提取 continuation token
  const tokenMatch = xmlString.match(tokenRegex);
  const continuationToken = tokenMatch ? tokenMatch[1] : null;

  return {
    objects,
    continuationToken
  };
}

/**
 * 列出所有对象（处理分页）
 */
async function listAllObjects(prefix = '') {
  const allObjects = [];
  let continuationToken = null;

  do {
    const result = await listObjectsV2(prefix, continuationToken);
    allObjects.push(...result.objects);
    continuationToken = result.continuationToken;
  } while (continuationToken);

  return allObjects;
}

module.exports = {
  checkEnvVars,
  signRequest,
  request,
  getObject,
  putObject,
  deleteObject,
  deleteObjects,
  listObjectsV2,
  listAllObjects
};
