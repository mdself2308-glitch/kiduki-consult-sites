import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Correct the office name inside every Contact Form 7 property.
 *
 * The registered name on the 労働衛生コンサルタント registration is
 * "KIDUKIコンサルティング産業医事務所"; the site had been using a
 * "東京"-prefixed variant. The mail templates carry the name in the sender
 * line, the auto-reply subject and the auto-reply signature.
 *
 * As in patch-cf7-privacy-link.mjs, the authoritative store is the `_form`
 * family of post meta that WPCF7_ContactForm reads, so this goes through
 * Contact Form 7's own API rather than touching post_content. The replacement
 * only ever removes the "東京" prefix, and the script asserts that the byte
 * delta matches the number of replacements so an unrelated edit cannot ride
 * along.
 */
const formId = 1739;
const temporarySnippetName = 'Codex R15 cf7 rename bridge';
const temporaryRoute = '/wp-json/kiduki-r15/v1/cf7-rename';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing to edit the form without --backup --backup-confirmed.');
}

const env = getWordPressEnv();

const OLD = '東京KIDUKIコンサルティング';
const NEW = 'KIDUKIコンサルティング';

function buildSnippetCode() {
  const write = apply ? 'true' : 'false';

  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-r15/v1',
\t\t'/cf7-rename',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function () {
\t\t\t\tif ( ! class_exists( 'WPCF7_ContactForm' ) ) {
\t\t\t\t\treturn new WP_Error( 'kiduki_cf7_missing', 'Contact Form 7 not available.', array( 'status' => 409 ) );
\t\t\t\t}
\t\t\t\t$cf = WPCF7_ContactForm::get_instance( ${formId} );
\t\t\t\tif ( ! $cf ) {
\t\t\t\t\treturn new WP_Error( 'kiduki_cf7_missing', 'Form not found.', array( 'status' => 409 ) );
\t\t\t\t}

\t\t\t\t$old = '${OLD}';
\t\t\t\t$new = '${NEW}';

\t\t\t\t$walk = function ( $value ) use ( &$walk, $old, $new ) {
\t\t\t\t\tif ( is_string( $value ) ) {
\t\t\t\t\t\treturn str_replace( $old, $new, $value );
\t\t\t\t\t}
\t\t\t\t\tif ( is_array( $value ) ) {
\t\t\t\t\t\tforeach ( $value as $k => $v ) {
\t\t\t\t\t\t\t$value[ $k ] = $walk( $v );
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\treturn $value;
\t\t\t\t};

\t\t\t\t$count = function ( $value ) use ( &$count, $old ) {
\t\t\t\t\tif ( is_string( $value ) ) {
\t\t\t\t\t\treturn substr_count( $value, $old );
\t\t\t\t\t}
\t\t\t\t\t$n = 0;
\t\t\t\t\tif ( is_array( $value ) ) {
\t\t\t\t\t\tforeach ( $value as $v ) {
\t\t\t\t\t\t\t$n += $count( $v );
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\treturn $n;
\t\t\t\t};

\t\t\t\t$before   = $cf->get_properties();
\t\t\t\t$perKey   = array();
\t\t\t\tforeach ( $before as $k => $v ) {
\t\t\t\t\t$n = $count( $v );
\t\t\t\t\tif ( $n > 0 ) {
\t\t\t\t\t\t$perKey[ $k ] = $n;
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\t$hits = array_sum( $perKey );

\t\t\t\t$changed = false;
\t\t\t\tif ( ${write} && $hits > 0 ) {
\t\t\t\t\t$cf->set_properties( $walk( $before ) );
\t\t\t\t\t$cf->save();
\t\t\t\t\t$changed = true;
\t\t\t\t}

\t\t\t\t$reloaded = WPCF7_ContactForm::get_instance( ${formId} );
\t\t\t\t$after    = $reloaded->get_properties();

\t\t\t\t$lenBefore = strlen( maybe_serialize( $before ) );
\t\t\t\t$lenAfter  = strlen( maybe_serialize( $after ) );

\t\t\t\treturn array(
\t\t\t\t\t'hits'          => $hits,
\t\t\t\t\t'perKey'        => $perKey,
\t\t\t\t\t'changed'       => $changed,
\t\t\t\t\t'remaining'     => $count( $after ),
\t\t\t\t\t'serialDelta'   => $lenBefore - $lenAfter,
\t\t\t\t\t'expectedDelta' => $changed ? $hits * strlen( '東京' ) : 0,
\t\t\t\t\t'mailSender'    => (string) ( $after['mail']['sender'] ?? '' ),
\t\t\t\t\t'mail2Subject'  => (string) ( $after['mail_2']['subject'] ?? '' ),
\t\t\t\t\t'formFields'    => preg_match_all( '/\\\\[(text\\\\*?|email\\\\*?|tel|select\\\\*?|textarea\\\\*?|acceptance|submit)/', (string) ( $after['form'] ?? '' ) ),
\t\t\t\t\t'formHasPolicy' => ( false !== strpos( (string) ( $after['form'] ?? '' ), 'privacy-policy/' ) ),
\t\t\t\t\t'propsBefore'   => $before,
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

  if (apply && backup && data.propsBefore) {
    const dir = path.resolve('backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `cf7-${formId}-props-before-${safeStamp()}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify({ takenAt: new Date().toISOString(), properties: data.propsBefore }, null, 2),
    );
    data.backupPath = file;
  }
  delete data.propsBefore;

  if (data.changed && data.remaining !== 0) {
    throw new Error(`Rename incomplete: ${data.remaining} occurrence(s) remain.`);
  }
  if (data.changed && data.serialDelta !== data.expectedDelta) {
    throw new Error(
      `Unexpected edit size: serialised length changed by ${data.serialDelta}, expected ${data.expectedDelta}.`,
    );
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
