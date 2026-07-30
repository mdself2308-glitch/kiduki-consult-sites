import { execFileSync } from 'node:child_process';
import { resolveSite } from './kdk-site-config.mjs';

function readKeychainPassword(service, account) {
  try {
    return execFileSync(
      '/usr/bin/security',
      ['find-generic-password', '-s', service, '-a', account, '-w'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
  } catch {
    throw new Error(
      `WordPress credential is not available in macOS Keychain for service "${service}" and account "${account}".`,
    );
  }
}

/**
 * Read the application password for a site from the macOS Keychain.
 *
 * Defaults to the office site, so every existing caller keeps its behaviour.
 * Pass a site key (or set KDK_SITE) to target another install.
 *
 * The KDK_WP_* environment overrides only apply to the default site: they
 * predate the multi-site registry and would otherwise silently send the office
 * credentials to a different host.
 *
 * @param {string} [siteKey] Key from the site registry.
 */
export function readWordPressCredentials(siteKey) {
  const site = resolveSite(siteKey);
  const isDefaultSite = site.key === 'office';

  const username =
    (isDefaultSite ? process.env.KDK_WP_USERNAME : null) || site.wordpressUsername;
  const password =
    (isDefaultSite ? process.env.KDK_WP_APP_PASSWORD : null) ||
    readKeychainPassword(site.keychainService, username);

  if (!username || !password) {
    throw new Error(`WordPress username or application password is empty for "${site.key}".`);
  }

  return {
    site: site.key,
    label: site.label,
    siteUrl: site.wordpressUrl,
    username,
    password,
  };
}

