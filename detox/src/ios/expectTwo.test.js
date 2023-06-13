// @ts-nocheck
const jestExpect = require('expect').default; // eslint-disable-line
const _ = require('lodash');

describe('expectTwo', () => {
  let e;
  let emitter;
  let invocationManager;
  let fs;

  beforeEach(() => {
    jest.mock('../utils/logger');
    jest.mock('fs-extra');
    jest.mock('tempfile');

    fs = require('fs-extra');
    const IosExpect = require('./expectTwo');
    const AsyncEmitter = jest.genMockFromModule('../utils/AsyncEmitter');
    invocationManager = new MockExecutor();
    emitter = new AsyncEmitter();

    e = new IosExpect({
      invocationManager,
      emitter,
    });
  });

  it(`should produce correct JSON for tap action`, async () => {
    const testCall = await e.element(e.by.text('tapMe')).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'text',
          value: 'tapMe',
          isRegex: false,
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for RegExp matcher`, async () => {
    const testCall = await e.element(e.by.text(/tapMe/g)).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'text',
          value: '/tapMe/g',
          isRegex: true,
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for tap action with parameters`, async () => {
    const testCall = await e.element(e.by.text('tapMe')).tap({ x: 1, y: 2 });
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        params: [
          {
            x: 1,
            y: 2
          }
        ],
        predicate: {
          type: 'text',
          value: 'tapMe',
          isRegex: false,
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for element with id and text matchers`, async () => {
    const testCall = await e.element(e.by.id('uniqueId').and(e.by.text('some text'))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'uniqueId',
              isRegex: false,
            },
            {
              type: 'text',
              value: 'some text',
              isRegex: false,
            }
          ]
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for element with ancestor matcher`, async () => {
    const testCall = await e.element(e.by.id('child').withAncestor(e.by.id('parent'))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'child',
              isRegex: false,
            },
            {
              type: 'ancestor',
              predicate: {
                type: 'id',
                value: 'parent',
                isRegex: false,
              }
            }
          ]
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it.each([
    ['withAncestor'],
    ['withDescendant'],
    ['and'],
  ])(`should produce immutable objects when combining matchers: %s`, async (combineMethodName) => {
    const base = e.by.id('abc');
    const modifier = e.by.id('def');

    expect(base[combineMethodName](modifier)).not.toBe(base);
    expect(base).toEqual(e.by.id('abc'));
    expect(modifier).toEqual(e.by.id('def'));
  });

  it(`should produce correct JSON for element with ancestor and index matchers`, async () => {
    const testCall = await e.element(e.by.id('child').withAncestor(e.by.id('parent'))).atIndex(0).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        atIndex: 0,
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'child',
              isRegex: false,
            },
            {
              type: 'ancestor',
              predicate: {
                type: 'id',
                value: 'parent',
                isRegex: false,
              }
            }
          ]
        }
      }
    };
    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for element with ancestor and test matchers`, async () => {
    const testCall = await e.element(e.by.id('child').withAncestor(e.by.id('parent').and(e.by.text('text')))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'child',
              isRegex: false,
            },
            {
              type: 'ancestor',
              predicate: {
                type: 'and',
                predicates: [
                  {
                    type: 'id',
                    value: 'parent',
                    isRegex: false,
                  },
                  {
                    type: 'text',
                    value: 'text',
                    isRegex: false,
                  }
                ]
              }
            }
          ]
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for element with id, text and value matchers`, async () => {
    const testCall = await e.element(e.by.id('child').and(e.by.text('text').and(e.by.value('value')))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'child',
              isRegex: false,
            },
            {
              type: 'text',
              value: 'text',
              isRegex: false,
            },
            {
              type: 'value',
              value: 'value',
            }
          ]
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for tap at point action`, async () => {
    const testCall = await e.element(e.by.id('tappable')).tapAtPoint({ x: 5, y: 10 });
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        params: [
          {
            x: 5,
            y: 10
          }
        ],
        predicate: {
          type: 'id',
          value: 'tappable',
          isRegex: false,
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for long-press and drag action`, async () => {
    const testCall = await e.element(e.by.id('elementToDrag')).longPressAndDrag(1000, 0.5, 0.5, e.element(e.by.id('targetElement')));
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'longPress',
        params: [1000, 0.5, 0.5, null, null, 'fast', 1000],
        predicate: {
          type: 'id',
          value: 'elementToDrag',
          isRegex: false,
        },
        targetElement: {
          predicate: {
            type: 'id',
            value: 'targetElement',
            isRegex: false,
          }
        }
      }
    };
    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for visibility expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.text('Tap Working!!!'))).toBeVisible();
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'text',
          value: 'Tap Working!!!',
          isRegex: false,
        },
        expectation: 'toBeVisible'
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for toBeVisible expectation with parameter`, async () => {
    const testCall = await e.expect(e.element(e.by.id('foo'))).toBeVisible(25);
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'id',
          value: 'foo',
          isRegex: false,
        },
        expectation: 'toBeVisible',
        params: [25]
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for toBeNotVisible expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.text('Tap Working!!!'))).toBeNotVisible();
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'text',
          value: 'Tap Working!!!',
          isRegex: false,
        },
        modifiers: ['not'],
        expectation: 'toBeVisible'
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for toBeFocused expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.text('Tap Working!!!'))).toBeFocused();
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'text',
          value: 'Tap Working!!!',
          isRegex: false,
        },
        expectation: 'toBeFocused'
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for notToBeFocused expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.text('Tap Working!!!'))).toBeNotFocused();
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'text',
          value: 'Tap Working!!!',
          isRegex: false,
        },
        modifiers: ['not'],
        expectation: 'toBeFocused'
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for toHaveText expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.id('UniqueId204'))).toHaveText('I contain some text');
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'id',
          value: 'UniqueId204',
          isRegex: false,
        },
        expectation: 'toHaveText',
        params: ['I contain some text']
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for toHaveId expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.text('Product')).atIndex(2)).toHaveId('ProductId002');
    const jsonOutput = {
      'invocation': {
        'type': 'expectation',
        'atIndex': 2,
        'predicate': {
          'type': 'text',
          'value': 'Product',
          'isRegex': false,
        },
        'expectation': 'toHaveId',
        'params': ['ProductId002']
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for toHaveSliderPosition expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.id('slider'))).toHaveSliderPosition(0.5, 1);
    const jsonOutput = {
      'invocation': {
        'type': 'expectation',
        'predicate': {
          'type': 'id',
          'value': 'slider',
          'isRegex': false,
        },
        'expectation': 'toHaveSliderPosition',
        'params': [0.5, 1]
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for toHaveToggleValue expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.id('switch'))).toHaveToggleValue(true);
    const jsonOutput = {
      'invocation': {
        'type': 'expectation',
        'predicate': {
          'type': 'id',
          'value': 'switch',
          'isRegex': false,
        },
        'expectation': 'toHaveValue',
        'params': ['1']
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should produce correct JSON for swipe action`, async () => {
    const testCall = await e.element(e.by.id('ScrollView100')).swipe('up', 'fast', undefined, undefined, 0.5);
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'swipe',
        params: ['up', 'fast', 0.75, null, 0.5],
        predicate: {
          type: 'id',
          value: 'ScrollView100',
          isRegex: false,
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should trim milliseconds for setDatePickerDate with ISO8601 format`, async () => {
    const testCall = await e.element(e.by.id('datePicker')).setDatePickerDate('2019-01-01T00:00:00.000Z', 'ISO8601');
    const jsonOutput = {
      'invocation': {
        'type': 'action',
        'action': 'setDatePickerDate',
        'params': ['2019-01-01T00:00:00Z', 'ISO8601'],
        'predicate': { 'type': 'id', 'value': 'datePicker', 'isRegex': false }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should not trim milliseconds for setDatePickerDate with a custom format`, async () => {
    const testCall = await e.element(e.by.id('datePicker')).setDatePickerDate('2019-01-01T00:00:00.000Z', 'YYYY-MM-DDTHH:mm:sss.fT');
    const jsonOutput = {
      'invocation': {
        'type': 'action',
        'action': 'setDatePickerDate',
        'params': ['2019-01-01T00:00:00.000Z', 'YYYY-MM-DDTHH:mm:sss.fT'],
        'predicate': { 'type': 'id', 'value': 'datePicker', 'isRegex': false }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  describe(`waitFor`, () => {
    it(`should produce correct JSON for toBeNotVisible expectation`, async () => {
      const testCall = await e.waitFor(e.element(e.by.text('Text5'))).toBeNotVisible().whileElement(e.by.id('ScrollView630')).scroll(50, 'down');
      const jsonOutput = {
        invocation: {
          type: 'action',
          action: 'scroll',
          params: [50, 'down', null, null],
          predicate: {
            type: 'id',
            value: 'ScrollView630',
            isRegex: false,
          },
          while: {
            type: 'expectation',
            predicate: {
              type: 'text',
              value: 'Text5',
              isRegex: false,
            },
            modifiers: ['not'],
            expectation: 'toBeVisible'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should produce correct JSON for toExist expectation`, async () => {
      const testCall = await e.waitFor(e.element(e.by.id('createdAndVisibleText'))).toExist().withTimeout(2000);
      const jsonOutput = {
        invocation:
          {
            type: 'expectation',
            predicate: {
              type: 'id',
              value: 'createdAndVisibleText',
              isRegex: false,
            },
            expectation: 'toExist',
            timeout: 2000
          }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should produce correct JSON for text and index matchers`, async () => {
      const testCall = await e.waitFor(e.element(e.by.text('Item')).atIndex(1)).toExist().withTimeout(2000);
      const jsonOutput = {
        invocation:
          {
            type: 'expectation',
            atIndex: 1,
            predicate: {
              type: 'text',
              value: 'Item',
              isRegex: false,
            },
            expectation: 'toExist',
            timeout: 2000
          }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should produce correct JSON for toBeNotVisible expectation`, async () => {
      const testCall = await e.waitFor(e.element(e.by.id('uniqueId'))).not.toBeVisible().withTimeout(2000);
      const jsonOutput = {
        invocation: {
          type: 'expectation',
          predicate: {
            type: 'id',
            value: 'uniqueId',
            isRegex: false,
          },
          modifiers: ['not'],
          expectation: 'toBeVisible',
          timeout: 2000
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });
  });

  describe.each([
    [''],
    ["'imageName'", 'imageName']
  ])(`e.element(e.by.id('uniqueId')).takeScreenshot(%s)`, (_comment, imageName) => {
    let deviceTmpFilePath;
    let tmpFileName;
    let tmpFilePath;
    let result;

    beforeEach(async () => {
      tmpFileName = '2317894723984';
      tmpFilePath = `/tmp/somewhere/${tmpFileName}.png`;
      deviceTmpFilePath = '/tmp/path/to/device/file.png';

      invocationManager.execute.mockResolvedValueOnce({
        screenshotPath: deviceTmpFilePath,
      });

      require('tempfile').mockReturnValue(tmpFilePath);
      result = await e.element(e.by.id('uniqueId')).takeScreenshot(imageName);
    });

    it(`should send a JSON request via invocation manager`, async () => {
      expect(invocationManager.execute).toHaveBeenCalledWith({
        type: 'action',
        action: 'takeScreenshot',
        ...(imageName && { params: [imageName] }),
        predicate: {
          isRegex: false,
          type: 'id',
          value: 'uniqueId'
        }
      });
    });

    it(`should move the temporary file for the device to a local temp location`, async () => {
      expect(fs.move).toHaveBeenCalledWith(deviceTmpFilePath, tmpFilePath);
    });

    it(`should emit (for the artifact manager plugin) an event about an external artifact created`, async () => {
      expect(emitter.emit).toHaveBeenCalledWith('createExternalArtifact', {
        pluginId: 'screenshot',
        artifactName: imageName || tmpFileName,
        artifactPath: tmpFilePath,
      });
    });

    it(`should return a temporary path to the screenshot`, async () => {
      expect(result).toBe(tmpFilePath);
    });
  });

  it('toBeVisible() should throw with bad args', async () => {
    const stubMatcher = e.element(e.by.label('test'));
    const expectedErrorMsg = 'must be an integer between 1 and 100';

    jestExpect(() => e.expect(stubMatcher).toBeVisible(0)).toThrow(expectedErrorMsg);
    jestExpect(() => e.expect(stubMatcher).not.toBeVisible(0)).toThrow(expectedErrorMsg);
    jestExpect(() => e.expect(stubMatcher).toBeVisible(101)).toThrow(expectedErrorMsg);
    jestExpect(() => e.expect(stubMatcher).not.toBeVisible(101)).toThrow(expectedErrorMsg);

    jestExpect(() => e.waitFor(stubMatcher).toBeVisible(0)).toThrow(expectedErrorMsg);
    jestExpect(() => e.waitFor(stubMatcher).toBeVisible(101)).toThrow(expectedErrorMsg);
  });

  it('by.web should throw', async () => {
    expect(() => e.by.web).toThrowError(/not support/);
  });

  it('web() should throw', async () => {
    expect(() => e.web(e.by.id('someId'))).toThrowError(/not support/);
  });

  it('web.element() should throw', async () => {
    expect(() => e.web.element(e.by.id('someId'))).toThrowError(/not support/);
  });

  it(`element(e.by.text('tapMe')).performAccessibilityAction('activate')`, async () => {
    const testCall = await e.element(e.by.text('tapMe')).performAccessibilityAction('activate');
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'accessibilityAction',
        predicate: {
          type: 'text',
          value: 'tapMe',
          isRegex: false,
        },
        params: [
          'activate'
        ]
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });
});

expect.extend({
  toDeepEqual(a, b) {
    const pass = _.isEqual(a, b);

    return {
      pass,
      actual: a,
      expected: b,
      message: () => `${JSON.stringify(a)} does not match
       ${JSON.stringify(b)}`
    };
  }
});

class MockExecutor {
  constructor() {
    jest.spyOn(this, 'execute');
  }

  execute(invocation) {
    return Promise.resolve({ invocation });
  }
}
