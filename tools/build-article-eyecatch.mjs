#!/usr/bin/env node
/**
 * 記事のアイキャッチを、サイトと同じ配色で組み立てる。
 *
 * 12枚を1枚ずつ生成AIに任せると振れる。実際、2枚目に袋文字と吹き出しの
 * YouTubeサムネイルが出た。逆に完全に同一だと連載ではなく使い回しに見えるうえ、
 * 1つのアイコンが12本すべての内容に合うことはない。
 *
 * そこで、揃えるものと変えるものを分けて固定する。
 *
 *   揃える: 地色、余白、文字の位置と大きさ、事務所名、通し番号の置き方
 *   変える: 群の色（睡眠／実務／つなぎ）、群ラベル、記事ごとのアイコン、番号
 *
 * 配色は consult/index.html の CSS 変数から取っている。サイトを見た人が記事を見て
 * 同じ事務所だと分かる状態にするのが目的で、アイキャッチ単体で目立たせにいかない。
 *
 * 使い方:
 *   node tools/build-article-eyecatch.mjs              # 全12枚
 *   node tools/build-article-eyecatch.mjs --only 01    # 1枚だけ
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT_DIR = path.resolve('content/images');
const TMP_DIR = path.resolve('.eyecatch-tmp');

// consult/index.html の :root から
const GROUND = '#1d3a30';
const GROUND_LIFT = '#24483b';
const CREAM = '#f2ede0';
const MUTED = '#7f9a8d';

// 群ごとの色。どれも同じ緑の系統から外さない。
const GROUPS = {
  sleep: { label: 'SLEEP', accent: '#b6d6c6' },
  dx: { label: 'PRACTICE', accent: '#d9c9a3' },
  bridge: { label: 'BRIDGE', accent: '#8fc9ad' }
};

/**
 * アイコンは記事ごとに変える。線だけで描く。塗りも影も使わない。
 * 座標は 0 0 120 120 の中に収め、呼び出し側で位置と大きさを決める。
 */
/**
 * アイコンは記事ごとに変える。線だけで描き、塗りも影も使わない。
 *
 * 座標は transform を使わず絶対値で書く。Quick Look のレンダラは <g transform> を
 * 落とすことがあり、静かに消えたアイコンは書き出すまで気づけない。
 * 各関数は左上 (x, y) と一辺 120 の枠を受け取る。
 */
const ICONS = {
  moon: (x, y, c) => `<path d="M${x + 78} ${y + 24}a40 40 0 1 0 20 66A44 44 0 0 1 ${x + 78} ${y + 24}Z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><circle cx="${x + 30}" cy="${y + 26}" r="3" fill="${c}"/><circle cx="${x + 44}" cy="${y + 14}" r="2" fill="${c}"/>`,
  wheel: (x, y, c) => `<circle cx="${x + 60}" cy="${y + 60}" r="38" fill="none" stroke="${c}" stroke-width="4"/><circle cx="${x + 60}" cy="${y + 60}" r="13" fill="none" stroke="${c}" stroke-width="4"/><path d="M${x + 60} ${y + 22}v25M${x + 27} ${y + 79}l21-12M${x + 93} ${y + 79} ${x + 72} ${y + 67}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  breath: (x, y, c) => `<path d="M${x + 6} ${y + 60}h18l8-22 10 44 10-34 8 24 10-12h34" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  clock: (x, y, c) => `<circle cx="${x + 60}" cy="${y + 60}" r="38" fill="none" stroke="${c}" stroke-width="4"/><path d="M${x + 60} ${y + 34}v28l18 12" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  chart: (x, y, c) => `<path d="M${x + 14} ${y + 100}h92" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/><rect x="${x + 26}" y="${y + 62}" width="18" height="32" fill="none" stroke="${c}" stroke-width="4"/><rect x="${x + 54}" y="${y + 40}" width="18" height="54" fill="none" stroke="${c}" stroke-width="4"/><rect x="${x + 82}" y="${y + 20}" width="18" height="74" fill="none" stroke="${c}" stroke-width="4"/>`,
  docCheck: (x, y, c) => `<path d="M${x + 30} ${y + 14}h40l20 20v72h-60Z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M${x + 70} ${y + 14}v20h20" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M${x + 44} ${y + 72}l10 10 20-24" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  archive: (x, y, c) => `<rect x="${x + 16}" y="${y + 24}" width="88" height="22" fill="none" stroke="${c}" stroke-width="4"/><path d="M${x + 26} ${y + 46}v56h68v-56" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M${x + 48} ${y + 68}h24" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  calendar: (x, y, c) => `<rect x="${x + 16}" y="${y + 26}" width="88" height="76" rx="5" fill="none" stroke="${c}" stroke-width="4"/><path d="M${x + 16} ${y + 50}h88M${x + 40} ${y + 14}v20M${x + 80} ${y + 14}v20" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="${x + 40}" cy="${y + 70}" r="3.5" fill="${c}"/><circle cx="${x + 60}" cy="${y + 70}" r="3.5" fill="${c}"/><circle cx="${x + 80}" cy="${y + 70}" r="3.5" fill="${c}"/>`,
  docArrow: (x, y, c) => `<path d="M${x + 20} ${y + 12}h40l20 20v34" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M${x + 60} ${y + 12}v20h20" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M${x + 20} ${y + 12}v72h28" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M${x + 56} ${y + 98}h44m-14-14 14 14-14 14" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  release: (x, y, c) => `<circle cx="${x + 62}" cy="${y + 68}" r="34" fill="none" stroke="${c}" stroke-width="4"/><path d="M${x + 62} ${y + 46}v22l15 10" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x + 14} ${y + 32}l12-14 12 14" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x + 26} ${y + 18}v26" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  flow: (x, y, c) => `<circle cx="${x + 26}" cy="${y + 34}" r="15" fill="none" stroke="${c}" stroke-width="4"/><circle cx="${x + 94}" cy="${y + 86}" r="15" fill="none" stroke="${c}" stroke-width="4"/><path d="M${x + 39} ${y + 45}c20 6 26 16 38 26" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M${x + 66} ${y + 64}l12 5 4-12" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  branch: (x, y, c) => `<path d="M${x + 10} ${y + 98}h26c24 0 24-34 48-34h18" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M${x + 36} ${y + 98}h66" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 9"/><path d="M${x + 88} ${y + 50}l14 14-14 14" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
};

const SPECS = [
  { n: '01', slug: 'night-shift-sleep-management', group: 'sleep', title: '夜勤・交代勤務の睡眠対策', sub: 'シフトと仮眠環境から見直す', icon: 'moon' },
  { n: '02', slug: 'drowsy-driving-workplace-safety', group: 'sleep', title: '運転業務の眠気リスク', sub: '個人の不注意で終わらせない', icon: 'wheel' },
  { n: '03', slug: 'sas-screening-at-work', group: 'sleep', title: '職場のSAS対策', sub: '受診勧奨から就業措置へ', icon: 'breath' },
  { n: '04', slug: 'long-hours-interview-sleep', group: 'sleep', title: '長時間労働の面接指導', sub: '睡眠を軸に確認する', icon: 'clock' },
  { n: '05', slug: 'kenko-keiei-sleep-measures', group: 'sleep', title: '健康経営の睡眠施策', sub: '調査票に書ける形にする', icon: 'chart' },
  { n: '06', slug: 'return-to-work-sleep-assessment', group: 'sleep', title: '復職時の睡眠評価', sub: '診断書だけでは決まらない', icon: 'docCheck' },
  { n: '07', slug: 'committee-minutes-three-year-retention', group: 'dx', title: '衛生委員会の議事録', sub: '3年保存を仕組みにする', icon: 'archive' },
  { n: '08', slug: 'industrial-physician-scheduling', group: 'dx', title: '産業医面談の日程調整', sub: '先に決めておく3つ', icon: 'calendar' },
  { n: '09', slug: 'after-the-physician-opinion', group: 'dx', title: '意見書が来たあと', sub: '会社が決めて記録する', icon: 'docArrow' },
  { n: '10', slug: 'work-restriction-release-management', group: 'dx', title: '就業制限の解除忘れ', sub: '期限管理を設計する', icon: 'release' },
  { n: '11', slug: 'sleep-findings-to-work-accommodation', group: 'bridge', title: '睡眠の問題を見つけたあと', sub: '就業上の配慮に落とす', icon: 'flow' },
  { n: '12', slug: 'when-sleep-becomes-a-return-to-work-decision', group: 'bridge', title: '睡眠が復職判断に変わる', sub: '復職日を決める前に', icon: 'branch' }
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildSvg(spec) {
  const g = GROUPS[spec.group];
  // Quick Look は正方形に収めて返す。ならば最初から正方形で描き、
  // 帯の位置を自分で決めてから切り出す。レンダラの余白計算に依存しない。
  const T = 280; // 上の余白。ここから 720 が実際のアイキャッチ。
  // 見出しは長いほど少し詰める。折り返して行が崩れるより1行に収める。
  const titleSize = spec.title.length <= 10 ? 52 : spec.title.length <= 12 ? 47 : 43;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1280" viewBox="0 0 1280 1280">
  <rect width="1280" height="1280" fill="${GROUND}"/>
  <path d="M0 ${T + 720} L1280 ${T} L1280 ${T + 720}Z" fill="${GROUND_LIFT}" opacity="0.5"/>
  <rect x="0" y="${T}" width="14" height="720" fill="${g.accent}"/>

  <text x="96" y="${T + 252}" font-family="Hiragino Sans, sans-serif" font-size="19" font-weight="600" letter-spacing="6" fill="${g.accent}">${g.label}</text>
  <text x="96" y="${T + 336}" font-family="Hiragino Sans, sans-serif" font-size="${titleSize}" font-weight="700" fill="${CREAM}">${esc(spec.title)}</text>
  <rect x="96" y="${T + 368}" width="56" height="3" fill="${g.accent}"/>
  <text x="96" y="${T + 424}" font-family="Hiragino Sans, sans-serif" font-size="25" font-weight="400" fill="${g.accent}">${esc(spec.sub)}</text>

  ${ICONS[spec.icon](1010, T + 300, g.accent)}

  <text x="96" y="${T + 646}" font-family="Hiragino Sans, sans-serif" font-size="17" font-weight="400" fill="${MUTED}">KIDUKIコンサルティング産業医事務所</text>
  <text x="1184" y="${T + 650}" text-anchor="end" font-family="Hiragino Sans, sans-serif" font-size="64" font-weight="700" fill="${g.accent}" opacity="0.22">${spec.n}</text>
</svg>`;
}

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

let made = 0;
for (const spec of SPECS) {
  if (only && spec.n !== only) continue;
  const svgPath = path.join(TMP_DIR, `${spec.slug}.svg`);
  fs.writeFileSync(svgPath, buildSvg(spec), 'utf8');

  // Quick Look は正方形に収めて返すので、1280 幅で描かせてから上下を切る。
  execFileSync('qlmanage', ['-t', '-s', '1280', '-o', TMP_DIR, svgPath], { stdio: 'ignore' });
  const rendered = path.join(TMP_DIR, `${spec.slug}.svg.png`);
  if (!fs.existsSync(rendered)) throw new Error(`render failed: ${spec.slug}`);
  const out = path.join(OUT_DIR, `${spec.slug}.png`);
  execFileSync('sips', ['-c', '720', '1280', '--cropOffset', '280', '0', rendered, '--out', out], { stdio: 'ignore' });
  made += 1;
  console.log(`  ${spec.n}  ${spec.slug}`);
}

fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log(`\n${made}枚を ${path.relative(process.cwd(), OUT_DIR)} に書き出しました。`);
