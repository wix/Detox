export interface NativeMatcher {
  /**
   * Find an element satisfying all the matchers
   * @example await element(by.text('Product').and(by.id('product_name'));
   */
  and(by: NativeMatcher): NativeMatcher;

  /**
   * Find an element by a matcher with a parent matcher
   * @example await element(by.id('Grandson883').withAncestor(by.id('Son883')));
   */
  withAncestor(parentBy: NativeMatcher): NativeMatcher;

  /**
   * Find an element by a matcher with a child matcher
   * @example await element(by.id('Son883').withDescendant(by.id('Grandson883')));
   */
  withDescendant(childBy: NativeMatcher): NativeMatcher;
}

