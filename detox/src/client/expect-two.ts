/**
 * The matcher / action / expectation serializer — a port of Detox 20's
 * `src/ios/expectTwo.js` (the file the frozen native dialect was built
 * against), invocation envelopes byte-for-byte:
 *
 *  - matchers   → predicate trees (`{type, value, isRegex}`, `and`/`or`/`not`
 *                 compositions, `ancestor`/`descendant`, semantic types with
 *                 `rawType`)
 *  - actions    → `{type:'action', action, atIndex?, params?, predicate,
 *                 targetElement?}` with v20's NaN→null / drop-undefined rules
 *  - expects    → `{type:'expectation', predicate, atIndex?, modifiers?,
 *                 expectation, params?}`
 *
 * Validation messages are v20's own texts, carried on typed
 * `DETOX_INVALID_ARGUMENT` errors (errno model, spec 004) instead of bare
 * `Error`s. Deliberate departures:
 *  - `traceCall`/trace descriptions do not exist.
 *  - `takeScreenshot` is a typed refusal — the artifacts lane.
 *  - `by.web`/`by.system` are typed-refusal surfaces — the XCUITest lane is
 *    excluded from the parity claim. Non-throwing getters, so enumerating
 *    `by` stays safe; every method on them refuses.
 *  - `waitFor` chains serialize with full v20 fidelity — validations,
 *    `{...expectation, timeout}` and `{...action, while}` terminal
 *    invocations alike (`expectTwo.js:722-762`).
 *  - every action/expectation accepts a trailing options bag (AbortSignal
 *    -first constraint); `tap` also accepts it as a sole argument, the shape
 *    the spec-003 accept file pins.
 */
/* eslint local/param-count: "off" -- the ported v20 signatures ARE the
   contract (`longPressAndDrag` alone takes eight positional arguments);
   grouping them into options objects would break every ported suite. */
import { DetoxError, DetoxErrorCode } from './errors';
import { getClasses } from './semantic-types';

/** Cancellation options accepted by every call (mirrors `AppCallOptions`). */
export interface CallOptions {
  readonly signal?: AbortSignal;
}

/** The seam to the wire: one frozen-dialect invocation, executed on an app. */
export interface InvocationExecutor {
  executeInvocation(
    invocation: Record<string, unknown>,
    options?: CallOptions,
  ): Promise<unknown>;
}

type Predicate = Record<string, unknown>;

/** A point argument (`tap`, `longPress`). */
export interface Point2D {
  x: number;
  y: number;
}

/* ───────────────────────────── ported utils ─────────────────────────────── */

// v20 `src/utils/isRegExp.js`
function isRegExp(value: unknown): value is RegExp {
  return Object.prototype.toString.call(value) === '[object RegExp]';
}

// v20 `src/utils/dateUtils.js`
function removeMilliseconds(isoDate: string): string {
  return isoDate.replace(/(T\d\d:\d\d:\d\d)(\.\d\d\d)/, '$1');
}

function invalidArgument(message: string): DetoxError {
  return new DetoxError(message, { code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
}

/**
 * v20 message fidelity for arbitrary garbage: objects print as
 * `[object Object]` (what v20's string concatenation produced), primitives as
 * themselves.
 */
function printed(value: unknown): string {
  return typeof value === 'object' && value !== null
    ? Object.prototype.toString.call(value)
    : String(value);
}

// v20 `src/utils/assertArgument.js` — `firstEntry` keys the message.
function firstEntry(arg: Record<string, unknown>): [string, unknown] {
  const entries = Object.entries(arg);
  return entries.length > 0 ? entries[0] : ['value', arg];
}

function assertNumber(arg: Record<string, unknown>): void {
  const [key, value] = firstEntry(arg);
  if (typeof value !== 'number') {
    throw invalidArgument(`${key} should be a number, but got ${String(value)} (${typeof value})`);
  }
}

function assertNormalized(arg: Record<string, unknown>): void {
  assertNumber(arg);
  const [key, value] = firstEntry(arg);
  if ((value as number) < 0 || (value as number) > 1) {
    throw invalidArgument(
      `${key} should be a number [0.0, 1.0], but got ${String(value)} (${typeof value})`,
    );
  }
}

function assertEnum(allowedValues: readonly string[]) {
  return (arg: Record<string, unknown>): void => {
    const [key, value] = firstEntry(arg);
    if (!allowedValues.includes(value as string)) {
      throw invalidArgument(
        `${key} should be one of [${allowedValues.join(', ')}], but got ${String(value)} (${typeof value})`,
      );
    }
  };
}

const assertDirection = assertEnum(['left', 'right', 'up', 'down']);
const assertSpeed = assertEnum(['fast', 'slow']);

// v20 `src/utils/mapLongPressArguments.js` and its inner asserts.
function assertPointArg(point: unknown): void {
  if (
    typeof point === 'object' &&
    point !== null &&
    typeof (point as Point2D).x === 'number' &&
    typeof (point as Point2D).y === 'number'
  ) {
    return;
  }
  throw invalidArgument(
    `point should be an object with x and y properties, but got ${JSON.stringify(point)}`,
  );
}

function assertDurationArg(duration: unknown): void {
  if (typeof duration === 'number') return;
  throw invalidArgument(
    'duration should be a number, but got ' + (String(duration) + (' (' + (typeof duration + ')'))),
  );
}

function assertUndefinedArg(arg: unknown): void {
  if (arg === undefined) return;
  throw invalidArgument(`value expected to be undefined, but got ${printed(arg)} (${typeof arg})`);
}

interface LongPressArgs {
  point: Point2D | null;
  duration: number | null;
}

function mapLongPressArguments(
  optionalPointOrDuration: unknown,
  optionalDuration: unknown,
): LongPressArgs {
  let point: Point2D | null = null;
  let duration: number | null = null;

  try {
    if (optionalPointOrDuration === undefined) {
      // Do nothing.
    } else if (typeof optionalPointOrDuration === 'number') {
      duration = optionalPointOrDuration;
      assertUndefinedArg(optionalDuration);
    } else {
      assertPointArg(optionalPointOrDuration);
      point = optionalPointOrDuration as Point2D;

      if (optionalDuration !== undefined) {
        assertDurationArg(optionalDuration);
        duration = optionalDuration as number;
      }
    }
  } catch (e) {
    throw invalidArgument(
      `longPress accepts either a duration (number) or a point ({x: number, y: number}) as ` +
        `its first argument, and optionally a duration (number) as its second argument. Error: ${(e as Error).message}`,
    );
  }

  return { point, duration };
}

// v20 `expectTwo.js:847-856`
function assertValidPoint(point: unknown): void {
  if (!point) {
    // point is optional
    return;
  }
  if (typeof point !== 'object') {
    throw invalidArgument(
      'point should be a object, but got ' + (printed(point) + (' (' + (typeof point + ')'))),
    );
  }
  const { x, y } = point as Partial<Point2D>;
  if (typeof x !== 'number') {
    throw invalidArgument(
      'point.x should be a number, but got ' + (String(x) + (' (' + (typeof x + ')'))),
    );
  }
  if (typeof y !== 'number') {
    throw invalidArgument(
      'point.y should be a number, but got ' + (String(y) + (' (' + (typeof y + ')'))),
    );
  }
}

function throwMatcherError(param: unknown): never {
  throw invalidArgument(
    `${String(param)} is not a Detox matcher. More about Detox matchers here: https://wix.github.io/Detox/docs/api/matchers`,
  );
}

function throwElementError(param: unknown): never {
  throw invalidArgument(
    `${String(param)} is not a Detox element. More about Detox elements here: https://wix.github.io/Detox/docs/api/matchers`,
  );
}

/** Predicates are JSON data by construction, so `structuredClone` is exact. */
function cloneDeep<T>(value: T): T {
  return structuredClone(value);
}

/** @issue DTX-3021: an object with an own `signal` and no coordinates is options, not a point. */
function isCallOptions(value: unknown): value is CallOptions {
  return (
    typeof value === 'object' &&
    value !== null &&
    'signal' in value &&
    !('x' in value) &&
    !('y' in value)
  );
}

/* ─────────────────────────────── matchers ───────────────────────────────── */

const createTypePredicate = (className: string): Predicate => ({ type: 'type', value: className });
const createOrPredicate = (predicates: Predicate[]): Predicate => ({ type: 'or', predicates });
/** @issue DTX-3020: exported for its unit pin only — no iOS semantic type reaches this today. */
export const createExclusionPredicate = (className: string, excludes: readonly string[]): Predicate => ({
  type: 'and',
  predicates: [
    createTypePredicate(className),
    {
      type: 'not',
      predicate: createOrPredicate(excludes.map(createTypePredicate)),
    },
  ],
});

/** What `Matcher.and` composes over — anything carrying a predicate. */
interface MatcherLike {
  predicate: Predicate;
}

/**
 * Cross-realm identity: under jest, this bundle is evaluated once in the
 * environment's realm and once per test file's sandboxed `require('detox')`
 * — `instanceof` is realm-local. The global symbol registry is per-isolate,
 * so a brand keyed by `Symbol.for` is what identity checks must read; the
 * classes stamp it on every instance, and the predicate payloads they
 * exchange are public data.
 */
const MATCHER_BRAND: unique symbol = Symbol.for('detox.matcher');
const ELEMENT_BRAND: unique symbol = Symbol.for('detox.element');

function isMatcher(value: unknown): value is Matcher {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[MATCHER_BRAND] === true
  );
}

/** @internal — `app.ts` guards its `expect`/`waitFor` receivers with this. */
export function isElement(value: unknown): value is Element {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[ELEMENT_BRAND] === true
  );
}

export class Matcher implements MatcherLike {
  readonly [MATCHER_BRAND] = true;
  predicate!: Predicate;

  /** Flattens one level of `and` on either side — v20 `Matcher.predicates`. */
  private static *predicates(matcher: MatcherLike): Generator<Predicate> {
    if (matcher.predicate.type === 'and') {
      yield* matcher.predicate.predicates as Predicate[];
    } else {
      yield matcher.predicate;
    }
  }

  accessibilityLabel(label: string | RegExp): this {
    return this.label(label);
  }

  label(label: string | RegExp): this {
    if (typeof label !== 'string' && !isRegExp(label)) {
      throw invalidArgument(
        'label should be a string or regex, but got ' + (String(label) + (' (' + (typeof label + ')'))),
      );
    }
    this.predicate = { type: 'label', value: label.toString(), isRegex: isRegExp(label) };
    return this;
  }

  id(id: string | RegExp): this {
    if (typeof id !== 'string' && !isRegExp(id)) {
      throw invalidArgument(
        'id should be a string or regex, but got ' + (String(id) + (' (' + (typeof id + ')'))),
      );
    }
    this.predicate = { type: 'id', value: id.toString(), isRegex: isRegExp(id) };
    return this;
  }

  type(typeOrSemanticType: string): this {
    if (typeof typeOrSemanticType !== 'string') {
      throw invalidArgument(
        'type should be a string, but got ' +
          (String(typeOrSemanticType) + (' (' + (typeof typeOrSemanticType + ')'))),
      );
    }

    const descriptors = getClasses(typeOrSemanticType, 'ios');
    const predicates = descriptors.map(({ className, excludes }) =>
      excludes.length ? createExclusionPredicate(className, excludes) : createTypePredicate(className),
    );

    this.predicate = predicates.length > 1 ? createOrPredicate(predicates) : predicates[0];
    // Rides the wire exactly as v20 sends it — the native tolerates the extra key.
    this.predicate.rawType = typeOrSemanticType;
    return this;
  }

  traits(traits: readonly string[]): this {
    if (!Array.isArray(traits)) {
      throw invalidArgument('traits must be an array, got ' + typeof traits);
    }
    this.predicate = { type: 'traits', value: traits };
    return this;
  }

  value(value: string): this {
    if (typeof value !== 'string') {
      throw invalidArgument(
        'value should be a string, but got ' + (String(value) + (' (' + (typeof value + ')'))),
      );
    }
    this.predicate = { type: 'value', value: value };
    return this;
  }

  text(text: string | RegExp): this {
    if (typeof text !== 'string' && !isRegExp(text)) {
      throw invalidArgument(
        `text should be a string or regex, but got ` + (String(text) + (' (' + (typeof text + ')'))),
      );
    }
    this.predicate = { type: 'text', value: text.toString(), isRegex: isRegExp(text) };
    return this;
  }

  withAncestor(matcher: Matcher): Matcher {
    if (!isMatcher(matcher)) {
      throwMatcherError(matcher);
    }
    return this.and({ predicate: { type: 'ancestor', predicate: matcher.predicate } } as unknown as Matcher);
  }

  withDescendant(matcher: Matcher): Matcher {
    if (!isMatcher(matcher)) {
      throwMatcherError(matcher);
    }
    return this.and({ predicate: { type: 'descendant', predicate: matcher.predicate } } as unknown as Matcher);
  }

  /**
   * The declared param is a matcher, but v20 also feeds this its internal
   * `{predicate}` wrappers (`withAncestor` above, cast at the call site).
   * Like v20, no runtime validation here — a non-matcher crashes on its
   * missing predicate exactly as it did there.
   */
  and(matcher: Matcher): Matcher {
    const result = new Matcher();
    result.predicate = {
      type: 'and',
      predicates: [
        ...Matcher.predicates(this),
        ...Matcher.predicates(matcher as MatcherLike),
      ].map((x) => cloneDeep(x)),
    };
    return result;
  }
}

/** One refusing method of the excluded XCUITest/web lane. */
function excludedLaneMethod(name: string): (...args: unknown[]) => never {
  return () => {
    throw new DetoxError(
      `${name} is not supported by this client — the XCUITest/web lane is outside the parity claim`,
      { code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED, details: { method: name } },
    );
  };
}

/** Every matcher name v20's web lane exposes, each a typed refusal. */
export type ExcludedMatcherLane = Readonly<Record<string, (...args: unknown[]) => never>>;

const WEB_BY_REFUSAL: ExcludedMatcherLane = Object.freeze(
  Object.fromEntries(
    ['id', 'className', 'cssSelector', 'name', 'xpath', 'href', 'hrefContains', 'tag', 'label', 'value', 'type'].map(
      (method) => [method, excludedLaneMethod(`by.web.${method}`)],
    ),
  ),
);

const SYSTEM_BY_REFUSAL: ExcludedMatcherLane = Object.freeze(
  Object.fromEntries(
    ['label', 'type'].map((method) => [method, excludedLaneMethod(`by.system.${method}`)]),
  ),
);

/**
 * The stateless matcher builder: a matcher is only predicate data.
 *
 * @issue DTX-3002: one shared object for every handle — a matcher built by
 * one app's `by` is legal input to another app's `element`.
 */
export const statelessBy = {
  id: (id: string | RegExp): Matcher => new Matcher().id(id),
  type: (type: string): Matcher => new Matcher().type(type),
  text: (text: string | RegExp): Matcher => new Matcher().text(text),
  label: (label: string | RegExp): Matcher => new Matcher().label(label),
  accessibilityLabel: (label: string | RegExp): Matcher => new Matcher().accessibilityLabel(label),
  traits: (traits: readonly string[]): Matcher => new Matcher().traits(traits),
  value: (value: string): Matcher => new Matcher().value(value),
  get web(): ExcludedMatcherLane {
    return WEB_BY_REFUSAL;
  },
  get system(): ExcludedMatcherLane {
    return SYSTEM_BY_REFUSAL;
  },
};

/* ─────────────────────────────── elements ───────────────────────────────── */

export class Element {
  readonly [ELEMENT_BRAND] = true;
  matcher: Matcher;
  index: number | undefined;
  protected readonly executor: InvocationExecutor;

  /** @internal — the channel this element is bound to. @issue DTX-3003 */
  get boundExecutor(): InvocationExecutor {
    return this.executor;
  }

  constructor(executor: InvocationExecutor, matcher: unknown, index?: number) {
    if (!isMatcher(matcher)) {
      throwMatcherError(matcher);
    }
    this.executor = executor;
    this.matcher = matcher;
    this.index = index;
  }

  atIndex(index: number): this {
    if (typeof index !== 'number') {
      throw invalidArgument(`atIndex argument must be a number, got ${typeof index}`);
    }
    this.index = index;
    return this;
  }

  getAttributes(options?: CallOptions): Promise<unknown> {
    return this.withAction('getAttributes', options);
  }

  tap(pointOrOptions?: Point2D | CallOptions, options?: CallOptions): Promise<void> {
    if (options === undefined && isCallOptions(pointOrOptions)) {
      return this.withAction('tap', pointOrOptions) as Promise<void>;
    }
    // @issue DTX-3021: a point that also carries `signal` is split — the
    // signal rides as options, stripped from the wire invocation.
    let point = pointOrOptions;
    let opts = options;
    if (point !== undefined && typeof point === 'object' && 'signal' in point) {
      const { signal, ...rest } = point as Point2D & CallOptions;
      point = rest;
      opts = opts ?? { signal };
    }
    assertValidPoint(point);
    return this.withAction('tap', opts, point) as Promise<void>;
  }

  longPress(
    pointOrDuration?: Point2D | number,
    duration?: number,
    options?: CallOptions,
  ): Promise<void> {
    const mapped = mapLongPressArguments(pointOrDuration, duration);
    return this.withAction('longPress', options, mapped.point, mapped.duration) as Promise<void>;
  }

  longPressAndDrag(
    duration: number,
    normalizedPositionX: number,
    normalizedPositionY: number,
    targetElement: Element,
    normalizedTargetPositionX = NaN,
    normalizedTargetPositionY = NaN,
    speed = 'fast',
    holdDuration = 1000,
    options?: CallOptions,
  ): Promise<void> {
    if (typeof duration !== 'number') {
      throw invalidArgument(
        'duration should be a number, but got ' + (String(duration) + (' (' + (typeof duration + ')'))),
      );
    }
    if (!isElement(targetElement)) throwElementError(targetElement);
    if (typeof holdDuration !== 'number') {
      throw invalidArgument(
        'duration should be a number, but got ' +
          (String(holdDuration) + (' (' + (typeof holdDuration + ')'))),
      );
    }
    assertSpeed({ speed });
    assertNormalized({ normalizedPositionX });
    assertNormalized({ normalizedPositionY });
    assertNormalized({ normalizedTargetPositionX });
    assertNormalized({ normalizedTargetPositionY });

    return this.withActionAndTargetElement(
      'longPress',
      targetElement,
      options,
      duration,
      normalizedPositionX,
      normalizedPositionY,
      normalizedTargetPositionX,
      normalizedTargetPositionY,
      speed,
      holdDuration,
    ) as Promise<void>;
  }

  multiTap(times: number, options?: CallOptions): Promise<void> {
    if (typeof times !== 'number') {
      throw invalidArgument(
        'times should be a number, but got ' + (String(times) + (' (' + (typeof times + ')'))),
      );
    }
    if (times < 1) {
      throw invalidArgument('times should be greater than 0, but got ' + String(times));
    }
    return this.withAction('multiTap', options, times) as Promise<void>;
  }

  tapAtPoint(point?: Point2D, options?: CallOptions): Promise<void> {
    return this.tap(point, options);
  }

  tapBackspaceKey(options?: CallOptions): Promise<void> {
    return this.withAction('tapBackspaceKey', options) as Promise<void>;
  }

  tapReturnKey(options?: CallOptions): Promise<void> {
    return this.withAction('tapReturnKey', options) as Promise<void>;
  }

  typeText(text: string, options?: CallOptions): Promise<void> {
    if (typeof text !== 'string') {
      throw invalidArgument(
        'text should be a string, but got ' + (String(text) + (' (' + (typeof text + ')'))),
      );
    }
    return this.withAction('typeText', options, text) as Promise<void>;
  }

  replaceText(text: string, options?: CallOptions): Promise<void> {
    if (typeof text !== 'string') {
      throw invalidArgument(
        'text should be a string, but got ' + (String(text) + (' (' + (typeof text + ')'))),
      );
    }
    return this.withAction('replaceText', options, text) as Promise<void>;
  }

  clearText(options?: CallOptions): Promise<void> {
    return this.withAction('clearText', options) as Promise<void>;
  }

  performAccessibilityAction(actionName: string, options?: CallOptions): Promise<void> {
    if (typeof actionName !== 'string') {
      throw invalidArgument(
        'actionName should be a string, but got ' +
          (String(actionName) + (' (' + (typeof actionName + ')'))),
      );
    }
    return this.withAction('accessibilityAction', options, actionName) as Promise<void>;
  }

  scroll(
    pixels: number,
    direction = 'down',
    startPositionX = NaN,
    startPositionY = NaN,
    options?: CallOptions,
  ): Promise<void> {
    if (!['left', 'right', 'up', 'down'].some((option) => option === direction)) {
      throw invalidArgument(
        'direction should be one of [left, right, up, down], but got ' + String(direction),
      );
    }
    if (typeof pixels !== 'number') {
      throw invalidArgument(
        'amount of pixels should be a number, but got ' +
          (String(pixels) + (' (' + (typeof pixels + ')'))),
      );
    }
    if (typeof startPositionX !== 'number') {
      throw invalidArgument(
        'startPositionX should be a number, but got ' +
          (String(startPositionX) + (' (' + (typeof startPositionX + ')'))),
      );
    }
    if (typeof startPositionY !== 'number') {
      throw invalidArgument(
        'startPositionY should be a number, but got ' +
          (String(startPositionY) + (' (' + (typeof startPositionY + ')'))),
      );
    }
    return this.withAction(
      'scroll',
      options,
      pixels,
      direction,
      startPositionX,
      startPositionY,
    ) as Promise<void>;
  }

  scrollTo(edge: string, startPositionX = NaN, startPositionY = NaN, options?: CallOptions): Promise<void> {
    if (!['left', 'right', 'top', 'bottom'].some((option) => option === edge)) {
      throw invalidArgument(
        'edge should be one of [left, right, top, bottom], but got ' + String(edge),
      );
    }
    if (typeof startPositionX !== 'number') {
      throw invalidArgument(
        'startPositionX should be a number, but got ' +
          (String(startPositionX) + (' (' + (typeof startPositionX + ')'))),
      );
    }
    if (typeof startPositionY !== 'number') {
      throw invalidArgument(
        'startPositionY should be a number, but got ' +
          (String(startPositionY) + (' (' + (typeof startPositionY + ')'))),
      );
    }
    return this.withAction('scrollTo', options, edge, startPositionX, startPositionY) as Promise<void>;
  }

  swipe(
    direction: string,
    speed = 'fast',
    normalizedSwipeOffset = NaN,
    normalizedStartingPointX = NaN,
    normalizedStartingPointY = NaN,
    options?: CallOptions,
  ): Promise<void> {
    assertDirection({ direction });
    assertSpeed({ speed });
    assertNormalized({ normalizedSwipeOffset });
    assertNormalized({ normalizedStartingPointX });
    assertNormalized({ normalizedStartingPointY });

    normalizedSwipeOffset = Number.isNaN(normalizedSwipeOffset) ? 0.75 : normalizedSwipeOffset;
    return this.withAction(
      'swipe',
      options,
      direction,
      speed,
      normalizedSwipeOffset,
      normalizedStartingPointX,
      normalizedStartingPointY,
    ) as Promise<void>;
  }

  setColumnToValue(column: number, value: string, options?: CallOptions): Promise<void> {
    if (typeof column !== 'number') {
      throw invalidArgument(
        'column should be a number, but got ' + (String(column) + (' (' + (typeof column + ')'))),
      );
    }
    if (typeof value !== 'string') {
      throw invalidArgument(
        'value should be a string, but got ' + (String(value) + (' (' + (typeof value + ')'))),
      );
    }
    return this.withAction('setColumnToValue', options, column, value) as Promise<void>;
  }

  setDatePickerDate(dateString: string, dateFormat: string, options?: CallOptions): Promise<void> {
    if (typeof dateString !== 'string') {
      throw invalidArgument(
        'dateString should be a string, but got ' +
          (String(dateString) + (' (' + (typeof dateString + ')'))),
      );
    }
    if (typeof dateFormat !== 'string') {
      throw invalidArgument(
        'dateFormat should be a string, but got ' +
          (String(dateFormat) + (' (' + (typeof dateFormat + ')'))),
      );
    }
    if (dateFormat === 'ISO8601') {
      dateString = removeMilliseconds(dateString);
    }
    return this.withAction('setDatePickerDate', options, dateString, dateFormat) as Promise<void>;
  }

  pinch(scale: number, speed = 'fast', angle = 0, options?: CallOptions): Promise<void> {
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale < 0) {
      throw invalidArgument(`pinch scale must be a finite number larger than zero`);
    }
    if (!['slow', 'fast'].includes(speed)) {
      throw invalidArgument(`pinch speed is either 'slow' or 'fast'`);
    }
    if (typeof angle !== 'number' || !Number.isFinite(angle)) {
      throw invalidArgument(`pinch angle must be a finite number (radian)`);
    }
    return this.withAction('pinch', options, scale, speed, angle) as Promise<void>;
  }

  pinchWithAngle(direction: string, speed = 'slow', angle = 0, options?: CallOptions): Promise<void> {
    if (!['inward', 'outward'].includes(direction)) {
      throw invalidArgument(`pinchWithAngle direction is either 'inward' or 'outward'`);
    }
    if (!['slow', 'fast'].includes(speed)) {
      throw invalidArgument(`pinchWithAngle speed is either 'slow' or 'fast'`);
    }
    if (typeof angle !== 'number') {
      throw invalidArgument(`pinchWithAngle angle must be a number (radiant), got ${typeof angle}`);
    }
    return this.withAction('pinchWithAngle', options, direction, speed, angle) as Promise<void>;
  }

  adjustSliderToPosition(position: number, options?: CallOptions): Promise<void> {
    if (!(typeof position === 'number' && position >= 0 && position <= 1)) {
      throw invalidArgument(
        'position should be a number [0.0, 1.0], but got ' +
          (String(position) + (' (' + (typeof position + ')'))),
      );
    }
    return this.withAction('adjustSliderToPosition', options, position) as Promise<void>;
  }

  /** Typed refusal — screenshots belong to the artifacts lane. */
  takeScreenshot(_fileName?: string): Promise<never> {
    return Promise.reject(
      new DetoxError(
        'element.takeScreenshot is not implemented — it lands with the artifacts spec',
        { code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED, details: { method: 'element.takeScreenshot' } },
      ),
    );
  }

  /** v20 `Element.createInvocation`, byte-for-byte on the envelope. */
  protected createInvocation(
    action: string,
    targetElement: Element | null,
    ...params: unknown[]
  ): Record<string, unknown> {
    const mapped = params.map((param) =>
      typeof param === 'number' && Number.isNaN(param) ? null : param,
    );
    const definedParams = mapped.filter((param) => param !== undefined);
    const invocation: Record<string, unknown> = {
      type: 'action',
      action,
      ...(this.index !== undefined && { atIndex: this.index }),
      ...(definedParams.length !== 0 && { params: definedParams }),
      predicate: this.matcher.predicate,
    };
    if (targetElement) {
      invocation.targetElement = { predicate: targetElement.matcher.predicate };
    }
    return invocation;
  }

  protected withAction(
    action: string,
    options: CallOptions | undefined,
    ...params: unknown[]
  ): Promise<unknown> {
    return this.executor.executeInvocation(this.createInvocation(action, null, ...params), options);
  }

  protected withActionAndTargetElement(
    action: string,
    targetElement: Element,
    options: CallOptions | undefined,
    ...params: unknown[]
  ): Promise<unknown> {
    return this.executor.executeInvocation(
      this.createInvocation(action, targetElement, ...params),
      options,
    );
  }
}

/**
 * v20 `InternalElement` — same validations, but an action only records its
 * invocation (the `waitFor` chain composes it; nothing is sent).
 */
export class InternalElement extends Element {
  lastInvocation: Record<string, unknown> | undefined;

  protected override withAction(
    action: string,
    _options: CallOptions | undefined,
    ...params: unknown[]
  ): Promise<unknown> {
    this.lastInvocation = this.createInvocation(action, null, ...params);
    return Promise.resolve();
  }
}

/* ────────────────────────────── expectations ────────────────────────────── */

export class Expect {
  readonly element: Element;
  modifiers: string[] = [];
  protected readonly executor: InvocationExecutor;

  constructor(executor: InvocationExecutor, element: Element) {
    this.executor = executor;
    this.element = element;
  }

  get not(): this {
    this.modifiers.push('not');
    return this;
  }

  toBeVisible(percentOrOptions?: number | CallOptions, options?: CallOptions): Promise<void> {
    if (options === undefined && isCallOptions(percentOrOptions)) {
      return this.expect('toBeVisible', percentOrOptions);
    }
    const percent = percentOrOptions;
    if (
      percent !== undefined &&
      (!Number.isSafeInteger(percent) || (percent as number) < 1 || (percent as number) > 100)
    ) {
      throw invalidArgument(
        '`percent` must be an integer between 1 and 100, but got ' +
          (printed(percent) + (' (' + (typeof percent + ')'))),
      );
    }
    return this.expect('toBeVisible', options, percent);
  }

  toBeNotVisible(options?: CallOptions): Promise<void> {
    return this.not.toBeVisible(options);
  }

  toBeFocused(options?: CallOptions): Promise<void> {
    return this.expect('toBeFocused', options);
  }

  toBeNotFocused(options?: CallOptions): Promise<void> {
    return this.not.toBeFocused(options);
  }

  toExist(options?: CallOptions): Promise<void> {
    return this.expect('toExist', options);
  }

  toNotExist(options?: CallOptions): Promise<void> {
    return this.not.toExist(options);
  }

  toHaveText(text: string | RegExp, options?: CallOptions): Promise<void> {
    const isRegex = isRegExp(text);
    return this.expect('toHaveText', options, isRegex ? text.toString() : text, isRegex || undefined);
  }

  toNotHaveText(text: string | RegExp, options?: CallOptions): Promise<void> {
    return this.not.toHaveText(text, options);
  }

  toHaveLabel(label: string, options?: CallOptions): Promise<void> {
    return this.expect('toHaveLabel', options, label);
  }

  toNotHaveLabel(label: string, options?: CallOptions): Promise<void> {
    return this.not.toHaveLabel(label, options);
  }

  toHaveId(id: string, options?: CallOptions): Promise<void> {
    return this.expect('toHaveId', options, id);
  }

  toNotHaveId(id: string, options?: CallOptions): Promise<void> {
    return this.not.toHaveId(id, options);
  }

  toHaveValue(value: string, options?: CallOptions): Promise<void> {
    return this.expect('toHaveValue', options, value);
  }

  toNotHaveValue(value: string, options?: CallOptions): Promise<void> {
    return this.not.toHaveValue(value, options);
  }

  toHaveSliderPosition(position: number, tolerance = 0, options?: CallOptions): Promise<void> {
    return this.expect('toHaveSliderPosition', options, position, tolerance);
  }

  toHaveToggleValue(value: boolean, options?: CallOptions): Promise<void> {
    const expectedValue = Number(value);
    return this.expect('toHaveToggleValue', options, expectedValue);
  }

  /** v20 `Expect.createInvocation`, byte-for-byte on the envelope. */
  protected createInvocation(expectation: string, ...params: unknown[]): Record<string, unknown> {
    const definedParams = params.filter((param) => param !== undefined);
    return {
      type: 'expectation',
      predicate: this.element.matcher.predicate,
      ...(this.element.index !== undefined && { atIndex: this.element.index }),
      // @issue DTX-3025: a snapshot, not the live array — an already-recorded
      // invocation must not change when a later `.not` mutates the chain.
      ...(this.modifiers.length !== 0 && { modifiers: [...this.modifiers] }),
      expectation,
      ...(definedParams.length !== 0 && { params: definedParams }),
    };
  }

  protected expect(
    expectation: string,
    options: CallOptions | undefined,
    ...params: unknown[]
  ): Promise<void> {
    return this.executor.executeInvocation(
      this.createInvocation(expectation, ...params),
      options,
    ) as Promise<void>;
  }
}

/** v20 `InternalExpect` — records the invocation for the `waitFor` chain. */
export class InternalExpect extends Expect {
  lastInvocation: Record<string, unknown> | undefined;

  protected override expect(
    expectation: string,
    _options: CallOptions | undefined,
    ...params: unknown[]
  ): Promise<void> {
    this.lastInvocation = this.createInvocation(expectation, ...params);
    return Promise.resolve();
  }
}

/* ──────────────────────────────── waitFor ───────────────────────────────── */

/**
 * v20 `WaitFor`, chain shape, validations, and terminals. The terminals
 * compose v20's exact invocations (`expectTwo.js:722-762`): `withTimeout`
 * sends `{...action, ...expectation, timeout}`; a `whileElement` action
 * sends `{...action, while: {...expectation}}`. Both ride the same `invoke`
 * lane as `expect` — the app enforces the clock, never the client (no
 * patience timers here). Terminals take a trailing {@link CallOptions}
 * (AbortSignal-first), which v20 did not have.
 */
export class WaitFor {
  private readonly internalElement: InternalElement;
  private expectation: InternalExpect;
  private actionableElement: InternalElement | undefined;
  private readonly executor: InvocationExecutor;

  constructor(executor: InvocationExecutor, element: Element) {
    this.executor = executor;
    this.internalElement = new InternalElement(executor, element.matcher, element.index);
    this.expectation = new InternalExpect(executor, this.internalElement);
  }

  private freshExpectation(): InternalExpect {
    // @issue DTX-3022: a second expectation on one chain (or a `.not` after
    // one) refuses typed instead of accumulating stale modifiers.
    if (this.expectation.lastInvocation !== undefined) {
      throw invalidArgument(
        'waitFor(...) already recorded an expectation — build a fresh waitFor chain',
      );
    }
    return this.expectation;
  }

  get not(): this {
    void this.freshExpectation().not;
    return this;
  }

  toBeVisible(percent?: number): this {
    void this.freshExpectation().toBeVisible(percent);
    return this;
  }

  toBeNotVisible(): this {
    void this.freshExpectation().toBeNotVisible();
    return this;
  }

  toExist(): this {
    void this.freshExpectation().toExist();
    return this;
  }

  toNotExist(): this {
    void this.freshExpectation().toNotExist();
    return this;
  }

  toHaveText(text: string | RegExp): this {
    void this.freshExpectation().toHaveText(text);
    return this;
  }

  toNotHaveText(text: string | RegExp): this {
    void this.freshExpectation().toNotHaveText(text);
    return this;
  }

  toHaveLabel(label: string): this {
    void this.freshExpectation().toHaveLabel(label);
    return this;
  }

  toNotHaveLabel(label: string): this {
    void this.freshExpectation().toNotHaveLabel(label);
    return this;
  }

  toHaveId(id: string): this {
    void this.freshExpectation().toHaveId(id);
    return this;
  }

  toNotHaveId(id: string): this {
    void this.freshExpectation().toNotHaveId(id);
    return this;
  }

  toHaveValue(value: string): this {
    void this.freshExpectation().toHaveValue(value);
    return this;
  }

  toNotHaveValue(value: string): this {
    void this.freshExpectation().toNotHaveValue(value);
    return this;
  }

  toBeFocused(): this {
    void this.freshExpectation().toBeFocused();
    return this;
  }

  toBeNotFocused(): this {
    void this.freshExpectation().toBeNotFocused();
    return this;
  }

  withTimeout(timeout: number, options?: CallOptions): Promise<void> {
    if (typeof timeout !== 'number') {
      throw invalidArgument(
        'text should be a number, but got ' + (String(timeout) + (' (' + (typeof timeout + ')'))),
      );
    }
    // @issue DTX-3023: NaN/Infinity would serialize as `timeout: null` on
    // the frozen frame — a native crash class, refused typed here.
    if (!Number.isFinite(timeout)) {
      throw invalidArgument(`timeout must be a finite number, but got ${String(timeout)}`);
    }
    if (timeout < 0) {
      throw invalidArgument('timeout must be larger than 0');
    }
    // v20 `createWaitForWithTimeoutInvocation` — `{...action, ...expectation,
    // timeout}`, action spread first so the expectation's keys win, verbatim.
    const invocation = {
      ...(this.actionableElement?.lastInvocation ?? {}),
      ...this.requireExpectation('withTimeout'),
      timeout,
    };
    return this.executor.executeInvocation(invocation, options) as Promise<void>;
  }

  whileElement(matcher: Matcher): this {
    if (!isMatcher(matcher)) throwMatcherError(matcher);
    this.actionableElement = new InternalElement(this.executor, matcher);
    return this;
  }

  private requireActionable(): InternalElement {
    // @issue DTX-3027: v20 crashes with a bare TypeError here; the typed error names the fix.
    if (!this.actionableElement) {
      throw invalidArgument('waitFor(...).whileElement(matcher) must precede the action');
    }
    return this.actionableElement;
  }

  private requireExpectation(terminal: string): Record<string, unknown> {
    // @issue DTX-3026: v20 spreads the raw Expect instance here and ships
    // the app garbage; a chain with no expectation refuses typed instead.
    const expectation = this.expectation.lastInvocation;
    if (!expectation) {
      throw invalidArgument(`waitFor(...) needs an expectation before ${terminal}`);
    }
    return expectation;
  }

  /**
   * v20 `createWaitForWithActionInvocation` — the action the caller just
   * recorded on the actionable element, with the expectation as its `while`
   * clause.
   */
  private executeWhileAction(options?: CallOptions): Promise<void> {
    const invocation = {
      ...this.requireActionable().lastInvocation,
      while: { ...this.requireExpectation('the whileElement action') },
    };
    return this.executor.executeInvocation(invocation, options) as Promise<void>;
  }

  tap(point?: Point2D | CallOptions, options?: CallOptions): Promise<void> {
    // @issue DTX-3024: mirrors Element.tap's sole-options shape — `tap({signal})` is options, not a point.
    if (options === undefined && isCallOptions(point)) {
      void this.requireActionable().tap();
      return this.executeWhileAction(point);
    }
    void this.requireActionable().tap(point);
    return this.executeWhileAction(options);
  }

  tapAtPoint(point?: Point2D, options?: CallOptions): Promise<void> {
    void this.requireActionable().tap(point);
    return this.executeWhileAction(options);
  }

  longPress(pointOrDuration?: Point2D | number, duration?: number, options?: CallOptions): Promise<void> {
    void this.requireActionable().longPress(pointOrDuration, duration);
    return this.executeWhileAction(options);
  }

  multiTap(times: number, options?: CallOptions): Promise<void> {
    void this.requireActionable().multiTap(times);
    return this.executeWhileAction(options);
  }

  tapBackspaceKey(options?: CallOptions): Promise<void> {
    void this.requireActionable().tapBackspaceKey();
    return this.executeWhileAction(options);
  }

  tapReturnKey(options?: CallOptions): Promise<void> {
    void this.requireActionable().tapReturnKey();
    return this.executeWhileAction(options);
  }

  typeText(text: string, options?: CallOptions): Promise<void> {
    void this.requireActionable().typeText(text);
    return this.executeWhileAction(options);
  }

  replaceText(text: string, options?: CallOptions): Promise<void> {
    void this.requireActionable().replaceText(text);
    return this.executeWhileAction(options);
  }

  clearText(options?: CallOptions): Promise<void> {
    void this.requireActionable().clearText();
    return this.executeWhileAction(options);
  }

  scroll(pixels: number, direction?: string, startPositionX?: number, startPositionY?: number, options?: CallOptions): Promise<void> {
    void this.requireActionable().scroll(pixels, direction, startPositionX, startPositionY);
    return this.executeWhileAction(options);
  }

  scrollTo(edge: string, options?: CallOptions): Promise<void> {
    void this.requireActionable().scrollTo(edge);
    return this.executeWhileAction(options);
  }

  swipe(direction: string, speed?: string, normalizedSwipeOffset?: number, options?: CallOptions): Promise<void> {
    void this.requireActionable().swipe(direction, speed, normalizedSwipeOffset);
    return this.executeWhileAction(options);
  }

  setColumnToValue(column: number, value: string, options?: CallOptions): Promise<void> {
    void this.requireActionable().setColumnToValue(column, value);
    return this.executeWhileAction(options);
  }

  setDatePickerDate(dateString: string, dateFormat: string, options?: CallOptions): Promise<void> {
    void this.requireActionable().setDatePickerDate(dateString, dateFormat);
    return this.executeWhileAction(options);
  }

  performAccessibilityAction(actionName: string, options?: CallOptions): Promise<void> {
    void this.requireActionable().performAccessibilityAction(actionName);
    return this.executeWhileAction(options);
  }

  pinch(scale: number, speed?: string, angle?: number, options?: CallOptions): Promise<void> {
    void this.requireActionable().pinch(scale, speed, angle);
    return this.executeWhileAction(options);
  }

  pinchWithAngle(direction: string, speed?: string, angle?: number, options?: CallOptions): Promise<void> {
    void this.requireActionable().pinchWithAngle(direction, speed, angle);
    return this.executeWhileAction(options);
  }
}
