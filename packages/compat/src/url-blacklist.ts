/**
 * `detoxURLBlacklistRegex`'s launch-arg serializer — a port of Detox 20's
 * `src/devices/common/drivers/utils/urlBlacklist.js` (the iOS half) and of the
 * single call site that used it, `AppleSimUtils._mergeLaunchArgs:534`.
 *
 * Why it lives in compat (spec 006's compat mapping): the v21 wire carries
 * launch arguments as strings, and a RegExp is not a wire value. v20 accepted
 * `RegExp`, `string`, or an array of either on this one launch argument and
 * normalized it, at launch time, into a JSON array of ICU-portable patterns.
 * That normalization is a v20 dialect fact, so it belongs to the surface that
 * speaks v20 — not to the client, and not to the server.
 *
 * @issue DTX-4037: kept verbatim — a plain string passes through untouched, `g`/`y`/`d`/`u`/`v`
 * flags are refused as non-portable, and `i`/`m`/`s` become an inline `(?ims:…)` group, because
 * the native side compiles the pattern with ICU, which has no flags argument.
 *
 * A non-RegExp, non-string value throws a `TypeError` with v20's own wording.
 */

const UNSUPPORTED_FLAGS = ['g', 'y', 'd', 'u', 'v'] as const;

/** v20 `withPortableFlags`: inline flag group, or the bare source. */
function withPortableFlags(regex: RegExp): string {
  const unsupported = UNSUPPORTED_FLAGS.filter((flag) => regex.flags.includes(flag));
  if (unsupported.length > 0) {
    throw new TypeError(
      `detoxURLBlacklistRegex: flag(s) [${unsupported.join(', ')}] in /${regex.source}/${regex.flags} ` +
        `are not portable across iOS and Android — only i, m, s are supported`,
    );
  }
  const flags = [regex.ignoreCase && 'i', regex.multiline && 'm', regex.dotAll && 's']
    .filter(Boolean)
    .join('');
  return flags ? `(?${flags}:${regex.source})` : regex.source;
}

/** v20 `toRegexPattern`. */
function toRegexPattern(value: unknown): string {
  if (value instanceof RegExp) return withPortableFlags(value);
  if (typeof value === 'string') return value;
  throw new TypeError(
    [
      'detoxURLBlacklistRegex must be a RegExp, string,',
      `or an array of RegExp/string values, got ${typeof value}`,
    ].join(' '),
  );
}

/** v20 `toURLBlacklistArray`: `null` means "not a blacklist shape, leave it alone". */
function toURLBlacklistArray(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((entry) => toRegexPattern(entry));
  if (value instanceof RegExp) return [toRegexPattern(value)];
  return null;
}

/**
 * v20 `serializeURLBlacklistForIOS`: an array/RegExp becomes a JSON array of
 * patterns; anything else (a plain string, a number, `undefined`) is returned
 * unchanged, exactly as v20 did.
 */
export function serializeURLBlacklistForIOS(value: unknown): unknown {
  const patterns = toURLBlacklistArray(value);
  return patterns === null ? value : JSON.stringify(patterns);
}

/** The launch-arg key v20 reserved for this (`URL_BLACKLIST_LAUNCH_ARG`). */
export const URL_BLACKLIST_LAUNCH_ARG = 'detoxURLBlacklistRegex';

/**
 * @issue DTX-4022: v20 `normalizeURLBlacklist` (`RuntimeDevice.js:334` runs it on every
 * `device.setURLBlacklist` call) — RegExp entries become ICU-portable pattern strings; a
 * non-blacklist shape passes through unchanged so the client's own typed validation names it.
 */
export function normalizeURLBlacklist(value: unknown): unknown {
  const patterns = toURLBlacklistArray(value);
  return patterns === null ? value : patterns;
}
