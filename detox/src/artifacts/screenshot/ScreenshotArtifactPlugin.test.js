const _ = require('lodash');
const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');

describe('ScreenshotArtifactPlugin', () => {
  describe('static mergeConfigs(prev, next)', () => {
    const mergeConfigs = ScreenshotArtifactPlugin.mergeConfigs;

    describe('.enabled', () => {
      const enabled = {
        get false() {
          return { enabled: false };
        },
        get true() {
          return { enabled: true };
        },
      };

      it.each([
        [null, 'none',        enabled.false ],
        [null, 'manual',      enabled.true  ],
        [null, 'failing',     enabled.true  ],
        [null, 'all',         enabled.true  ],
        [null, enabled.false, enabled.false ],
        [null, enabled.true,  enabled.true  ],

        [enabled.false, 'none',        enabled.false],
        [enabled.false, 'manual',      enabled.true ],
        [enabled.false, 'failing',     enabled.true ],
        [enabled.false, 'all',         enabled.true ],
        [enabled.false, enabled.false, enabled.false],
        [enabled.false, enabled.true,  enabled.true ],

        [enabled.true, 'none',        enabled.false],
        [enabled.true, 'manual',      enabled.true ],
        [enabled.true, 'failing',     enabled.true ],
        [enabled.true, 'all',         enabled.true ],
        [enabled.true, enabled.false, enabled.false],
        [enabled.true, enabled.true,  enabled.true ],

        [{},            null, enabled.true],
        [enabled.false, null, enabled.false],
        [enabled.true,  null, enabled.true ],
      ])('when merging %j and %j, should contain %j', (prev, next, expected) => {
        expect(mergeConfigs(prev, next)).toEqual(expect.objectContaining(expected));
      });
    });

    describe('.keepOnlyFailedTestsArtifacts', () => {
      const failingOnly = {
        get false() {
          return { keepOnlyFailedTestsArtifacts: false };
        },
        get true() {
          return { keepOnlyFailedTestsArtifacts: true };
        },
      };

      it.each([
        [null, 'none',            {} ],
        [null, 'manual',          {} ],
        [null, 'failing',         failingOnly.true      ],
        [null, 'all',             failingOnly.false     ],
        [null, failingOnly.false, failingOnly.false     ],
        [null, failingOnly.true,  failingOnly.true      ],

        [failingOnly.false, 'none',            failingOnly.false ],
        [failingOnly.false, 'manual',          failingOnly.false ],
        [failingOnly.false, 'failing',         failingOnly.true  ],
        [failingOnly.false, 'all',             failingOnly.false ],
        [failingOnly.false, failingOnly.false, failingOnly.false ],
        [failingOnly.false, failingOnly.true,  failingOnly.true  ],

        [failingOnly.true, 'none',            failingOnly.true  ],
        [failingOnly.true, 'manual',          failingOnly.true  ],
        [failingOnly.true, 'failing',         failingOnly.true  ],
        [failingOnly.true, 'all',             failingOnly.false ],
        [failingOnly.true, failingOnly.false, failingOnly.false ],
        [failingOnly.true, failingOnly.true,  failingOnly.true  ],

        [{},                null, failingOnly.false],
        [failingOnly.false, null, failingOnly.false],
        [failingOnly.true,  null, failingOnly.true ],
      ])('when merging %j and %j, should contain %j', (prev, next, expected) => {
        const merged = mergeConfigs(prev, next);

        if (_.isEmpty(expected)) {
          expect(merged.keepOnlyFailedTestsArtifacts).toBe(undefined);
        } else {
          expect(merged).toEqual(expect.objectContaining(expected));
        }
      });
    });

    describe('.shouldTakeAutomaticSnapshots', () => {
      const auto = {
        get false() {
          return { shouldTakeAutomaticSnapshots: false };
        },
        get true() {
          return { shouldTakeAutomaticSnapshots: true };
        },
        get allFalse() {
          return {
            shouldTakeAutomaticSnapshots: {
              testStart: false,
              testDone: false,
            },
          };
        },
        get allTrue() {
          return {
            shouldTakeAutomaticSnapshots: {
              testStart: true,
              testDone: true,
            },
          };
        },
        get empty() {
          return {
            shouldTakeAutomaticSnapshots: {},
          };
        },
        get testDone() {
          return {
            shouldTakeAutomaticSnapshots: {
              testDone: true,
            },
          };
        },
        get allTestDone() {
          return {
            shouldTakeAutomaticSnapshots: {
              testStart: false,
              testDone: true,
            },
          };
        },
      };

      it.each([
        [null, 'none',        auto.false],
        [null, 'manual',      auto.false],
        [null, 'failing',     auto.true],
        [null, 'all',         auto.true],
        [null, auto.testDone, auto.testDone],

        [{},               null, auto.allFalse],
        [auto.empty,       null, auto.allFalse],
        [auto.false,       null, auto.allFalse],
        [auto.true,        null, auto.allTrue],
        [auto.testDone,    null, auto.allTestDone],
        [auto.allFalse,    null, auto.allFalse],
        [auto.allTrue,     null, auto.allTrue],
        [auto.allTestDone, null, auto.allTestDone],

        [auto.false,    'none',         auto.false],
        [auto.true,     'none',         auto.false],
        [auto.testDone, 'none',         auto.false],
        [auto.false,    'manual',       auto.false],
        [auto.true,     'manual',       auto.false],
        [auto.testDone, 'manual',       auto.false],
        [auto.false,    'failing',      auto.true],
        [auto.true,     'failing',      auto.true],
        [auto.testDone, 'failing',      auto.testDone],
        [auto.false,    'all',          auto.true],
        [auto.true,     'all',          auto.true],
        [auto.testDone, 'all',          auto.testDone],
        [auto.false,    auto.testDone,  auto.testDone],
        [auto.true,     auto.testDone,  auto.testDone],
      ])('when merging %j and %j, should contain %j', (prev, next, expected) => {
        const merged = mergeConfigs(prev, next);

        if (_.isEmpty(expected)) {
          expect(merged.shouldTakeAutomaticSnapshots).toBe(undefined);
        } else {
          expect(merged).toEqual(expect.objectContaining(expected));
        }
      });
    });

    describe('.<unknown property>', () => {
      let propertyName = Math.random().toString(16).slice(2);

      const unknown = {
        get any() {
          return { [propertyName]: {} };
        },
      };

      it.each([
        [null,        unknown.any,  unknown.any],
        [{},          unknown.any,  unknown.any],
        [unknown.any, 'none',       unknown.any],
        [unknown.any, 'manual',     unknown.any],
        [unknown.any, 'failing',    unknown.any],
        [unknown.any, 'all',        unknown.any],
        [unknown.any, null,         unknown.any],
      ])('when merging %j and %j, should contain %j', (prev, next, expected) => {
        const merged = mergeConfigs(prev, next);

        if (_.isEmpty(expected)) {
          expect(merged.shouldTakeAutomaticSnapshots).toBe(undefined);
        } else {
          expect(merged).toEqual(expect.objectContaining(expected));
        }
      });
    });

    it('should consider null and manual equivalent', () => {
      const nullConfig = mergeConfigs({}, null);
      const manualConfig = mergeConfigs(null, 'manual');

      expect(mergeConfigs(manualConfig, null)).toEqual(nullConfig);
    });
  });
});

