/**
 * Serializer pins, lifted from Detox 20's own `src/ios/expectTwo.test.js`:
 * every deep-equal below reproduces a fixture from that file (byte-for-byte —
 * the frozen native accepts exactly these envelopes), plus coverage of the
 * v21-only surfaces (trailing options, typed refusal lanes, the waitFor
 * terminals' refusal).
 */
import { describe, expect, it } from 'vitest';
import { DetoxErrorCode } from '../errors';
import {
  Element,
  Expect,
  InternalElement,
  InternalExpect,
  WaitFor,
  createExclusionPredicate,
  statelessBy as by,
  type CallOptions,
  type InvocationExecutor,
} from '../expect-two';
import { getClasses } from '../semantic-types';

interface SentAction {
  action: string;
  params?: unknown[];
}

interface SentExpectation {
  expectation: string;
  modifiers?: string[];
}

class MockExecutor implements InvocationExecutor {
  readonly calls: Array<{ invocation: Record<string, unknown>; options: CallOptions | undefined }> =
    [];
  result: unknown;

  executeInvocation(
    invocation: Record<string, unknown>,
    options?: CallOptions,
  ): Promise<unknown> {
    this.calls.push({ invocation, options });
    return Promise.resolve(this.result);
  }
}

function harness() {
  const executor = new MockExecutor();
  return {
    executor,
    element: (matcher: unknown): Element => new Element(executor, matcher),
    expectEl: (element: Element): Expect => new Expect(executor, element),
    waitFor: (element: Element): WaitFor => new WaitFor(executor, element),
    /** The single invocation the call produced. */
    sent: (): Record<string, unknown> => {
      expect(executor.calls).toHaveLength(1);
      return executor.calls[0].invocation;
    },
  };
}

describe('matcher serialization (v20 fixtures)', () => {
  it('tap on a text matcher', async () => {
    const h = harness();
    await h.element(by.text('tapMe')).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: { type: 'text', value: 'tapMe', isRegex: false },
    });
  });

  it('RegExp text matcher stringifies with slashes', async () => {
    const h = harness();
    await h.element(by.text(/tapMe/)).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: { type: 'text', value: '/tapMe/', isRegex: true },
    });
  });

  it('tap with a point parameter', async () => {
    const h = harness();
    await h.element(by.text('tapMe')).tap({ x: 1, y: 2 });
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      params: [{ x: 1, y: 2 }],
      predicate: { type: 'text', value: 'tapMe', isRegex: false },
    });
  });

  it('id AND text matchers', async () => {
    const h = harness();
    await h.element(by.id('uniqueId').and(by.text('some text'))).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: 'uniqueId', isRegex: false },
          { type: 'text', value: 'some text', isRegex: false },
        ],
      },
    });
  });

  it('regex id AND regex text matchers', async () => {
    const h = harness();
    await h.element(by.id(/uniqueId/).and(by.text(/some text/))).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: '/uniqueId/', isRegex: true },
          { type: 'text', value: '/some text/', isRegex: true },
        ],
      },
    });
  });

  it('ancestor matcher', async () => {
    const h = harness();
    await h.element(by.id('child').withAncestor(by.id('parent'))).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: 'child', isRegex: false },
          { type: 'ancestor', predicate: { type: 'id', value: 'parent', isRegex: false } },
        ],
      },
    });
  });

  it('descendant matcher', async () => {
    const h = harness();
    await h.element(by.id('parent').withDescendant(by.id('child'))).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: 'parent', isRegex: false },
          { type: 'descendant', predicate: { type: 'id', value: 'child', isRegex: false } },
        ],
      },
    });
  });

  it('regex ancestor matcher', async () => {
    const h = harness();
    await h.element(by.id('child').withAncestor(by.id(/parent/))).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: 'child', isRegex: false },
          { type: 'ancestor', predicate: { type: 'id', value: '/parent/', isRegex: true } },
        ],
      },
    });
  });

  it('regex label matcher', async () => {
    const h = harness();
    await h.element(by.label(/tapMe/)).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: { type: 'label', value: '/tapMe/', isRegex: true },
    });
  });

  it.each([['withAncestor'], ['withDescendant'], ['and']] as const)(
    'combining matchers is immutable: %s',
    (combineMethodName) => {
      const base = by.id('abc');
      const modifier = by.id('def');
      expect(base[combineMethodName](modifier)).not.toBe(base);
      expect(base).toEqual(by.id('abc'));
      expect(modifier).toEqual(by.id('def'));
    },
  );

  it('ancestor and index matchers', async () => {
    const h = harness();
    await h.element(by.id('child').withAncestor(by.id('parent'))).atIndex(0).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      atIndex: 0,
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: 'child', isRegex: false },
          { type: 'ancestor', predicate: { type: 'id', value: 'parent', isRegex: false } },
        ],
      },
    });
  });

  it('nested and-composition flattens exactly as v20', async () => {
    const h = harness();
    await h.element(by.id('child').and(by.text('text').and(by.value('value')))).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: 'child', isRegex: false },
          { type: 'text', value: 'text', isRegex: false },
          // v20's value matcher carries NO isRegex key.
          { type: 'value', value: 'value' },
        ],
      },
    });
  });

  it('ancestor with an and-composed inner matcher', async () => {
    const h = harness();
    await h.element(by.id('child').withAncestor(by.id('parent').and(by.text('text')))).tap();
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'and',
        predicates: [
          { type: 'id', value: 'child', isRegex: false },
          {
            type: 'ancestor',
            predicate: {
              type: 'and',
              predicates: [
                { type: 'id', value: 'parent', isRegex: false },
                { type: 'text', value: 'text', isRegex: false },
              ],
            },
          },
        ],
      },
    });
  });

  it('accessibilityLabel is label; traits serialize as an array', async () => {
    const h = harness();
    await h.element(by.accessibilityLabel('hello')).tap();
    expect(h.sent().predicate).toEqual({ type: 'label', value: 'hello', isRegex: false });

    const h2 = harness();
    await h2.element(by.traits(['button', 'image'])).tap();
    expect(h2.sent().predicate).toEqual({ type: 'traits', value: ['button', 'image'] });
  });

  /**
   * @issue DTX-3000
   * `getClasses` falls back to the type string itself, with no exclusions,
   * when it's not a key in the semantic table — this is what lets
   * `by.type('RCTImageView')`, a literal native class name, resolve.
   */
  it('a literal native class via by.type carries rawType (v20 semantic types)', async () => {
    const h = harness();
    await h.element(by.type('RCTImageView')).tap();
    expect(h.sent().predicate).toEqual({
      type: 'type',
      value: 'RCTImageView',
      rawType: 'RCTImageView',
    });
  });

  it('a semantic type expands to an or-predicate of its iOS classes', async () => {
    const h = harness();
    await h.element(by.type('image')).tap();
    expect(h.sent().predicate).toEqual({
      type: 'or',
      predicates: [
        { type: 'type', value: 'RCTImageView' },
        { type: 'type', value: 'RCTImageComponentView' },
        { type: 'type', value: 'UIImageView' },
      ],
      rawType: 'image',
    });
  });

  it('the android half of the semantic table produces exclusion predicates (kept whole for parity)', () => {
    expect(getClasses('text', 'android')).toEqual([
      {
        className: 'android.widget.TextView',
        excludes: ['android.widget.EditText', 'android.widget.Button'],
      },
      {
        className: 'com.facebook.react.views.text.ReactTextView',
        excludes: ['android.widget.EditText', 'android.widget.Button'],
      },
    ]);
    expect(getClasses('slider', 'android')).toEqual([
      { className: 'android.widget.SeekBar', excludes: [] },
    ]);
    // @issue DTX-3020
    // `createExclusionPredicate` (the exclusion tree v20 emits, `expectTwo.js:22-31`)
    // is unreachable through `by.type` on iOS today — no semantic type's iOS
    // classes carry excludes — so it is pinned directly here, to keep the
    // dialect shape alive until Android parity exercises it.
    expect(createExclusionPredicate('android.widget.TextView', ['android.widget.EditText'])).toEqual({
      type: 'and',
      predicates: [
        { type: 'type', value: 'android.widget.TextView' },
        {
          type: 'not',
          predicate: { type: 'or', predicates: [{ type: 'type', value: 'android.widget.EditText' }] },
        },
      ],
    });
  });

  it('matcher validation speaks v20, typed 2011', () => {
    const cases: Array<() => unknown> = [
      () => by.id(5 as never),
      () => by.text(5 as never),
      () => by.label(5 as never),
      () => by.type(5 as never),
      () => by.traits('button' as never),
      () => by.value(5 as never),
    ];
    for (const build of cases) {
      expect(build).toThrowError(
        expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
      );
    }
    expect(() => by.id('x').withAncestor({} as never)).toThrowError(/is not a Detox matcher/);
    expect(() => by.id('x').withDescendant({} as never)).toThrowError(/is not a Detox matcher/);
    expect(() => new Element(new MockExecutor(), {})).toThrowError(/is not a Detox matcher/);
  });
});

describe('action serialization (v20 fixtures)', () => {
  it('tapAtPoint aliases tap with the point param', async () => {
    const h = harness();
    await h.element(by.id('tappable')).tapAtPoint({ x: 5, y: 10 });
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'tap',
      params: [{ x: 5, y: 10 }],
      predicate: { type: 'id', value: 'tappable', isRegex: false },
    });
  });

  it('longPress bare, with duration, and with point + duration', async () => {
    const h = harness();
    await h.element(by.id('e')).longPress();
    expect(h.executor.calls[0].invocation).toEqual({
      type: 'action',
      action: 'longPress',
      params: [null, null],
      predicate: { type: 'id', value: 'e', isRegex: false },
    });
    await h.element(by.id('e')).longPress(1500);
    expect(h.executor.calls[1].invocation.params).toEqual([null, 1500]);
    await h.element(by.id('e')).longPress({ x: 1, y: 2 }, 700);
    expect(h.executor.calls[2].invocation.params).toEqual([{ x: 1, y: 2 }, 700]);
  });

  it('longPressAndDrag serializes NaN target positions as null with defaults', async () => {
    const h = harness();
    await h
      .element(by.id('elementToDrag'))
      .longPressAndDrag(1000, 0.5, 0.5, h.element(by.id('targetElement')));
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'longPress',
      params: [1000, 0.5, 0.5, null, null, 'fast', 1000],
      predicate: { type: 'id', value: 'elementToDrag', isRegex: false },
      targetElement: {
        predicate: { type: 'id', value: 'targetElement', isRegex: false },
      },
    });
  });

  it('swipe fills the v20 defaults (offset 0.75, NaN → null)', async () => {
    const h = harness();
    await h.element(by.id('ScrollView100')).swipe('up', 'fast', undefined, undefined, 0.5);
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'swipe',
      params: ['up', 'fast', 0.75, null, 0.5],
      predicate: { type: 'id', value: 'ScrollView100', isRegex: false },
    });
  });

  it('setDatePickerDate trims milliseconds for ISO8601 only', async () => {
    const h = harness();
    await h.element(by.id('datePicker')).setDatePickerDate('2019-01-01T00:00:00.000Z', 'ISO8601');
    expect(h.executor.calls[0].invocation.params).toEqual(['2019-01-01T00:00:00Z', 'ISO8601']);
    await h
      .element(by.id('datePicker'))
      .setDatePickerDate('2019-01-01T00:00:00.000Z', 'YYYY-MM-DDTHH:mm:sss.fT');
    expect(h.executor.calls[1].invocation.params).toEqual([
      '2019-01-01T00:00:00.000Z',
      'YYYY-MM-DDTHH:mm:sss.fT',
    ]);
  });

  it('performAccessibilityAction serializes as accessibilityAction', async () => {
    const h = harness();
    await h.element(by.text('tapMe')).performAccessibilityAction('activate');
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'accessibilityAction',
      predicate: { type: 'text', value: 'tapMe', isRegex: false },
      params: ['activate'],
    });
  });

  it('the simple actions serialize with their v20 names and params', async () => {
    const h = harness();
    const el = h.element(by.id('e'));
    await el.multiTap(3);
    await el.tapBackspaceKey();
    await el.tapReturnKey();
    await el.typeText('abc');
    await el.replaceText('def');
    await el.clearText();
    await el.scroll(100);
    await el.scrollTo('bottom');
    await el.setColumnToValue(1, 'August');
    await el.pinch(2);
    await el.pinchWithAngle('outward');
    await el.adjustSliderToPosition(0.75);
    const got = h.executor.calls.map((call) => {
      const { action, params } = call.invocation as unknown as SentAction;
      return [action, params];
    });
    expect(got).toEqual([
      ['multiTap', [3]],
      ['tapBackspaceKey', undefined],
      ['tapReturnKey', undefined],
      ['typeText', ['abc']],
      ['replaceText', ['def']],
      ['clearText', undefined],
      ['scroll', [100, 'down', null, null]],
      ['scrollTo', ['bottom', null, null]],
      ['setColumnToValue', [1, 'August']],
      ['pinch', [2, 'fast', 0]],
      ['pinchWithAngle', ['outward', 'slow', 0]],
      ['adjustSliderToPosition', [0.75]],
    ]);
  });

  it('getAttributes resolves with the executor result verbatim (v20: invokeResult params)', async () => {
    const h = harness();
    h.executor.result = { elements: [{ identifier: 'x' }] };
    const attributes = await h.element(by.id('e')).getAttributes();
    expect(attributes).toEqual({ elements: [{ identifier: 'x' }] });
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'getAttributes',
      predicate: { type: 'id', value: 'e', isRegex: false },
    });
  });

  it('takeScreenshot is a typed refusal (artifacts lane)', async () => {
    const h = harness();
    await expect(h.element(by.id('e')).takeScreenshot('shot')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    });
    expect(h.executor.calls).toHaveLength(0);
  });

  it('action argument validation speaks v20, typed 2011', () => {
    const h = harness();
    const el = h.element(by.id('e'));
    const cases: Array<[() => unknown, RegExp]> = [
      [() => el.atIndex('x' as never), /atIndex argument must be a number/],
      [() => el.tap({ x: 'a' } as never), /point\.x should be a number/],
      [() => el.tap({ x: 1, y: 'b' } as never), /point\.y should be a number/],
      [() => el.tap(5 as never), /point should be a object/],
      [() => el.longPress('nope' as never), /longPress accepts either a duration/],
      [() => el.longPress(500, 900), /longPress accepts either a duration/],
      [() => el.longPress({ x: 1, y: 2 }, 'x' as never), /longPress accepts either a duration/],
      [() => el.multiTap('x' as never), /times should be a number/],
      [() => el.multiTap(0), /times should be greater than 0/],
      [() => el.typeText(5 as never), /text should be a string/],
      [() => el.replaceText(5 as never), /text should be a string/],
      [() => el.performAccessibilityAction(5 as never), /actionName should be a string/],
      [() => el.scroll('x' as never), /amount of pixels should be a number/],
      [() => el.scroll(1, 'diagonal'), /direction should be one of/],
      [() => el.scroll(1, 'down', 'x' as never), /startPositionX should be a number/],
      [() => el.scroll(1, 'down', 0, 'y' as never), /startPositionY should be a number/],
      [() => el.scrollTo('middle'), /edge should be one of/],
      [() => el.scrollTo('top', 'x' as never), /startPositionX should be a number/],
      [() => el.scrollTo('top', 0, 'y' as never), /startPositionY should be a number/],
      [() => el.swipe('diagonal'), /direction should be one of/],
      [() => el.swipe('up', 'warp'), /speed should be one of/],
      [() => el.swipe('up', 'fast', 7), /normalizedSwipeOffset should be a number \[0\.0, 1\.0\]/],
      [() => el.setColumnToValue('x' as never, 'v'), /column should be a number/],
      [() => el.setColumnToValue(1, 5 as never), /value should be a string/],
      [() => el.setDatePickerDate(5 as never, 'ISO8601'), /dateString should be a string/],
      [() => el.setDatePickerDate('2019', 5 as never), /dateFormat should be a string/],
      [() => el.pinch(-1), /pinch scale must be a finite number/],
      [() => el.pinch(1, 'warp'), /pinch speed is either/],
      [() => el.pinch(1, 'fast', NaN), /pinch angle must be a finite number/],
      [() => el.pinchWithAngle('sideways'), /pinchWithAngle direction is either/],
      [() => el.pinchWithAngle('inward', 'warp'), /pinchWithAngle speed is either/],
      [() => el.pinchWithAngle('inward', 'slow', 'x' as never), /pinchWithAngle angle must be a number/],
      [() => el.adjustSliderToPosition(2), /position should be a number \[0\.0, 1\.0\]/],
      [
        () => el.longPressAndDrag('x' as never, 0, 0, h.element(by.id('t'))),
        /duration should be a number/,
      ],
      [() => el.longPressAndDrag(1, 0, 0, {} as never), /is not a Detox element/],
      [
        () => el.longPressAndDrag(1, 0, 0, h.element(by.id('t')), NaN, NaN, 'fast', 'x' as never),
        /duration should be a number/,
      ],
      [
        () => el.longPressAndDrag(1, 7, 0, h.element(by.id('t'))),
        /normalizedPositionX should be a number \[0\.0, 1\.0\]/,
      ],
    ];
    for (const [run, message] of cases) {
      expect(run).toThrowError(message);
      expect(run).toThrowError(
        expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
      );
    }
    expect(h.executor.calls).toHaveLength(0);
  });

  /**
   * @issue DTX-3021
   * `tap` accepts its options bag as the sole argument (`tap({signal})`) as
   * well as after a point. An object with an own `signal` and no coordinates
   * is options, not a point; a point that also carries `signal` (the union
   * type admits it) is split — the signal rides as options, stripped from
   * the wire invocation.
   */
  it('a trailing options bag reaches the executor and never the wire params', async () => {
    const h = harness();
    const signal = new AbortController().signal;
    const el = h.element(by.id('e'));
    await el.tap({ signal });
    await el.tap({ x: 1, y: 2 }, { signal });
    await el.typeText('abc', { signal });
    await el.swipe('up', 'slow', 0.5, 0.1, 0.2, { signal });
    for (const call of h.executor.calls) {
      expect(call.options).toEqual({ signal });
      expect(JSON.stringify(call.invocation)).not.toContain('signal');
    }
    expect(h.executor.calls[0].invocation).not.toHaveProperty('params');
    expect(h.executor.calls[1].invocation.params).toEqual([{ x: 1, y: 2 }]);
  });
});

describe('expectation serialization (v20 fixtures)', () => {
  it('toBeVisible, bare and with percent', async () => {
    const h = harness();
    await h.expectEl(h.element(by.text('Tap Working!!!'))).toBeVisible();
    expect(h.executor.calls[0].invocation).toEqual({
      type: 'expectation',
      predicate: { type: 'text', value: 'Tap Working!!!', isRegex: false },
      expectation: 'toBeVisible',
    });
    await h.expectEl(h.element(by.id('foo'))).toBeVisible(25);
    expect(h.executor.calls[1].invocation).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'foo', isRegex: false },
      expectation: 'toBeVisible',
      params: [25],
    });
  });

  it('toBeNotVisible rides the not modifier', async () => {
    const h = harness();
    await h.expectEl(h.element(by.text('Tap Working!!!'))).toBeNotVisible();
    expect(h.sent()).toEqual({
      type: 'expectation',
      predicate: { type: 'text', value: 'Tap Working!!!', isRegex: false },
      modifiers: ['not'],
      expectation: 'toBeVisible',
    });
  });

  it('the .not getter mutates the expectation, v20-style', async () => {
    const h = harness();
    await h.expectEl(h.element(by.id('e'))).not.toExist();
    expect(h.sent()).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'e', isRegex: false },
      modifiers: ['not'],
      expectation: 'toExist',
    });
  });

  it('focus and existence pairs', async () => {
    const h = harness();
    const target = (): Expect => h.expectEl(h.element(by.text('Tap Working!!!')));
    await target().toBeFocused();
    await target().toBeNotFocused();
    await target().toExist();
    await target().toNotExist();
    const got = h.executor.calls.map((call) => {
      const { expectation, modifiers } = call.invocation as unknown as SentExpectation;
      return [expectation, modifiers];
    });
    expect(got).toEqual([
      ['toBeFocused', undefined],
      ['toBeFocused', ['not']],
      ['toExist', undefined],
      ['toExist', ['not']],
    ]);
  });

  it('toHaveText, plain and RegExp', async () => {
    const h = harness();
    await h.expectEl(h.element(by.id('UniqueId204'))).toHaveText('I contain some text');
    expect(h.executor.calls[0].invocation).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'UniqueId204', isRegex: false },
      expectation: 'toHaveText',
      params: ['I contain some text'],
    });
    await h.expectEl(h.element(by.id('UniqueId204'))).toHaveText(/I contain .* text/i);
    expect(h.executor.calls[1].invocation).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'UniqueId204', isRegex: false },
      expectation: 'toHaveText',
      params: ['/I contain .* text/i', true],
    });
  });

  it('toHaveId on an indexed element', async () => {
    const h = harness();
    await h.expectEl(h.element(by.text('Product')).atIndex(2)).toHaveId('ProductId002');
    expect(h.sent()).toEqual({
      type: 'expectation',
      atIndex: 2,
      predicate: { type: 'text', value: 'Product', isRegex: false },
      expectation: 'toHaveId',
      params: ['ProductId002'],
    });
  });

  it('slider position and toggle value', async () => {
    const h = harness();
    await h.expectEl(h.element(by.id('slider'))).toHaveSliderPosition(0.5, 1);
    expect(h.executor.calls[0].invocation).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'slider', isRegex: false },
      expectation: 'toHaveSliderPosition',
      params: [0.5, 1],
    });
    await h.expectEl(h.element(by.id('switch'))).toHaveToggleValue(true);
    expect(h.executor.calls[1].invocation).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'switch', isRegex: false },
      expectation: 'toHaveToggleValue',
      params: [1],
    });
    await h.expectEl(h.element(by.id('switch'))).toHaveToggleValue(false);
    expect(h.executor.calls[2].invocation.params).toEqual([0]);
  });

  it('the negated aliases all ride the not modifier', async () => {
    const h = harness();
    const target = (): Expect => h.expectEl(h.element(by.id('e')));
    await target().toNotHaveText('a');
    await target().toHaveLabel('l');
    await target().toNotHaveLabel('l');
    await target().toHaveId('i');
    await target().toNotHaveId('i');
    await target().toHaveValue('v');
    await target().toNotHaveValue('v');
    const got = h.executor.calls.map((call) => {
      const { expectation, modifiers } = call.invocation as unknown as SentExpectation;
      return [expectation, modifiers];
    });
    expect(got).toEqual([
      ['toHaveText', ['not']],
      ['toHaveLabel', undefined],
      ['toHaveLabel', ['not']],
      ['toHaveId', undefined],
      ['toHaveId', ['not']],
      ['toHaveValue', undefined],
      ['toHaveValue', ['not']],
    ]);
  });

  it('toBeVisible percent validation, plain and negated (v20 fixture)', () => {
    const h = harness();
    const stub = (): Expect => h.expectEl(h.element(by.label('test')));
    const expectedError = /must be an integer between 1 and 100/;
    expect(() => stub().toBeVisible(0)).toThrowError(expectedError);
    expect(() => stub().not.toBeVisible(0)).toThrowError(expectedError);
    expect(() => stub().toBeVisible(101)).toThrowError(expectedError);
    expect(() => stub().not.toBeVisible(101)).toThrowError(expectedError);
    expect(() => stub().toBeVisible(1.5)).toThrowError(expectedError);
  });

  it('toBeVisible accepts its options bag first, like tap (accept-file idiom)', async () => {
    const h = harness();
    const signal = new AbortController().signal;
    await h.expectEl(h.element(by.id('e'))).toBeVisible({ signal });
    expect(h.sent()).not.toHaveProperty('params');
    expect(h.executor.calls[0].options).toEqual({ signal });
  });
});

describe('the waitFor chain (v20 terminals)', () => {
  /**
   * @issue DTX-3023
   * NaN/Infinity would serialize as `timeout: null` on the frozen frame — a
   * native crash class, refused typed here instead of let through like v20.
   */
  it('withTimeout validates v20-style, then sends {…expectation, timeout}', async () => {
    const h = harness();
    const chain = h.waitFor(h.element(by.id('e'))).toBeVisible();
    expect(() => chain.withTimeout('x' as never)).toThrowError(/should be a number/);
    expect(() => chain.withTimeout(-1)).toThrowError(/timeout must be larger than 0/);
    expect(() => chain.withTimeout(Number.NaN)).toThrowError(/finite/);
    expect(() => chain.withTimeout(Number.POSITIVE_INFINITY)).toThrowError(/finite/);
    await chain.withTimeout(2000);
    // v20 `createWaitForWithTimeoutInvocation` (`expectTwo.js:757-762`).
    expect(h.sent()).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'e', isRegex: false },
      expectation: 'toBeVisible',
      timeout: 2000,
    });
  });

  /**
   * @issue DTX-3026
   * v20 spreads the raw `Expect` instance here — undefined behavior on the
   * app side; a chain with no expectation refuses typed instead.
   */
  it('a chain with no expectation refuses typed instead of shipping garbage', () => {
    const h = harness();
    expect(() => h.waitFor(h.element(by.id('e'))).withTimeout(100)).toThrowError(
      /needs an expectation/,
    );
    expect(h.executor.calls).toHaveLength(0);
  });

  it('withTimeout and the action terminals thread CallOptions to the wire', async () => {
    const h = harness();
    const signal = new AbortController().signal;
    await h.waitFor(h.element(by.id('e'))).toBeVisible().withTimeout(50, { signal });
    expect(h.executor.calls[0].options).toEqual({ signal });
    await h
      .waitFor(h.element(by.id('e')))
      .toBeVisible()
      .whileElement(by.id('s'))
      .scroll(10, 'down', undefined, undefined, { signal });
    expect(h.executor.calls[1].options).toEqual({ signal });
    // @issue DTX-3024
    // Element.tap's sole-options shape holds on the chain too: `tap({signal})`
    // is options, never a point on the wire.
    await h
      .waitFor(h.element(by.id('e')))
      .toBeVisible()
      .whileElement(by.id('s'))
      .tap({ signal });
    expect(h.executor.calls[2].options).toEqual({ signal });
    expect(h.executor.calls[2].invocation).not.toHaveProperty('params');
  });

  it('every expectation link validates and chains — one expectation per chain', async () => {
    const h = harness();
    const links: Array<(chain: WaitFor) => WaitFor> = [
      (chain) => chain.toBeVisible(),
      (chain) => chain.toBeNotVisible(),
      (chain) => chain.toExist(),
      (chain) => chain.toNotExist(),
      (chain) => chain.toHaveText('t'),
      (chain) => chain.toNotHaveText('t'),
      (chain) => chain.toHaveLabel('l'),
      (chain) => chain.toNotHaveLabel('l'),
      (chain) => chain.toHaveId('i'),
      (chain) => chain.toNotHaveId('i'),
      (chain) => chain.toHaveValue('v'),
      (chain) => chain.toNotHaveValue('v'),
      (chain) => chain.toBeFocused(),
      (chain) => chain.toBeNotFocused(),
    ];
    for (const link of links) {
      const chain = h.waitFor(h.element(by.id('e')));
      expect(link(chain)).toBe(chain);
    }
    expect(() => h.waitFor(h.element(by.label('test'))).toBeVisible(0)).toThrowError(
      /must be an integer between 1 and 100/,
    );
  });

  /**
   * @issue DTX-3022
   * A second expectation on one chain (or a `.not` after one) refuses typed
   * instead of accumulating stale modifiers into a wrong wire frame — v20
   * crashed with a bare TypeError instead. Re-recording would otherwise send
   * `toBeVisible` with the stale `not` from the first expectation.
   *
   * @issue DTX-3025
   * The modifiers array is snapshotted when an invocation is recorded: the
   * already-sent frame must not mutate when a later `.not` mutates the chain.
   */
  it('a second expectation on one chain refuses typed — v20 crashed, silence would invert', async () => {
    const h = harness();
    const chain = h.waitFor(h.element(by.id('e')));
    expect(chain.not).toBe(chain); // pre-recording `.not` chains fine
    expect(chain.toExist()).toBe(chain);
    await chain.withTimeout(100);
    expect(h.sent()).toMatchObject({ expectation: 'toExist', modifiers: ['not'], timeout: 100 });
    expect(() => chain.toBeVisible()).toThrowError(/already recorded an expectation/);
    expect(() => chain.not).toThrowError(/already recorded an expectation/);
    expect(h.executor.calls[0].invocation.modifiers).toEqual(['not']);
  });

  /**
   * @issue DTX-3027
   * An action before `whileElement` refuses typed — v20 crashes with a bare
   * TypeError here instead.
   */
  it('whileElement validates its matcher, gates the actions, and sends {…action, while}', async () => {
    const h = harness();
    const chain = h.waitFor(h.element(by.text('Text5'))).toBeNotVisible();
    expect(() => chain.whileElement({} as never)).toThrowError(/is not a Detox matcher/);
    expect(() => chain.tap()).toThrowError(/whileElement/);

    chain.whileElement(by.id('ScrollView630'));
    await chain.scroll(50, 'down');
    // v20 `createWaitForWithActionInvocation` (`expectTwo.js:748-755`) — the
    // 05.waitfor fixture's own shape.
    expect(h.sent()).toEqual({
      type: 'action',
      action: 'scroll',
      params: [50, 'down', null, null],
      predicate: { type: 'id', value: 'ScrollView630', isRegex: false },
      while: {
        type: 'expectation',
        predicate: { type: 'text', value: 'Text5', isRegex: false },
        modifiers: ['not'],
        expectation: 'toBeVisible',
      },
    });
  });

  it('every whileElement action validates v20-style, then sends its while-invocation', async () => {
    const h = harness();
    const chain = h
      .waitFor(h.element(by.id('e')))
      .toBeVisible()
      .whileElement(by.id('scroller'));
    await chain.tap({ x: 1, y: 2 });
    await chain.tapAtPoint({ x: 1, y: 2 });
    await chain.longPress(700);
    await chain.multiTap(2);
    await chain.tapBackspaceKey();
    await chain.tapReturnKey();
    await chain.typeText('abc');
    await chain.replaceText('def');
    await chain.clearText();
    await chain.scroll(50);
    await chain.scrollTo('bottom');
    await chain.swipe('up');
    await chain.setColumnToValue(1, 'v');
    await chain.setDatePickerDate('2019-01-01T00:00:00Z', 'ISO8601');
    await chain.performAccessibilityAction('activate');
    await chain.pinch(2);
    await chain.pinchWithAngle('outward');
    expect(h.executor.calls).toHaveLength(17);
    for (const call of h.executor.calls) {
      expect(call.invocation.type).toBe('action');
      expect(call.invocation.predicate).toEqual({ type: 'id', value: 'scroller', isRegex: false });
      expect(call.invocation.while).toEqual({
        type: 'expectation',
        predicate: { type: 'id', value: 'e', isRegex: false },
        expectation: 'toBeVisible',
      });
    }
    // Validation still bites before anything is sent, with the v20 message.
    expect(() => chain.multiTap('x' as never)).toThrowError(/times should be a number/);
    expect(h.executor.calls).toHaveLength(17);
  });

  it('the internal recorders compose v20 envelopes without touching the wire', async () => {
    const executor = new MockExecutor();
    const internalElement = new InternalElement(executor, by.id('ScrollView630'));
    await internalElement.scroll(50, 'down');
    expect(internalElement.lastInvocation).toEqual({
      type: 'action',
      action: 'scroll',
      params: [50, 'down', null, null],
      predicate: { type: 'id', value: 'ScrollView630', isRegex: false },
    });

    const internalExpect = new InternalExpect(executor, internalElement);
    await internalExpect.not.toBeVisible();
    expect(internalExpect.lastInvocation).toEqual({
      type: 'expectation',
      predicate: { type: 'id', value: 'ScrollView630', isRegex: false },
      modifiers: ['not'],
      expectation: 'toBeVisible',
    });
    expect(executor.calls).toHaveLength(0);
  });
});

describe('the excluded XCUITest/web lane refuses typed', () => {
  it('every by.web and by.system method throws DETOX_NOT_IMPLEMENTED', () => {
    for (const lane of [by.web, by.system]) {
      const methods = Object.values(lane);
      expect(methods.length).toBeGreaterThan(0);
      for (const method of methods) {
        expect(() => method('x')).toThrowError(
          expect.objectContaining({ code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED }),
        );
      }
    }
  });
});
