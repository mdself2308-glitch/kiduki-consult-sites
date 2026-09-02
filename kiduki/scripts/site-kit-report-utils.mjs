export function searchRows(result, dimensions) {
  if (!result.ok) {
    return { available: false, error: result.error, rows: [] };
  }
  const rows = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.data?.rows)
      ? result.data.rows
      : [];
  return {
    available: true,
    rows: rows.map((row) => {
      const normalized = {
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        ctr: Number(row.ctr || 0),
        position: Number(row.position || 0),
      };
      const keys = Array.isArray(row.keys) ? row.keys : [];
      dimensions.forEach((dimension, index) => {
        normalized[dimension] = keys[index] || null;
      });
      return normalized;
    }),
  };
}

export function aggregateRows(rows, dimension) {
  const grouped = new Map();
  for (const row of rows) {
    const value = row[dimension];
    if (!value) continue;
    const aggregate = grouped.get(value) || {
      [dimension]: value,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
    };
    aggregate.clicks += row.clicks;
    aggregate.impressions += row.impressions;
    aggregate.weightedPosition += row.position * row.impressions;
    grouped.set(value, aggregate);
  }
  return [...grouped.values()]
    .map((row) => ({
      [dimension]: row[dimension],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.impressions ? row.clicks / row.impressions : 0,
      averagePosition: row.impressions
        ? row.weightedPosition / row.impressions
        : null,
    }))
    .sort(
      (a, b) =>
        b.impressions - a.impressions ||
        b.clicks - a.clicks ||
        String(a[dimension]).localeCompare(String(b[dimension]), 'ja'),
    );
}

export function summarizeTrackedQuery(rows, query) {
  const matching = rows.filter((row) => row.query === query);
  const summary = aggregateRows(matching, 'query')[0] || null;
  return {
    found: Boolean(summary),
    ...(summary || {
      query,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      averagePosition: null,
    }),
    pages: aggregateRows(matching, 'page'),
  };
}

export function summarizeQueryPage(result) {
  const normalized = searchRows(result, ['query', 'page']);
  if (!normalized.available) {
    return { available: false, error: normalized.error };
  }
  return {
    available: true,
    rowCount: normalized.rows.length,
    topQueries: aggregateRows(normalized.rows, 'query').slice(0, 25),
    topPages: aggregateRows(normalized.rows, 'page').slice(0, 25),
    trackedQueries: {
      spotIndustrialPhysician: summarizeTrackedQuery(
        normalized.rows,
        'スポット産業医',
      ),
    },
  };
}
