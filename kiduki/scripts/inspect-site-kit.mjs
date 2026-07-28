#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const env = getWordPressEnv();

async function read(endpoint) {
  try {
    const response = await wpRequest(env, 'GET', endpoint);
    return { ok: true, data: response.data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

const [modules, analyticsSettings, conversionTracking] = await Promise.all([
  read('/wp-json/google-site-kit/v1/core/modules/data/list'),
  read('/wp-json/google-site-kit/v1/modules/analytics-4/data/settings'),
  read('/wp-json/google-site-kit/v1/core/site/data/conversion-tracking'),
]);

const analyticsModule = Array.isArray(modules.data)
  ? modules.data.find((module) => module.slug === 'analytics-4')
  : null;
const settings = analyticsSettings.ok ? analyticsSettings.data || {} : {};

console.log(
  JSON.stringify(
    {
      ok: modules.ok && analyticsSettings.ok,
      writes: false,
      analytics: {
        module: analyticsModule
          ? {
              slug: analyticsModule.slug,
              active: Boolean(analyticsModule.active),
              connected: Boolean(analyticsModule.connected),
              setupComplete: Boolean(analyticsModule.setupComplete),
            }
          : null,
        propertyConfigured: Boolean(settings.propertyID),
        webDataStreamConfigured: Boolean(settings.webDataStreamID),
        measurementID: settings.measurementID || null,
        snippetEnabled: settings.useSnippet !== false,
      },
      conversionTracking: conversionTracking.ok
        ? conversionTracking.data
        : { available: false, error: conversionTracking.error },
      errors: {
        modules: modules.ok ? null : modules.error,
        analyticsSettings: analyticsSettings.ok
          ? null
          : analyticsSettings.error,
      },
    },
    null,
    2,
  ),
);
