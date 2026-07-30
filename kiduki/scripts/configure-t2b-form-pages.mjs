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
const mainRecipient = 'answr202308@kdkconslt-sngyouijm.com';
const senderAddress = 'info@kdkconslt-sngyouijm.com';
const senderName = 'KIDUKIコンサルティング産業医事務所';
const recipientsPath = path.resolve('backups/t2a-test-recipients.env');
const contactSourcePath = path.resolve(
  'source/wordpress/page-contact.html',
);
const thanksSourcePath = path.resolve(
  'source/wordpress/page-contact-thanks.html',
);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing form/page configuration without --backup --backup-confirmed.',
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

if (!fs.existsSync(recipientsPath)) {
  throw new Error('T2A test recipient file is missing.');
}
if (!fs.existsSync(contactSourcePath) || !fs.existsSync(thanksSourcePath)) {
  throw new Error('Contact page source files are missing.');
}

const recipientEnv = readEnvFile(recipientsPath);
const backupRecipient = String(
  recipientEnv.get('T2A_TEST_GMAIL') || '',
).trim();

if (!backupRecipient) {
  throw new Error('T2A_TEST_GMAIL is missing.');
}

const contactContent = fs.readFileSync(contactSourcePath, 'utf8').trim();
const thanksContent = fs.readFileSync(thanksSourcePath, 'utf8').trim();

const formDefinition = `<label>会社名(必須)
[text* your-company autocomplete:organization]</label>

<label>業種(必須)
[select* industry "運輸・物流" "製造" "医療・介護" "IT・情報通信" "建設" "小売・サービス" "その他"]</label>

<label>従業員数(必須)
[select* company-size "〜49名" "50〜99名" "100〜299名" "300〜999名" "1,000名〜"]</label>

<label>ご相談内容の種別(必須)
[select* inquiry-type "睡眠研修を検討したい" "SAS(睡眠時無呼吸)対策を相談したい" "交代勤務・夜勤の睡眠対策を相談したい" "嘱託産業医を探している" "顧問・労働衛生コンサルティング" "講演・執筆・取材の依頼" "その他"]</label>

<label>ご相談内容(必須)
[textarea* your-message]</label>

<label>お名前(必須)
[text* your-name autocomplete:name]</label>

<label>部署・役職(任意)
[text your-title]</label>

<label>メールアドレス(必須)
[email* your-email autocomplete:email]</label>

<label>電話番号(任意・お電話での折り返しをご希望の場合)
[tel your-tel autocomplete:tel]</label>

[acceptance privacy-agree] プライバシーポリシーに同意する [/acceptance]

[submit "この内容で送信する"]`;

const notificationBody = `サイトの問い合わせフォームから受信しました。

■会社名: [your-company]
■業種: [industry]/従業員数: [company-size]
■種別: [inquiry-type]
■内容:
[your-message]
■氏名: [your-name]([your-title])
■メール: [your-email]/電話: [your-tel]`;

const autoReplyBody = `[your-name] 様

お問い合わせを受け付けました。内容を確認のうえ、2営業日以内に担当医師よりご連絡いたします。
お急ぎの場合は、恐れ入りますが本メールにそのままご返信のうえ、件名の冒頭に【至急】とお書き添えください。

――以下、送信内容の控え――
■会社名: [your-company]
■業種: [industry]/従業員数: [company-size]
■種別: [inquiry-type]
■内容:
[your-message]
■氏名: [your-name]([your-title])
■メール: [your-email]/電話: [your-tel]

KIDUKIコンサルティング産業医事務所
【住所・URL】`;

const formMessages = {
  mail_sent_ok: 'お問い合わせを送信しました。ありがとうございました。',
  mail_sent_ng:
    'メッセージの送信に失敗しました。時間をおいて再度お試しください。',
  validation_error:
    '入力内容に問題があります。確認して再度お試しください。',
  spam:
    'メッセージの送信に失敗しました。時間をおいて再度お試しください。',
  accept_terms: '送信前にプライバシーポリシーへの同意が必要です。',
  invalid_required: '必須項目に入力してください。',
  invalid_too_long: '入力された内容が長すぎます。',
  invalid_too_short: '入力された内容が短すぎます。',
  upload_failed: 'ファイルのアップロード中にエラーが発生しました。',
  upload_file_type_invalid:
    'この形式のファイルはアップロードできません。',
  upload_file_too_large: 'アップロードされたファイルが大きすぎます。',
  upload_failed_php_error:
    'ファイルのアップロード中にエラーが発生しました。',
  invalid_date: 'YYYY-MM-DD の形式で日付を入力してください。',
  date_too_early: '入力された日付が早すぎます。',
  date_too_late: '入力された日付が遅すぎます。',
  invalid_number: '数値を入力してください。',
  number_too_small: '入力された数値が小さすぎます。',
  number_too_large: '入力された数値が大きすぎます。',
  quiz_answer_not_correct: 'クイズの答えが正しくありません。',
  captcha_not_match: '入力されたコードが正しくありません。',
  invalid_email: '正しいメールアドレスを入力してください。',
  invalid_url: '正しいURLを入力してください。',
  invalid_tel: '正しい電話番号を入力してください。',
};

const env = getWordPressEnv();

async function readForms() {
  const response = await wpRequest(
    env,
    'GET',
    '/wp-json/contact-form-7/v1/contact-forms',
  );
  return Array.isArray(response.data)
    ? response.data
    : response.data?.items || [];
}

async function readPages() {
  const response = await wpRequest(
    env,
    'GET',
    '/wp-json/wp/v2/pages?context=edit&per_page=100&status=publish,draft,pending,private,future',
  );
  return response.data;
}

function chooseForm(forms) {
  return (
    forms.find((form) => form.title === 'お問い合わせフォーム') ||
    forms.find((form) => form.title === 'Contact form 1')
  );
}

function summarizePage(page) {
  return page
    ? {
        id: page.id,
        slug: page.slug,
        status: page.status,
        title: page.title?.raw || page.title?.rendered || '',
        parent: page.parent || 0,
        modified: page.modified,
        contentBytes: Buffer.byteLength(page.content?.raw || ''),
      }
    : null;
}

const formsBefore = await readForms();
const formBefore = chooseForm(formsBefore);
if (!formBefore) {
  throw new Error('No suitable Contact Form 7 form was found.');
}

const formId = Number(formBefore.id);
const formDetailBefore = await wpRequest(
  env,
  'GET',
  `/wp-json/contact-form-7/v1/contact-forms/${formId}`,
);
const pagesBefore = await readPages();
const contactBefore = pagesBefore.find((page) => page.slug === 'contact');
const thanksBefore = pagesBefore.find(
  (page) =>
    page.slug === 'thanks' &&
    (!contactBefore || Number(page.parent) === Number(contactBefore.id)),
);

const plan = {
  form: {
    id: formId,
    currentTitle: formBefore.title,
    nextTitle: 'お問い合わせフォーム',
    fieldCount: 10,
    notificationRecipientCount: 2,
    autoReply: true,
  },
  contactPage: {
    operation: contactBefore ? 'update' : 'create',
    current: summarizePage(contactBefore),
    next: {
      slug: 'contact',
      status: 'publish',
      title: 'お問い合わせ',
      parent: 0,
      contentBytes: Buffer.byteLength(contactContent),
    },
  },
  thanksPage: {
    operation: thanksBefore ? 'update' : 'create',
    current: summarizePage(thanksBefore),
    next: {
      slug: 'thanks',
      status: 'publish',
      title: 'お問い合わせありがとうございました',
      parent: contactBefore?.id || 'new-contact-page',
      contentBytes: Buffer.byteLength(thanksContent),
    },
  },
};

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        writes: false,
        backupRecipientConfigured: true,
        recipientAddressesDisplayed: false,
        plan,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const backupDir = path.resolve('backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(
  backupDir,
  `wp-t2b-form-pages-before-${safeStamp()}.json`,
);
fs.writeFileSync(
  backupPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      form: formDetailBefore.data,
      contactPage: contactBefore || null,
      thanksPage: thanksBefore || null,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

const formUpdated = await wpRequest(
  env,
  'POST',
  `/wp-json/contact-form-7/v1/contact-forms/${formId}`,
  {
    id: formId,
    title: 'お問い合わせフォーム',
    locale: 'ja',
    form: formDefinition,
    mail: {
      active: true,
      subject: '【HP問い合わせ/[inquiry-type]】[your-company] [your-name]様',
      sender: `${senderName} <${senderAddress}>`,
      recipient: `${mainRecipient}, ${backupRecipient}`,
      body: notificationBody,
      additional_headers: 'Reply-To: [your-email]',
      attachments: '',
      use_html: false,
      exclude_blank: false,
    },
    mail_2: {
      active: true,
      subject:
        '【自動返信】お問い合わせありがとうございます|KIDUKIコンサルティング産業医事務所',
      sender: `${senderName} <${senderAddress}>`,
      recipient: '[your-email]',
      body: autoReplyBody,
      additional_headers: `Reply-To: ${senderAddress}`,
      attachments: '',
      use_html: false,
      exclude_blank: false,
    },
    additional_settings: '',
    messages: formMessages,
    context: 'save',
  },
);

const formConfigErrors = formUpdated.data.config_errors || {};
const formConfigErrorEntries = Object.entries(formConfigErrors);
const acceptedConfigWarnings = formConfigErrorEntries.filter(
  ([field, detail]) =>
    field === 'mail_2.recipient' &&
    JSON.stringify(detail).includes('unsafe-email-without-protection'),
);
const unexpectedConfigErrors = formConfigErrorEntries.filter(
  ([field, detail]) =>
    !(
      field === 'mail_2.recipient' &&
      JSON.stringify(detail).includes('unsafe-email-without-protection')
    ),
);

if (unexpectedConfigErrors.length > 0) {
  throw new Error(
    `Contact Form 7 configuration errors: ${JSON.stringify(
      Object.fromEntries(unexpectedConfigErrors),
    )}`,
  );
}

let contactPage;
if (contactBefore) {
  contactPage = (
    await wpRequest(
      env,
      'POST',
      `/wp-json/wp/v2/pages/${contactBefore.id}`,
      {
        title: 'お問い合わせ',
        slug: 'contact',
        status: 'publish',
        parent: 0,
        content: contactContent,
      },
    )
  ).data;
} else {
  contactPage = (
    await wpRequest(env, 'POST', '/wp-json/wp/v2/pages', {
      title: 'お問い合わせ',
      slug: 'contact',
      status: 'publish',
      parent: 0,
      content: contactContent,
    })
  ).data;
}

let thanksPage;
if (thanksBefore) {
  thanksPage = (
    await wpRequest(
      env,
      'POST',
      `/wp-json/wp/v2/pages/${thanksBefore.id}`,
      {
        title: 'お問い合わせありがとうございました',
        slug: 'thanks',
        status: 'publish',
        parent: contactPage.id,
        content: thanksContent,
      },
    )
  ).data;
} else {
  thanksPage = (
    await wpRequest(env, 'POST', '/wp-json/wp/v2/pages', {
      title: 'お問い合わせありがとうございました',
      slug: 'thanks',
      status: 'publish',
      parent: contactPage.id,
      content: thanksContent,
    })
  ).data;
}

const formAfter = await wpRequest(
  env,
  'GET',
  `/wp-json/contact-form-7/v1/contact-forms/${formId}`,
);
const properties = formAfter.data.properties || {};
const fields = properties.form?.fields || [];
const verified =
  formAfter.data.title === 'お問い合わせフォーム' &&
  fields.some((field) => field.name === 'your-company') &&
  fields.some((field) => field.name === 'privacy-agree') &&
  properties.mail?.active === true &&
  properties.mail_2?.active === true &&
  contactPage.slug === 'contact' &&
  contactPage.status === 'publish' &&
  thanksPage.slug === 'thanks' &&
  thanksPage.status === 'publish' &&
  Number(thanksPage.parent) === Number(contactPage.id);

if (!verified) {
  throw new Error('T2B form/page verification failed.');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      backupPath,
      recipientAddressesDisplayed: false,
      form: {
        id: formId,
        title: formAfter.data.title,
        fieldCount: fields.length,
        notificationRecipientCount: 2,
        autoReply: properties.mail_2?.active === true,
      },
      contactPage: {
        id: contactPage.id,
        slug: contactPage.slug,
        status: contactPage.status,
        link: contactPage.link,
      },
      thanksPage: {
        id: thanksPage.id,
        slug: thanksPage.slug,
        status: thanksPage.status,
        parent: thanksPage.parent,
        link: thanksPage.link,
      },
      acceptedConfigWarnings:
        acceptedConfigWarnings.length > 0
          ? [
              'mail_2.recipient: unsafe-email-without-protection (CAPTCHAを使用しない指示に伴う既知警告。必須メール欄とWP Armour honeypotで防御)',
            ]
          : [],
    },
    null,
    2,
  ),
);
