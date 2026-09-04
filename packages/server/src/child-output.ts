/**
 * A child process's captured stream, cut into the lines the connection log
 * stores (spec 013): one per output line, `\r` stripped, the trailing
 * newline's empty tail not a line, and a per-stream byte budget
 * (`--child-output-budget`) past which the rest is dropped and one `warn`
 * says so. Pure: the recorder writes what this returns.
 */

export interface ChildOutputCut {
  /** The lines that fit, in order — `line` numbers are their 1-based index. */
  lines: string[];
  /** Whether the budget cut the stream short. */
  truncated: boolean;
}

export function cutChildOutput(text: string, budgetBytes: number): ChildOutputCut {
  if (text.length === 0) return { lines: [], truncated: false };
  const rows = text.split('\n');
  if (rows.at(-1) === '') rows.pop();
  const lines: string[] = [];
  let bytes = 0;
  for (const raw of rows) {
    const line = raw.replace(/\r$/, '');
    bytes += Buffer.byteLength(line) + 1;
    if (bytes > budgetBytes) return { lines, truncated: true };
    lines.push(line);
  }
  return { lines, truncated: false };
}
