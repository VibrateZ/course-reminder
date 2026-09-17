(function expose(factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window === 'object') window.viewerControls = api;
}(function createViewerControls() {
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.1;

  function clampZoom(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, numeric)) * 10) / 10;
  }

  function stepZoom(value, direction) {
    return clampZoom(clampZoom(value) + (direction < 0 ? -ZOOM_STEP : ZOOM_STEP));
  }

  function formatZoom(value) {
    return `${Math.round(clampZoom(value) * 100)}%`;
  }

  return { MAX_ZOOM, MIN_ZOOM, clampZoom, formatZoom, stepZoom };
}));
