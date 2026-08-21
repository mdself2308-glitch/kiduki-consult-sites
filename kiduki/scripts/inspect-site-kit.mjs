#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const env = getWordPressEnv();

function shiftUtcDate(date, days) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

const latestEnd = shiftUtcDate(new Date(), -3);
const latestStart = shiftUtcDate(latestEnd, -27);
const comparisonEnd = shiftUtcDate(latestStart, -1);
const comparisonStart = shiftUtcDate(comparisonEnd, -27);

function searchAnalyticsEndpoint(startDate, endDate) {
  return (
    '/wp-json/google-site-kit/v1/modules/search-console/data/searchanalytics' +
    `?startDate=${formatDate(startDate)}` +
    `&endDate=${formatDate(endDate)}` +
    '&dimensions=date&limit=1000'
  );
}

async function read(endpoint) {
  try {
    const response = await wpRequest(env, 'GET', endpoint);
    return { ok: true, data: response.data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

const [
  modules,
  analyticsSettings,
  searchConsoleSettings,
  currentSearchConsolePerformance,
  comparisonSearchConsolePerformance,
  conversionTracking,
  keyEvents,
] =
  await Promise.all([
    read('/wp-json/google-site-kit/v1/core/modules/data/list'),
    read('/wp-json/google-site-kit/v1/modules/analytics-4/data/settings'),
    read('/wp-json/google-site-kit/v1/modules/search-console/data/settings'),
    read(searchAnalyticsEndpoint(latestStart, latestEnd)),
    read(searchAnalyticsEndpoint(comparisonStart, comparisonEnd)),
    read('/wp-json/google-site-kit/v1/core/site/data/conversion-tracking'),
    read('/wp-json/google-site-kit/v1/modules/analytics-4/data/key-events'),
  ]);

const analyticsModule = Array.isArray(modules.data)
  ? modules.data.find((module) => module.slug === 'analytics-4')
  : null;
const settings = analyticsSettings.ok ? analyticsSettings.data || {} : {};
const searchConsoleModule = Array.isArray(modules.data)
  ? modules.data.find((module) => module.slug === 'search-console')
  : null;
const searchConsoleProperty = searchConsoleSettings.ok
  ? searchConsoleSettings.data?.propertyID || null
  : null;
const staticHomeUrl = 'https://consult.kdkconslt-sngyouijm.com/';

function propertyCoversUrl(property, url) {
  if (!property) return false;
  if (property.startsWith('sc-domain:')) {
    const domain = property.slice('sc-domain:'.length);
    const hostname = new URL(url).hostname;
    return hostname === domain || hostname.endsWith(`.${domain}`);
  }
  return url.startsWith(property);
}

function summarizePerformance(result) {
  if (!result.ok) {
    return { available: false, error: result.error };
  }
  const rows = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.data?.rows)
      ? result.data.rows
      : [];
  const totals = rows.reduce(
    (summary, row) => {
      const impressions = Number(row.impressions || 0);
      summary.clicks += Number(row.clicks || 0);
      summary.impressions += impressions;
      summary.weightedPosition += Number(row.position || 0) * impressions;
      return summary;
    },
    { clicks: 0, impressions: 0, weightedPosition: 0 },
  );
  return {
    available: true,
    rows: rows.length,
    clicks: totals.clicks,
    impressions: totals.impressions,
    ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
    averagePosition: totals.impressions
      ? totals.weightedPosition / totals.impressions
      : null,
  };
}

const currentPerformance = summarizePerformance(
  currentSearchConsolePerformance,
);
const comparisonPerformance = summarizePerformance(
  comparisonSearchConsolePerformance,
);

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
      searchConsole: {
        module: searchConsoleModule
          ? {
              slug: searchConsoleModule.slug,
              active: Boolean(searchConsoleModule.active),
              connected: Boolean(searchConsoleModule.connected),
              setupComplete: Boolean(searchConsoleModule.setupComplete),
            }
          : null,
        propertyID: searchConsoleProperty,
        wordpressCoveredByProperty: propertyCoversUrl(
          searchConsoleProperty,
          'https://kdkconslt-sngyouijm.com/',
        ),
        staticHomeCoveredByProperty: propertyCoversUrl(
          searchConsoleProperty,
          staticHomeUrl,
        ),
        performance: {
          current: {
            startDate: formatDate(latestStart),
            endDate: formatDate(latestEnd),
            ...currentPerformance,
          },
          comparison: {
            startDate: formatDate(comparisonStart),
            endDate: formatDate(comparisonEnd),
            ...comparisonPerformance,
          },
        },
      },
      conversionTracking: conversionTracking.ok
        ? conversionTracking.data
        : { available: false, error: conversionTracking.error },
      keyEvents: keyEvents.ok
        ? {
            available: true,
            names: (Array.isArray(keyEvents.data) ? keyEvents.data : [])
              .map(
                (event) =>
                  event.eventName ||
                  event.displayName ||
                  event.name?.split('/').pop() ||
                  null,
              )
              .filter(Boolean),
          }
        : { available: false, error: keyEvents.error },
      errors: {
        modules: modules.ok ? null : modules.error,
        analyticsSettings: analyticsSettings.ok
          ? null
          : analyticsSettings.error,
        searchConsoleSettings: searchConsoleSettings.ok
          ? null
          : searchConsoleSettings.error,
        currentSearchConsolePerformance: currentSearchConsolePerformance.ok
          ? null
          : currentSearchConsolePerformance.error,
        comparisonSearchConsolePerformance: comparisonSearchConsolePerformance.ok
          ? null
          : comparisonSearchConsolePerformance.error,
        keyEvents: keyEvents.ok ? null : keyEvents.error,
      },
    },
    null,
    2,
  ),
);
