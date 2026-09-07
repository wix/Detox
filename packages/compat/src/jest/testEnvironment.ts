/**
 * `detox/runners/jest/testEnvironment` — the module path a migrant's
 * `e2e/jest.config.js` already names (spec 010's runner contract). Jest's
 * interop takes the default export as the environment class.
 */
import DetoxCircusEnvironment from './environment';

export default DetoxCircusEnvironment;
