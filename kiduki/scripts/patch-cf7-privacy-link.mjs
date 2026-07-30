import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Add a privacy-policy link inside the Contact Form 7 consent checkbox label.
 *
 * The consent asks the visitor to agree to the privacy policy but offered no
 * way to read it. Contact Form 7 stores its template in a post type that is
 * not exposed over REST, and its own REST endpoint would not accept a write,
 * so this goes through the same temporary Code Snippets bridge as the other
 * scripts here.
 *
 * The authoritative copy of the template is the `_form` post meta that
 * WPCF7_ContactForm reads, NOT post_content -- editing post_content changes a
 * mirror that never reaches the rendered page. So this goes through Contact
 * Form 7's own API (get_instance / set_properties / save) and additionally
 * reverts any stray edit previously made to post_content, so the two copies
 * cannot drift apart.
 *
 * The replacement is anchored on the exact existing consent line and aborts if
 * it is not found, so it cannot damage the rest of the form template.
 */
const formId = 1739;
const temporarySnippetName = 'Codex R14 cf7 privacy link bridge';
const temporaryRoute = '/wp-json/kiduki-r14/v1/cf7-privacy-link';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing to edit the form without --backup --backup-confirmed.');
}

const env = getWordPressEnv();

const OLD = '[acceptance privacy-agree] プライバシーポリシーに同意する [/acceptance]';
const NEW =
  '[acceptance privacy-agree] <a href="https://kdkconslt-sngyouijm.com/privacy-policy/" target="_blank" rel="noopener">プライバシーポリシー</a>（別タブで開きます）に同意する [/acceptance]';

function buildSnippetCode() {
  const write = apply ? 'true' : 'false';
  const oldPhp = OLD.replace(/'/g, "\\'");
  const newPhp = NEW.replace(/'/g, "\\'");

  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-r14/v1',
\t\t'/cf7-privacy-link',
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

\t\t\t\t$old = '${oldPhp}';
\t\t\t\t$new = '${newPhp}';

\t\t\t\t// The template CF7 actually renders.
\t\t\t\t$template = (string) $cf->prop( 'form' );
\t\t\t\t$already  = ( false !== strpos( $template, 'privacy-policy/' ) );
\t\t\t\t$found    = ( false !== strpos( $template, $old ) );

\t\t\t\t// post_content is only a mirror; an earlier pass edited it directly.
\t\t\t\t$post        = get_post( ${formId} );
\t\t\t\t$mirror      = $post ? $post->post_content : '';
\t\t\t\t$mirrorDrift = ( false !== strpos( $mirror, $new ) );

\t\t\t\t$changed        = false;
\t\t\t\t$mirrorReverted = false;

\t\t\t\tif ( ${write} ) {
\t\t\t\t\tif ( $mirrorDrift ) {
\t\t\t\t\t\twp_update_post( array( 'ID' => ${formId}, 'post_content' => str_replace( $new, $old, $mirror ) ) );
\t\t\t\t\t\tclean_post_cache( ${formId} );
\t\t\t\t\t\t$mirrorReverted = true;
\t\t\t\t\t}

\t\t\t\t\tif ( $found && ! $already ) {
\t\t\t\t\t\t$props         = $cf->get_properties();
\t\t\t\t\t\t$props['form'] = str_replace( $old, $new, $template );
\t\t\t\t\t\t$cf->set_properties( $props );
\t\t\t\t\t\t$cf->save();
\t\t\t\t\t\t$changed = true;
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\t$reloaded = WPCF7_ContactForm::get_instance( ${formId} );
\t\t\t\t$after    = (string) $reloaded->prop( 'form' );
\t\t\t\t$postNow  = get_post( ${formId} );

\t\t\t\treturn array(
\t\t\t\t\t'anchorFound'    => $found,
\t\t\t\t\t'alreadyLinked'  => $already,
\t\t\t\t\t'changed'        => $changed,
\t\t\t\t\t'mirrorDrift'    => $mirrorDrift,
\t\t\t\t\t'mirrorReverted' => $mirrorReverted,
\t\t\t\t\t'lengthBefore'   => strlen( $template ),
\t\t\t\t\t'lengthAfter'    => strlen( $after ),
\t\t\t\t\t'hasLinkNow'     => ( false !== strpos( $after, 'privacy-policy/' ) ),
\t\t\t\t\t'fieldCount'     => preg_match_all( '/\\\\[(text\\\\*?|email\\\\*?|tel|select\\\\*?|textarea\\\\*?|acceptance|submit)/', $after ),
\t\t\t\t\t'mailIntact'     => ( '' !== trim( (string) ( $reloaded->prop( 'mail' )['body'] ?? '' ) ) ),
\t\t\t\t\t'postContentLen' => $postNow ? strlen( $postNow->post_content ) : 0,
\t\t\t\t\t'contentBefore'  => $template,
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
    desc: 'Temporary R14 bridge. Removed immediately after use.',
    code: buildSnippetCode(),
    tags: ['codex', 'temporary', 'r14'],
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

  if (apply && backup && data.contentBefore) {
    const dir = path.resolve('backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `cf7-${formId}-template-before-${safeStamp()}.txt`);
    fs.writeFileSync(file, data.contentBefore);
    data.backupPath = file;
  }
  delete data.contentBefore;

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
