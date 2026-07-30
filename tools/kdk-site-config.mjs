/**
 * Site registry.
 *
 * Two WordPress installs are managed from here: the occupational health office
 * and Casetra. They sit on the same Xserver host and share the same shape -- a
 * static top page with WordPress underneath -- so the same tooling serves both
 * once it knows which site it is talking to.
 *
 * Credentials never live in this file. Each site names a Keychain service and
 * the application password is read from the macOS Keychain at call time.
 */
export const sites = Object.freeze({
  office: Object.freeze({
    key: 'office',
    label: 'KIDUKIコンサルティング産業医事務所',
    wordpressUrl: 'https://kdkconslt-sngyouijm.com',
    publicEntryUrl: 'https://kdkconslt-sngyouijm.com/',
    staticHomeUrl: 'https://consult.kdkconslt-sngyouijm.com/',
    reserveUrl: 'https://reserve.kdkconslt-sngyouijm.com/',
    wordpressUsername: 'kdk-sgj',
    keychainService: 'codex.wordpress.kdkconslt-sngyouijm.com',
    // Lives in this repo; GitHub push deploys it to Azure Static Web Apps.
    staticHomePath: 'consult/index.html',
    staticDeploy: 'azure-swa',
    frontPagePlaceholderId: 18,
  }),
  casetra: Object.freeze({
    key: 'casetra',
    label: 'Casetra',
    wordpressUrl: 'https://casetra.jp',
    publicEntryUrl: 'https://casetra.jp/',
    staticHomeUrl: 'https://casetra.jp/',
    wordpressUsername: 'kdkconsult.sngyijm@gmail.com',
    keychainService: 'codex.wordpress.casetra.jp',
    // The top page is a static file on Xserver pushed over FTPS from its own
    // folder. It is not in this repo and WordPress does not serve it.
    staticHomePath:
      '/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/casetra_active/casetra-site-xserver/index.html',
    staticDeploy: 'xserver-ftps',
  }),
});

export const defaultSiteKey = 'office';

export function resolveSite(siteKey) {
  const key = siteKey || process.env.KDK_SITE || defaultSiteKey;
  const site = sites[key];

  if (!site) {
    throw new Error(`Unknown site "${key}". Known sites: ${Object.keys(sites).join(', ')}`);
  }

  return site;
}

/**
 * The office site. Kept as a named export so the existing scripts that import
 * `siteConfig` directly keep working unchanged.
 */
export const siteConfig = sites.office;

export const wordpressPageInventory = Object.freeze([
  { id: 18, slug: 'home', title: '(WordPress placeholder; static home is canonical)' },
  { id: 24, slug: 'office', title: '事務所について' },
  { id: 29, slug: 'service', title: 'Support' },
  { id: 31, slug: 'field', title: '当事務所の特色について' },
  { id: 37, slug: 'question', title: 'お問い合わせ' },
  { id: 39, slug: 'inquiry', title: 'よくあるご質問' },
  { id: 43, slug: 'greeting', title: 'ご挨拶' },
  { id: 160, slug: 'sangyoui', title: '産業医委任' },
  { id: 162, slug: 'komon', title: '顧問医委任' },
  { id: 164, slug: 'spot', title: 'スポット産業医' },
  { id: 166, slug: 'cloud', title: 'クラウド産業衛生' },
  { id: 250, slug: 'policy', title: 'POLICY' },
  { id: 332, slug: 'office-info', title: '事務所概要' },
  { id: 1030, slug: 'special', title: 'コラム／Column記事' },
  { id: 1038, slug: 'nwssin', title: 'News 新着情報' },
]);

