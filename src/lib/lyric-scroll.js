// Rect-based coordinates are independent of positioned ancestors and sheet offsets.
// Keep the current line in the center of the actual reader, not the whole page.
export function lyricScrollTarget(viewport, line) {
  const relativeTop = line.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  return Math.max(0, Math.min(viewport.scrollHeight - viewport.clientHeight,
    viewport.scrollTop + relativeTop + line.clientHeight / 2 - viewport.clientHeight * 0.5));
}
