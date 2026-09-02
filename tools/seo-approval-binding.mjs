import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function countOccurrences(value, needle) {
  if (!needle) return 0;
  return String(value).split(needle).length - 1;
}

function replaceExactlyOnce(value, before, after, label) {
  const count = countOccurrences(value, before);
  if (count !== 1) {
    throw new Error(
      `SEO approval binding expected exactly one ${label}, found ${count}.`,
    );
  }
  return value.replace(before, after);
}

export function verifySeoApprovalBinding({
  manifest,
  manifestPath,
  selectedItems,
  args,
  apply,
}) {
  const approval = manifest.approval || null;
  if (!approval) return { required: false };

  const changeMode = approval.changeMode || 'targeted_patch';
  if (!['targeted_patch', 'full_body_replacement'].includes(changeMode)) {
    throw new Error(`Unsupported SEO approval change mode: ${changeMode}`);
  }

  const manifestDirectory = path.dirname(path.resolve(manifestPath));
  const resolveProjectPath = (value) =>
    path.resolve(manifestDirectory, approval.projectRootRelative || '../..', value);
  const exactPayloadPath = resolveProjectPath(approval.exactPayload);
  const baselineSourcePath = approval.baselineSource
    ? resolveProjectPath(approval.baselineSource)
    : null;
  const candidateSourcePath = resolveProjectPath(approval.candidateSource);

  const requiredPaths = [exactPayloadPath, candidateSourcePath];
  if (changeMode === 'targeted_patch') {
    if (!baselineSourcePath) {
      throw new Error('Targeted SEO approval requires a baseline source file.');
    }
    requiredPaths.push(baselineSourcePath);
  }
  for (const requiredPath of requiredPaths) {
    if (!fs.existsSync(requiredPath)) {
      throw new Error(`SEO approval binding file is missing: ${requiredPath}`);
    }
  }

  const exactPayloadRaw = fs.readFileSync(exactPayloadPath, 'utf8');
  const baselineSource = baselineSourcePath
    ? fs.readFileSync(baselineSourcePath, 'utf8')
    : null;
  const candidateSource = fs.readFileSync(candidateSourcePath, 'utf8');
  const exactPayload = JSON.parse(exactPayloadRaw);
  const actualExactSha256 = sha256(exactPayloadRaw);
  const actualBaselineSha256 = baselineSource === null ? null : sha256(baselineSource);
  const actualCandidateSha256 = sha256(candidateSource);

  const expectedHashes = {
    exactPayload: approval.exactPayloadSha256,
    candidateSource: approval.candidateSourceSha256,
  };
  const actualHashes = {
    exactPayload: actualExactSha256,
    candidateSource: actualCandidateSha256,
  };
  if (changeMode === 'targeted_patch') {
    expectedHashes.baselineSource = approval.baselineSourceSha256;
    actualHashes.baselineSource = actualBaselineSha256;
  }
  for (const key of Object.keys(expectedHashes)) {
    if (!expectedHashes[key] || expectedHashes[key] !== actualHashes[key]) {
      throw new Error(
        `SEO approval binding ${key} SHA-256 mismatch: expected ${expectedHashes[key]}, found ${actualHashes[key]}.`,
      );
    }
  }

  if (exactPayload.exact_version !== approval.exactVersion) {
    throw new Error('SEO approval binding exact version mismatch.');
  }

  const targetId = Number(exactPayload.target?.wordpress_post_id);
  const selectedTarget = selectedItems.find(
    (item) => Number(item.id) === targetId,
  );
  if (!selectedTarget || selectedItems.length !== 1) {
    throw new Error(
      'SEO approval binding requires exactly the approved WordPress target.',
    );
  }

  const approvedCopy =
    changeMode === 'full_body_replacement'
      ? exactPayload.copy
      : exactPayload.changes;
  if (
    path.resolve(selectedTarget.source) !== candidateSourcePath ||
    selectedTarget.title !== approvedCopy?.title ||
    selectedTarget.excerpt !== approvedCopy?.excerpt ||
    selectedTarget.metaDescription !== approvedCopy?.meta_description ||
    approvedCopy?.h1 !== approvedCopy?.title
  ) {
    throw new Error('SEO manifest fields do not match the exact approval payload.');
  }

  if (changeMode === 'targeted_patch') {
    const anchorHtml = `<!-- wp:paragraph --><p>${exactPayload.changes.body_insert_after}</p><!-- /wp:paragraph -->`;
    const insertHtml = `<!-- wp:paragraph -->${exactPayload.changes.body_insert_html}<!-- /wp:paragraph -->`;
    let expectedCandidate = replaceExactlyOnce(
      baselineSource,
      anchorHtml,
      `${anchorHtml}${insertHtml}`,
      'approved body insertion anchor',
    );
    expectedCandidate = replaceExactlyOnce(
      expectedCandidate,
      `>${approval.previousCtaLabel}</a>`,
      `>${exactPayload.changes.cta_label}</a>`,
      'approved CTA label',
    );
    if (expectedCandidate !== candidateSource) {
      throw new Error(
        'SEO candidate body contains changes outside the approved insertion and CTA label.',
      );
    }
  } else {
    if (
      path.resolve(approvedCopy?.body_path || '') !== candidateSourcePath ||
      approvedCopy?.body_sha256 !== actualCandidateSha256
    ) {
      throw new Error(
        'Full-body SEO candidate does not match the exact approval payload.',
      );
    }
    if (
      !approval.baselineRemoteSha256 ||
      selectedTarget.expectedRemoteSourceSha256 !==
        approval.baselineRemoteSha256 ||
      exactPayload.target?.expected_remote_source_sha256 !==
        approval.baselineRemoteSha256
    ) {
      throw new Error(
        'Full-body SEO approval does not pin one reviewed remote baseline hash.',
      );
    }
  }

  const masterSourcePath = approval.masterSource
    ? resolveProjectPath(approval.masterSource)
    : null;
  const masterRequiredValues = [
    approvedCopy?.title,
    approvedCopy?.meta_description,
    approvedCopy?.excerpt,
    approvedCopy?.cta_label,
    approvedCopy?.body_insert_html,
  ].filter(Boolean);
  const masterMissingValues = [];
  if (masterSourcePath) {
    if (!fs.existsSync(masterSourcePath)) {
      throw new Error(`SEO master source is missing: ${masterSourcePath}`);
    }
    const masterSource = fs.readFileSync(masterSourcePath, 'utf8');
    for (const requiredValue of masterRequiredValues) {
      if (!masterSource.includes(requiredValue)) {
        masterMissingValues.push(requiredValue);
      }
    }
  }
  const masterFirstReady =
    !masterSourcePath || masterMissingValues.length === 0;

  if (apply) {
    const approvedVersion = args['approved-version'];
    const approvedBundlePath = args['approval-bundle']
      ? path.resolve(args['approval-bundle'])
      : null;
    const approvedBundleSha256 = args['approved-bundle-sha256'];
    if (
      approvedVersion !== approval.exactVersion ||
      approvedBundlePath !== exactPayloadPath ||
      approvedBundleSha256 !== actualExactSha256
    ) {
      throw new Error(
        'Refusing SEO apply without the exact approved version, payload path, and SHA-256.',
      );
    }
    if (!masterFirstReady) {
      throw new Error(
        'Refusing SEO apply until the approved exact copy is present in the canonical site-copy master.',
      );
    }
  }

  return {
    required: true,
    changeMode,
    exactVersion: approval.exactVersion,
    exactPayloadPath,
    exactPayloadSha256: actualExactSha256,
    baselineSourcePath,
    baselineSourceSha256: actualBaselineSha256,
    candidateSourcePath,
    candidateSourceSha256: actualCandidateSha256,
    targetWordPressPostId: targetId,
    deterministicChanges:
      changeMode === 'full_body_replacement'
        ? ['title', 'excerpt', 'meta_description', 'full_body', 'primary_cta']
        : ['body_insert', 'cta_label'],
    baselineRemoteSha256: approval.baselineRemoteSha256 || null,
    masterSourcePath,
    masterFirstReady,
    masterMissingValueCount: masterMissingValues.length,
    applyAuthorizationVerified: apply,
  };
}
