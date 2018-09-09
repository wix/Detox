---

id: expect
title: Expectations

---

Detox uses Matchers to find UI elements in your app, Actions to emulate user interaction with those elements and Expectations to verify values on those elements. Expect verifies if a certain value is as expected to be.

## toBeVisible

Expect the view to be at least 75% visible.

- `await expect(element(by.id('UniqueId204'))).toBeVisible();`
