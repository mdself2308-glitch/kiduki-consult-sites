import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Correct the WP Mail SMTP "from name" without touching the rest of the
 * mail configuration.
 *
 * configure-t2b-runtime.mjs owns the full SMTP setup, but rerunning it to
 * change one label would require the mailbox password and would rewrite host,
 * port, encryption and auth as a side effect. This script writes only
 * mail.from_name, and asserts that every other mail key is byte-identical
 * afterwards.
 */
const temporarySnippetName = 'Codex R15 mail from_name bridge';
const temporaryRoute = '/wp-json/kiduki-r15/v1/mail-from-name';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const fromName = typeof args.name === 'string' ? args.name : null;

if (!fromName) {
  throw new Error('Usage: --name "KIDUKIコンサルティング産業医事務所" [--apply --backup --backup-confirmed]');
}
if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing to change mail settings without --backup --backup-confirmed.');
}
if (/['\\]/.test(fromName)) {
  throw new Error('The from name must not contain quotes or backslashes.');
}

const env = getWordPressEnv();

function buildSnippetCode() {
  const write = apply ? 'true' : 'false';

  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-r15/v1',
\t\t'/mail-from-name',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function () {
\t\t\t\tif ( ! class_exists( '\\\\WPMailSMTP\\\\Options' ) ) {
\t\t\t\t\treturn new WP_Error( 'kiduki_smtp_missing', 'WP Mail SMTP is not active.', array( 'status' => 409 ) );
\t\t\t\t}

\t\t\t\t$options = \\WPMailSMTP\\Options::init();
\t\t\t\t$all     = $options->get_all();
\t\t\t\t$mail    = isset( $all['mail'] ) && is_array( $all['mail'] ) ? $all['mail'] : array();
\t\t\t\t$before  = $mail;
\t\t\t\t$target  = '${fromName}';

\t\t\t\t$changed = false;
\t\t\t\tif ( ${write} && ( ! isset( $mail['from_name'] ) || $target !== $mail['from_name'] ) ) {
\t\t\t\t\t$mail['from_name'] = $target;
\t\t\t\t\t$all['mail']       = $mail;
\t\t\t\t\t$options->set( $all, false, false );
\t\t\t\t\t$changed = true;
\t\t\t\t}

\t\t\t\t$after = \\WPMailSMTP\\Options::init()->get_all();
\t\t\t\t$afterMail = isset( $after['mail'] ) && is_array( $after['mail'] ) ? $after['mail'] : array();

\t\t\t\t// Every mail key other than from_name must be untouched.
\t\t\t\t$drift = array();
\t\t\t\tforeach ( $before as $k => $v ) {
\t\t\t\t\tif ( 'from_name' === $k ) {
\t\t\t\t\t\tcontinue;
\t\t\t\t\t}
\t\t\t\t\t$now = $afterMail[ $k ] ?? null;
\t\t\t\t\tif ( maybe_serialize( $v ) !== maybe_serialize( $now ) ) {
\t\t\t\t\t\t$drift[] = $k;
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\treturn array(
\t\t\t\t\t'fromNameBefore' => (string) ( $before['from_name'] ?? '' ),
\t\t\t\t\t'fromNameAfter'  => (string) ( $afterMail['from_name'] ?? '' ),
\t\t\t\t\t'changed'        => $changed,
\t\t\t\t\t'forceFromName'  => (bool) ( $afterMail['from_name_force'] ?? false ),
\t\t\t\t\t'fromEmail'      => (string) ( $afterMail['from_email'] ?? '' ),
\t\t\t\t\t'mailer'         => (string) ( $after['mail']['mailer'] ?? '' ),
\t\t\t\t\t'otherKeysDrift' => $drift,
\t\t\t\t\t'mailBefore'     => $before,
\t\t\t\t);
\t\t\t},
\t\t)
\t);
} );
`;
}

const existing = await wpRequest(
  env,
  'GET',
  '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
);
const stale = existing.data.filter(
  (s) => s.name === temporarySnippetName && (s.code || '').trim().length > 0,
);
if (stale.length > 0) {
  throw new Error(`A previous temporary snippet still exists: ${stale.map((s) => s.id).join(', ')}`);
}

let snippetId = null;
let deleted = false;

try {
  const created = await wpRequest(env, 'POST', '/wp-json/code-snippets/v1/snippets', {
    name: temporarySnippetName,
    desc: 'Temporary R15 bridge. Removed immediately after use.',
    code: buildSnippetCode(),
    tags: ['codex', 'temporary', 'r15'],
    scope: 'global',
    active: false,
    priority: 10,
    network: false,
    shared_network: false,
  });

  snippetId = Number(created.data.id);
  if (!snippetId) {
    throw new Error('Code Snippets did not return a snippet id.');
  }

  await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/activate`, {});

  const result = await wpRequest(env, 'POST', temporaryRoute, {});
  const data = result.data;

  if (apply && backup && data.mailBefore) {
    const dir = path.resolve('backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `wp-mail-smtp-mail-before-${safeStamp()}.json`);
    // The mailer password lives elsewhere in the option tree, but redact
    // anything password-shaped that may appear under mail/ regardless.
    const redacted = Object.fromEntries(
      Object.entries(data.mailBefore).map(([k, v]) => [k, /pass|secret|key|token/i.test(k) ? '[redacted]' : v]),
    );
    fs.writeFileSync(
      file,
      JSON.stringify({ takenAt: new Date().toISOString(), mail: redacted }, null, 2),
    );
    data.backupPath = file;
  }
  delete data.mailBefore;

  if (data.otherKeysDrift.length > 0) {
    throw new Error(`Unrelated mail settings changed: ${data.otherKeysDrift.join(', ')}`);
  }

  console.log(JSON.stringify({ ok: true, mode: apply ? 'apply' : 'dry-run', ...data }, null, 2));
} finally {
  if (snippetId) {
    try {
      await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`, {});
    } catch (error) {
      console.error('Failed to deactivate temporary snippet:', error.message);
    }
    try {
      await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}`, {
        code: '',
        active: false,
      });
    } catch (error) {
      console.error('Failed to blank temporary snippet:', error.message);
    }
    try {
      await wpRequest(env, 'DELETE', `/wp-json/code-snippets/v1/snippets/${snippetId}`, {});
      deleted = true;
    } catch (error) {
      console.error('Failed to delete temporary snippet:', error.message);
    }
    if (!deleted) {
      console.error(
        `WARNING: temporary snippet ${snippetId} is blanked and inactive but still listed. Remove it from the admin UI.`,
      );
    }
  }
}
