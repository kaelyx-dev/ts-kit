/**
 * Return the first `count` segments as strings. Stops reading after that number, so the caller
 * does not segment the rest of a long input.
 */
export function takeGraphemes(segments: Iterable<{ segment: string }>, count: number): string[] {
  const graphemes: string[] = []
  if (count <= 0) return graphemes

  for (const { segment } of segments) {
    graphemes.push(segment)
    if (graphemes.length >= count) break
  }
  return graphemes
}
