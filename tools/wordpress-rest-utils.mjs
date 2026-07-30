import { readWordPressCredentials } from './wordpress-auth.mjs';

/**
 * @param {string} [siteKey] Site registry key. Omit for the office site.
 */
export function getWordPressEnv(siteKey) {
  return readWordPressCredentials(siteKey);
}

export async function wpRequest(env, method, endpoint, body) {
  const response = await fetch(`${env.siteUrl}${endpoint}`, {
    method,
    redirect: 'manual',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.username}:${env.password}`).toString('base64')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'kdk-wordpress-local-tools/1.0',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && data.message ? data.message : text;
    throw new Error(
      `WordPress REST ${method} ${endpoint} failed: ${response.status} ${message}`,
    );
  }

  return {
    data,
    headers: response.headers,
    status: response.status,
  };
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

export function requireContentType(type) {
  if (!['page', 'post'].includes(type)) {
    throw new Error('Content type must be "page" or "post".');
  }
  return type === 'page' ? 'pages' : 'posts';
}

export function safeStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

