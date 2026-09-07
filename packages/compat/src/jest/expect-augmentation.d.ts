// ── Detox element matchers on jest's own `expect` (spec 010; types ship
// with the code). Appended verbatim to dist/index.d.ts by
// scripts/build-types.js, so `import 'detox'` (or any
// import from it) is what turns the augmentation on — the same door the
// runtime registration walks through `expect.extend`.
//
// Both spellings on purpose: the `expect` module augmentation covers
// `@jest/globals` consumers (jest's own types re-export Matchers from
// there); the global `jest` namespace covers `@types/jest` consumers. The
// matchers return `Promise<void>` regardless of `R` — every Detox
// expectation is async and awaited.
declare module 'expect' {
  interface Matchers<R> {
    toBeVisible(percent?: number): Promise<void>;
    toExist(): Promise<void>;
    toBeFocused(): Promise<void>;
    toHaveText(text: string | RegExp): Promise<void>;
    toHaveLabel(label: string): Promise<void>;
    toHaveId(id: string): Promise<void>;
    toHaveValue(value: string): Promise<void>;
    toHaveSliderPosition(position: number, tolerance?: number): Promise<void>;
    toHaveToggleValue(value: boolean): Promise<void>;
    toBeNotVisible(): Promise<void>;
    toBeNotFocused(): Promise<void>;
    toNotExist(): Promise<void>;
    toNotHaveText(text: string | RegExp): Promise<void>;
    toNotHaveLabel(label: string): Promise<void>;
    toNotHaveId(id: string): Promise<void>;
    toNotHaveValue(value: string): Promise<void>;
  }
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVisible(percent?: number): Promise<void>;
      toExist(): Promise<void>;
      toBeFocused(): Promise<void>;
      toHaveText(text: string | RegExp): Promise<void>;
      toHaveLabel(label: string): Promise<void>;
      toHaveId(id: string): Promise<void>;
      toHaveValue(value: string): Promise<void>;
      toHaveSliderPosition(position: number, tolerance?: number): Promise<void>;
      toHaveToggleValue(value: boolean): Promise<void>;
      toBeNotVisible(): Promise<void>;
      toBeNotFocused(): Promise<void>;
      toNotExist(): Promise<void>;
      toNotHaveText(text: string | RegExp): Promise<void>;
      toNotHaveLabel(label: string): Promise<void>;
      toNotHaveId(id: string): Promise<void>;
      toNotHaveValue(value: string): Promise<void>;
    }
  }
}
