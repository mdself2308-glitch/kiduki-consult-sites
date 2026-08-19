import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// 公開サイトに出している「18テンプレート・181作業・70法令要求（うち義務55）」を、
// Casetra の本番設定から数え直して一致を確認する。
// 数字が動いたら、まず手順表（config）を確認し、そのうえで公開コピーを直す。

const casetraRoot = process.env.CASETRA_ROOT
  || path.join(os.homedir(), 'Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/casetra_active');

const sources = {
  todoCatalog: path.join(casetraRoot, 'kiduki-consult-api-deploy/config/templatecatalog_v2_series_todolists_v3.json'),
  seriesTemplates: path.join(casetraRoot, 'kiduki-consult-api-deploy/config/seriesTemplates_full_v3.json'),
  legalBasis: path.join(casetraRoot, 'portal-ops/config/legal_id_basis_map.v1.json'),
  casetraHome: path.join(casetraRoot, 'casetra-site-xserver/index.html')
};

const checks = [];
const check = (name, condition, detail) => checks.push({ name, ok: Boolean(condition), ...(detail ? { detail } : {}) });
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const kidukiHome = fs.readFileSync('consult/index.html', 'utf8');
const catalogsAvailable = Object.values(sources).every((file) => fs.existsSync(file));

let counts = null;
if (catalogsAvailable) {
  const todoCatalog = readJson(sources.todoCatalog);
  const seriesTemplates = readJson(sources.seriesTemplates);
  const legalBasis = readJson(sources.legalBasis);

  const templates = todoCatalog.templates.length;
  const todos = todoCatalog.templates.reduce((total, item) => total + (item.todo_list || []).length, 0);
  const legalIds = Object.keys(legalBasis.items);
  const mandatory = legalIds.filter((id) => legalBasis.items[id].enforcement === '義務').length;
  const linked = new Set();
  let todosWithLegalIds = 0;
  const templatesWithUnlinkedTodos = [];
  for (const template of todoCatalog.templates) {
    let unlinked = 0;
    for (const todo of template.todo_list || []) {
      const ids = todo.legal_ids || [];
      if (ids.length > 0) todosWithLegalIds += 1;
      else unlinked += 1;
      for (const id of ids) linked.add(id);
    }
    if (unlinked > 0) {
      templatesWithUnlinkedTodos.push(`${template.template_id}=${unlinked}/${(template.todo_list || []).length}`);
    }
  }

  counts = {
    templates,
    todos,
    legalRequirements: legalIds.length,
    mandatory,
    legalIdsLinkedToTodos: linked.size,
    // 逆向きの数。公開コピーで「各作業に紐付けています」と書けるかはこちらで判断する。
    todosWithLegalIds,
    todosWithoutLegalIds: todos - todosWithLegalIds,
    templatesWithUnlinkedTodos
  };

  check('catalog-has-18-templates', templates === 18, `templates=${templates}`);
  check('series-templates-match-todo-catalog', seriesTemplates.templates.length === templates,
    `seriesTemplates=${seriesTemplates.templates.length}`);
  check('catalog-has-181-todos', todos === 181, `todos=${todos}`);
  check('legal-basis-has-70-requirements', legalIds.length === 70, `legalRequirements=${legalIds.length}`);
  check('legal-basis-has-55-mandatory', mandatory === 55, `mandatory=${mandatory}`);
  // 注意: これは「要求 → 作業」の向きしか見ていない。
  // 「作業 → 要求」（各作業に根拠が付いているか）は counts.todosWithoutLegalIds を読む。
  // 現状 34 件が未紐付けのため、公開コピーに「各作業に紐付けています」とは書けない。
  // 公開コピーは「70件すべてがいずれかの作業に紐付く」＋「作業側は181中147」に修正済みで、
  // 下の no-per-todo-overclaim / states-linked-todo-share がその表現を固定している。
  check('every-legal-requirement-reaches-a-todo', linked.size >= legalIds.length,
    `linked=${linked.size} / master=${legalIds.length}`);
  check('catalog-has-147-todos-with-legal-ids', todosWithLegalIds === 147,
    `todosWithLegalIds=${todosWithLegalIds} / todosWithoutLegalIds=${todos - todosWithLegalIds}`);
  // 未紐付けが作業環境測定・化学物質管理・設備定期点検の3テンプレートに閉じていること。
  // ここが広がったら、公開コピーの「3種類はテンプレート単位」という説明が嘘になる。
  check('unlinked-todos-stay-in-three-templates',
    templatesWithUnlinkedTodos.length === 3
      && ['SER-CHEMICAL', 'SER-ENVMEASURE', 'SER-EQUIPMENT']
        .every((id) => templatesWithUnlinkedTodos.some((entry) => entry.startsWith(`${id}=`))),
    templatesWithUnlinkedTodos.join(', '));
} else {
  check('casetra-catalogs-available', false, `set CASETRA_ROOT (looked in ${casetraRoot})`);
}

check('kiduki-home-publishes-template-count', kidukiHome.includes('<span class="scope-fact-num">18</span>'));
check('kiduki-home-publishes-todo-count', kidukiHome.includes('<span class="scope-fact-num">181</span>'));
check('kiduki-home-publishes-legal-count', kidukiHome.includes('<span class="scope-fact-num">70</span>'));
check('kiduki-home-states-mandatory-share', kidukiHome.includes('うち55件は法律上の義務です'));
check('kiduki-home-keeps-obligation-holder-clear', kidukiHome.includes('義務の名宛人は事業者'));
check('kiduki-home-states-linked-todo-share', kidukiHome.includes('181作業のうち147'));
check('kiduki-home-avoids-per-todo-overclaim', !kidukiHome.includes('各作業に、根拠となる条項'));

if (fs.existsSync(sources.casetraHome)) {
  const casetraHome = fs.readFileSync(sources.casetraHome, 'utf8');
  check('casetra-home-publishes-template-count', casetraHome.includes('<span class="standard-num">18</span>'));
  check('casetra-home-publishes-todo-count', casetraHome.includes('<span class="standard-num">181</span>'));
  check('casetra-home-publishes-legal-count', casetraHome.includes('<span class="standard-num">70</span>'));
  check('casetra-home-states-mandatory-share', casetraHome.includes('うち55件は法律上の義務です'));
  check('casetra-home-keeps-obligation-holder-clear', casetraHome.includes('義務の名宛人は事業者です'));
  check('casetra-home-replaced-vague-standard-claim',
    !casetraHome.includes('専門部門がなくても、標準的な運用を実現します'));
  check('casetra-home-states-linked-todo-share', casetraHome.includes('181作業のうち147'));
  check('casetra-home-avoids-per-todo-overclaim', !casetraHome.includes('各作業に、根拠となる条項'));
  check('casetra-home-keeps-wide-table-scrollable', casetraHome.includes('<div class="risk-table-scroll">'));
} else {
  check('casetra-home-available', false, `not found: ${sources.casetraHome}`);
}

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, counts, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
