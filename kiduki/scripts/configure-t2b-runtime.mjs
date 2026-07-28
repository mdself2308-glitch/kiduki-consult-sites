#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const apply = process.argv.includes('--apply');
const backup = process.argv.includes('--backup');
const backupConfirmed = process.argv.includes('--backup-confirmed');
const cleanupTemporary = process.argv.includes('--cleanup-temporary');
const envPath = path.resolve('.env');
const temporarySnippetName = 'Codex T2B runtime configuration bridge v2';
const legacyTemporarySnippetNames = [
  'Codex T2B runtime configuration bridge',
];
const temporaryRoute = '/wp-json/kiduki-t2b/v1/runtime';
const temporaryPurgeRoute = '/wp-json/kiduki-t2b/v1/purge';

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing runtime configuration without --backup --backup-confirmed.',
  );
}

function readEnvFile(filePath) {
  const values = new Map();
  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values.set(match[1], match[2]);
  }
  return values;
}

if (!fs.existsSync(envPath)) {
  throw new Error('.env is missing.');
}

const localEnv = readEnvFile(envPath);
const mailPassword = String(
  localEnv.get('XSERVER_INFO_MAIL_PASSWORD') || '',
).trim();

if (!mailPassword) {
  throw new Error('XSERVER_INFO_MAIL_PASSWORD is missing from .env.');
}

const plannedConfiguration = {
  mailer: 'smtp',
  fromEmail: 'info@kdkconslt-sngyouijm.com',
  fromName: '東京KIDUKIコンサルティング産業医事務所',
  forceFromEmail: true,
  forceFromName: true,
  returnPath: true,
  smtpHost: 'sv14329.xserver.jp',
  smtpPort: 465,
  encryption: 'ssl',
  authentication: true,
  smtpUser: 'info@kdkconslt-sngyouijm.com',
  w3TotalCacheRejectUris: [
    '^/contact/?$',
    '^/contact/thanks/?$',
    '^/question/?$',
  ],
};

if (!apply && !cleanupTemporary) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        writes: false,
        passwordPresent: true,
        passwordDisplayed: false,
        plannedConfiguration,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const env = getWordPressEnv();

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};

\t$read_state = function () {
\t\tif ( ! class_exists( '\\\\WPMailSMTP\\\\Options' ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'kiduki_wp_mail_smtp_missing',
\t\t\t\t'WP Mail SMTP is not active.',
\t\t\t\tarray( 'status' => 409 )
\t\t\t);
\t\t}

\t\t$options = \\WPMailSMTP\\Options::init();
\t\t$reject_uris = array();
\t\tif ( class_exists( '\\\\W3TC\\\\Dispatcher' ) ) {
\t\t\t$config = \\W3TC\\Dispatcher::config();
\t\t\t$reject_uris = $config->get_array( 'pgcache.reject.uri' );
\t\t}

\t\treturn array(
\t\t\t'wp_mail_smtp' => array(
\t\t\t\t'mailer'           => $options->get( 'mail', 'mailer' ),
\t\t\t\t'from_email'       => $options->get( 'mail', 'from_email' ),
\t\t\t\t'from_name'        => $options->get( 'mail', 'from_name' ),
\t\t\t\t'from_email_force' => (bool) $options->get( 'mail', 'from_email_force' ),
\t\t\t\t'from_name_force'  => (bool) $options->get( 'mail', 'from_name_force' ),
\t\t\t\t'return_path'      => (bool) $options->get( 'mail', 'return_path' ),
\t\t\t\t'smtp_host'        => $options->get( 'smtp', 'host' ),
\t\t\t\t'smtp_port'        => (int) $options->get( 'smtp', 'port' ),
\t\t\t\t'encryption'       => $options->get( 'smtp', 'encryption' ),
\t\t\t\t'autotls'          => (bool) $options->get( 'smtp', 'autotls' ),
\t\t\t\t'authentication'   => (bool) $options->get( 'smtp', 'auth' ),
\t\t\t\t'smtp_user'        => $options->get( 'smtp', 'user' ),
\t\t\t\t'password_set'     => '' !== (string) $options->get( 'smtp', 'pass' ),
\t\t\t),
\t\t\t'w3_total_cache' => array(
\t\t\t\t'available'   => class_exists( '\\\\W3TC\\\\Dispatcher' ),
\t\t\t\t'reject_uris' => array_values( $reject_uris ),
\t\t\t),
\t\t);
\t};

\tregister_rest_route(
\t\t'kiduki-t2b/v1',
\t\t'/runtime',
\t\tarray(
\t\t\tarray(
\t\t\t\t'methods'             => 'GET',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => $read_state,
\t\t\t),
\t\t\tarray(
\t\t\t\t'methods'             => 'POST',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => function ( WP_REST_Request $request ) use ( $read_state ) {
\t\t\t\t\t$password = (string) $request->get_param( 'mail_password' );
\t\t\t\t\tif ( '' === trim( $password ) ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_mail_password_missing',
\t\t\t\t\t\t\t'Mail password is required.',
\t\t\t\t\t\t\tarray( 'status' => 400 )
\t\t\t\t\t\t);
\t\t\t\t\t}

\t\t\t\t\t$options = array(
\t\t\t\t\t\t'mail' => array(
\t\t\t\t\t\t\t'from_email'       => 'info@kdkconslt-sngyouijm.com',
\t\t\t\t\t\t\t'from_name'        => '東京KIDUKIコンサルティング産業医事務所',
\t\t\t\t\t\t\t'mailer'           => 'smtp',
\t\t\t\t\t\t\t'return_path'      => true,
\t\t\t\t\t\t\t'from_email_force' => true,
\t\t\t\t\t\t\t'from_name_force'  => true,
\t\t\t\t\t\t),
\t\t\t\t\t\t'smtp' => array(
\t\t\t\t\t\t\t'host'       => 'sv14329.xserver.jp',
\t\t\t\t\t\t\t'port'       => 465,
\t\t\t\t\t\t\t'encryption' => 'ssl',
\t\t\t\t\t\t\t'autotls'    => false,
\t\t\t\t\t\t\t'auth'       => true,
\t\t\t\t\t\t\t'user'       => 'info@kdkconslt-sngyouijm.com',
\t\t\t\t\t\t\t'pass'       => $password,
\t\t\t\t\t\t),
\t\t\t\t\t);
\t\t\t\t\t\\WPMailSMTP\\Options::init()->set( $options, false, false );

\t\t\t\t\tif ( class_exists( '\\\\W3TC\\\\Dispatcher' ) ) {
\t\t\t\t\t\t$config = \\W3TC\\Dispatcher::config();
\t\t\t\t\t\t$reject_uris = $config->get_array( 'pgcache.reject.uri' );
\t\t\t\t\t\tforeach ( array( '^/contact/?$', '^/contact/thanks/?$', '^/question/?$' ) as $pattern ) {
\t\t\t\t\t\t\tif ( ! in_array( $pattern, $reject_uris, true ) ) {
\t\t\t\t\t\t\t\t$reject_uris[] = $pattern;
\t\t\t\t\t\t\t}
\t\t\t\t\t\t}
\t\t\t\t\t\t$config->set( 'pgcache.reject.uri', array_values( $reject_uris ) );
\t\t\t\t\t\t$config->save();
\t\t\t\t\t\tif ( function_exists( 'w3tc_flush_url' ) ) {
\t\t\t\t\t\t\tw3tc_flush_url( home_url( '/question/' ) );
\t\t\t\t\t\t}
\t\t\t\t\t\tif ( function_exists( 'w3tc_flush_all' ) ) {
\t\t\t\t\t\t\tw3tc_flush_all();
\t\t\t\t\t\t}
\t\t\t\t\t}

\t\t\t\t\treturn $read_state();
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-t2b/v1',
\t\t'/purge',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback'            => function ( WP_REST_Request $request ) {
\t\t\t\t$ids = array_map( 'absint', (array) $request->get_param( 'snippet_ids' ) );
\t\t\t\t$deleted = array();
\t\t\t\tforeach ( array_filter( $ids ) as $id ) {
\t\t\t\t\tif ( \\Code_Snippets\\delete_snippet( $id, false ) ) {
\t\t\t\t\t\t$deleted[] = $id;
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\treturn array( 'deleted' => $deleted );
\t\t\t},
\t\t)
\t);
} );
`;
}

async function findTemporarySnippets() {
  const snippets = await wpRequest(
    env,
    'GET',
    '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
  );
  return snippets.data.filter((snippet) =>
    [temporarySnippetName, ...legacyTemporarySnippetNames].includes(
      snippet.name,
    ),
  );
}

const temporarySnippets = await findTemporarySnippets();
const duplicateSnippets = temporarySnippets.filter(
  (snippet) => snippet.name === temporarySnippetName,
);
const staleSnippetIds = temporarySnippets
  .filter((snippet) => legacyTemporarySnippetNames.includes(snippet.name))
  .map((snippet) => Number(snippet.id));

if (cleanupTemporary) {
  if (!apply) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          writes: false,
          temporarySnippets: temporarySnippets.map((snippet) => ({
            id: snippet.id,
            name: snippet.name,
            active: Boolean(snippet.active),
            status: snippet.status || null,
            scope: snippet.scope || null,
          })),
          plannedOperations: temporarySnippets.flatMap((snippet) => [
            `Deactivate temporary snippet ${snippet.id}.`,
            `Delete temporary snippet ${snippet.id}.`,
          ]),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const cleaned = [];
  for (const snippet of temporarySnippets) {
    await wpRequest(
      env,
      'POST',
      `/wp-json/code-snippets/v1/snippets/${snippet.id}/deactivate`,
      {},
    );
    await wpRequest(
      env,
      'DELETE',
      `/wp-json/code-snippets/v1/snippets/${snippet.id}`,
    );
    cleaned.push(Number(snippet.id));
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'cleanup',
        cleanedTemporarySnippetIds: cleaned,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (duplicateSnippets.length > 0) {
  throw new Error(
    `A previous temporary snippet still exists: ${duplicateSnippets
      .map((snippet) => snippet.id)
      .join(', ')}`,
  );
}

let snippetId = null;
const cleanup = {
  deactivated: false,
  deleted: false,
};

try {
  const created = await wpRequest(
    env,
    'POST',
    '/wp-json/code-snippets/v1/snippets',
    {
      name: temporarySnippetName,
      desc: 'Temporary T2B bridge. Must be removed immediately after use.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 't2b'],
      scope: 'global',
      active: false,
      priority: 10,
      network: false,
      shared_network: false,
    },
  );

  snippetId = Number(created.data.id);
  if (!snippetId) {
    throw new Error('Code Snippets did not return a snippet id.');
  }

  await wpRequest(
    env,
    'POST',
    `/wp-json/code-snippets/v1/snippets/${snippetId}/activate`,
    {},
  );

  const before = await wpRequest(env, 'GET', temporaryRoute);
  const backupDir = path.resolve('backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `wp-t2b-runtime-before-${safeStamp()}.json`,
  );
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(before.data, null, 2)}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);

  const updated = await wpRequest(env, 'POST', temporaryRoute, {
    mail_password: mailPassword,
  });

  const state = updated.data;
  const smtp = state.wp_mail_smtp || {};
  const rejectUris = state.w3_total_cache?.reject_uris || [];
  const valid =
    smtp.mailer === 'smtp' &&
    smtp.from_email === plannedConfiguration.fromEmail &&
    smtp.smtp_host === plannedConfiguration.smtpHost &&
    smtp.smtp_port === plannedConfiguration.smtpPort &&
    smtp.encryption === plannedConfiguration.encryption &&
    smtp.authentication === true &&
    smtp.smtp_user === plannedConfiguration.smtpUser &&
    smtp.password_set === true &&
    plannedConfiguration.w3TotalCacheRejectUris.every((pattern) =>
      rejectUris.includes(pattern),
    );

  if (!valid) {
    throw new Error('T2B runtime configuration verification failed.');
  }

  const purged = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_ids: [...staleSnippetIds, snippetId],
  });
  const purgedIds = (purged.data.deleted || []).map(Number);
  if (!purgedIds.includes(snippetId)) {
    throw new Error('Temporary T2B bridge did not purge itself.');
  }
  cleanup.deactivated = true;
  cleanup.deleted = true;

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        backupPath,
        passwordDisplayed: false,
        purgedTemporarySnippetIds: purgedIds,
        state,
      },
      null,
      2,
    ),
  );
} finally {
  if (snippetId && !cleanup.deleted) {
    try {
      await wpRequest(
        env,
        'POST',
        `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`,
        {},
      );
      cleanup.deactivated = true;
    } catch {
      cleanup.deactivated = false;
    }

    try {
      await wpRequest(
        env,
        'DELETE',
        `/wp-json/code-snippets/v1/snippets/${snippetId}`,
      );
      cleanup.deleted = true;
    } catch {
      cleanup.deleted = false;
    }
  }

  if (snippetId && (!cleanup.deactivated || !cleanup.deleted)) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          temporarySnippetCleanup: {
            id: snippetId,
            ...cleanup,
          },
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}
