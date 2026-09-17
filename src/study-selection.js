(function expose(factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window === 'object') window.studySelection = api;
}(function createStudySelection() {
  function entryTime(entry) {
    if (!entry || !/^20\d{2}-\d{2}-\d{2}$/.test(entry.date || '') || !/^\d{2}:\d{2}$/.test(entry.startTime || '')) return NaN;
    return new Date(`${entry.date}T${entry.startTime}:00`).getTime();
  }

  function nextStudyEntry(schedule, now = new Date()) {
    const nowTime = now.getTime();
    return (Array.isArray(schedule) ? schedule : [])
      .filter((entry) => Array.isArray(entry.links) && entry.links.length > 0 && entryTime(entry) >= nowTime)
      .sort((a, b) => entryTime(a) - entryTime(b))[0] || null;
  }

  return { nextStudyEntry };
}));
