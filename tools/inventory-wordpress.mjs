import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  safeStamp,
  wpRequest,
} from './wordpress-rest-utils.mjs';

const env = getWordPressEnv();

async function collect(restBase) {
  const items = [];
  let page = 1;
  while (true) {
    const response = await wpRequest(
      env,
      'GET',
      `/wp-json/wp/v2/${restBase}?context=edit&per_page=100&page=${page}&status=publish,draft,pending,private,future&_fields=id,slug,status,title,modified,parent,link`,
    );
    items.push(...response.data);
    const totalPages = Number(response.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) break;
    page += 1;
  }
  return items;
}

const [pages, posts] = await Promise.all([collect('pages'), collect('posts')]);
const report = {
  generatedAt: new Date().toISOString(),
  site: env.siteUrl,
  counts: { pages: pages.length, posts: posts.length },
  pages: pages.map((item) => ({
    id: item.id,
    slug: item.slug,
    status: item.status,
    title: item.title?.raw || item.title?.rendered || '',
    parent: item.parent || 0,
    modified: item.modified,
    link: item.link,
  })),
  posts: posts.map((item) => ({
    id: item.id,
    slug: item.slug,
    status: item.status,
    title: item.title?.raw || item.title?.rendered || '',
    modified: item.modified,
    link: item.link,
  })),
};

const reportDir = path.resolve('reports/runtime');
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(
  reportDir,
  `wordpress-inventory-${safeStamp()}.json`,
);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      ok: true,
      reportPath,
      counts: report.counts,
    },
    null,
    2,
  ),
);

