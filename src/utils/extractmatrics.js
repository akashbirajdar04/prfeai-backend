
 function extractMetrics(lhr) {
  return {
    performance: {
      lcp: lhr.audits["largest-contentful-paint"].numericValue, // ms
      cls: lhr.audits["cumulative-layout-shift"].numericValue,
      inp: lhr.audits["interaction-to-next-paint"].numericValue,
      ttfb: lhr.audits["server-response-time"].numericValue, // ms
      unusedJavascript: lhr.audits["unused-javascript"],
      renderBlockingResources: lhr.audits["render-blocking-resources"],
    },
    seo: {
      score: Math.round(lhr.categories.seo.score * 100),
      issues: Object.values(lhr.audits)
        .filter(a => a.score !== null && a.score < 1 && a.details?.type === "opportunity")
        .map(a => a.title)
    }
  };
}

module.exports = extractMetrics;
