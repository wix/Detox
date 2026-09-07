/**
 * `detox/runners/jest` — v20's index shape, kept so a migrant's
 * `const { DetoxCircusEnvironment } = require('detox/runners/jest')`
 * destructuring still reads (spec 010's runner contract). The default export
 * is the environment class itself.
 */
import DetoxCircusEnvironment from './environment';
import globalSetup from './globalSetup';
import globalTeardown from './globalTeardown';

export { DetoxCircusEnvironment, globalSetup, globalTeardown };
export default DetoxCircusEnvironment;
