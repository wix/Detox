/**
 * Readers for `detox logs`' text views (spec 013). They live here rather
 * than in the accept file, which pins names and their order and never
 * padding, so these look at a line's leading whitespace and its first name
 * column only.
 */

/** Every line with something on it, in order. */
export function nonEmptyLines(text: string): string[] {
  return text.split('\n').filter((line) => line.trim().length > 0);
}

/** Index of the first line whose text (whitespace stripped) starts with `prefix`; -1 when none. */
export function lineAt(lines: readonly string[], prefix: string): number {
  return lines.findIndex((line) => line.trimStart().startsWith(prefix));
}

/** The line's depth in characters of leading whitespace. */
export function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** The name column: everything before the first run of two or more spaces (the duration column). */
export function nameColumn(line: string): string {
  return line.trim().split(/\s{2,}/)[0];
}

/** The lines after `index` up to (not including) the next blank line — one `--failures` block's body. */
export function blockAfter(lines: readonly string[], index: number): string[] {
  const end = lines.indexOf('', index + 1);
  return lines.slice(index + 1, end === -1 ? lines.length : end).map((line) => line.trimStart());
}
