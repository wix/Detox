// @ts-nocheck
const jestExpect = require('expect').default; // eslint-disable-line
const _ = require('lodash');

describe('expectTwo', () => {
  let e;
  let emitter;
  let invocationManager;
  let xcuitestRunner;
  let fs;

  beforeEach(() => {
    jest.mock('../utils/logger');
    jest.mock('fs-extra');
    jest.mock('tempfile');

    fs = require('fs-extra');
    const IosExpect = require('./expectTwo');
    const AsyncEmitter = jest.genMockFromModule('../utils/AsyncEmitter');
    invocationManager = new MockExecutor();
    xcuitestRunner = new MockExecutor();
    emitter = new AsyncEmitter();

    e = new IosExpect({
      invocationManager,
      xcuitestRunner,
      emitter,
    });
  });

  it(`should parse correct JSON for tap action`, async () => {
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

  it(`should parse correct JSON for RegExp text matcher`, async () => {
    const testCall = await e.element(e.by.text(/tapMe/)).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'text',
          value: '/tapMe/',
          isRegex: true,
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should parse correct JSON for tap action with parameters`, async () => {
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

  it(`should parse correct JSON for element with id and text matchers`, async () => {
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

  it(`should parse correct JSON for element with RegExp id and text matchers`, async () => {
    const testCall = await e.element(e.by.id(/uniqueId/).and(e.by.text(/some text/))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: '/uniqueId/',
              isRegex: true,
            },
            {
              type: 'text',
              value: '/some text/',
              isRegex: true,
            }
          ]
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should parse correct JSON for element with ancestor matcher`, async () => {
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

  it(`should parse correct JSON for element with regex ancestor matcher`, async () => {
    const testCall = await e.element(e.by.id('child').withAncestor(e.by.id(/parent/))).tap();
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
                value: '/parent/',
                isRegex: true,
              }
            }
          ]
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should parse correct JSON for element with regex label`, async () => {
    const testCall = await e.element(e.by.label(/tapMe/)).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'label',
          value: '/tapMe/',
          isRegex: true,
        }
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it.each([
    ['withAncestor'],
    ['withDescendant'],
    ['and'],
  ])(`should parse immutable objects when combining matchers: %s`, async (combineMethodName) => {
    const base = e.by.id('abc');
    const modifier = e.by.id('def');

    expect(base[combineMethodName](modifier)).not.toBe(base);
    expect(base).toEqual(e.by.id('abc'));
    expect(modifier).toEqual(e.by.id('def'));
  });

  it(`should parse correct JSON for element with ancestor and index matchers`, async () => {
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

  it(`should parse correct JSON for element with ancestor and test matchers`, async () => {
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

  it(`should parse correct JSON for element with id, text and value matchers`, async () => {
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

  it(`should parse correct JSON for tap at point action`, async () => {
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

  it(`should parse correct JSON for long-press and drag action`, async () => {
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

  it(`should parse correct JSON for visibility expectation`, async () => {
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

  it(`should parse correct JSON for toBeVisible expectation with parameter`, async () => {
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

  it(`should parse correct JSON for toBeNotVisible expectation`, async () => {
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

  it(`should parse correct JSON for toBeFocused expectation`, async () => {
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

  it(`should parse correct JSON for notToBeFocused expectation`, async () => {
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

  it(`should parse correct JSON for toHaveText expectation`, async () => {
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

  it(`should parse correct JSON for toHaveId expectation`, async () => {
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

  it(`should parse correct JSON for toHaveSliderPosition expectation`, async () => {
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

  it(`should parse correct JSON for toHaveToggleValue expectation`, async () => {
    const testCall = await e.expect(e.element(e.by.id('switch'))).toHaveToggleValue(true);
    const jsonOutput = {
      'invocation': {
        'type': 'expectation',
        'predicate': {
          'type': 'id',
          'value': 'switch',
          'isRegex': false,
        },
        'expectation': 'toHaveToggleValue',
        'params': [1]
      }
    };

    expect(testCall).toDeepEqual(jsonOutput);
  });

  it(`should parse correct JSON for swipe action`, async () => {
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
    it(`should parse correct JSON for toBeNotVisible expectation`, async () => {
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

    it(`should parse correct JSON for toExist expectation`, async () => {
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

    it(`should parse correct JSON for text and index matchers`, async () => {
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

    it(`should parse correct JSON for toBeNotVisible expectation`, async () => {
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

  describe('system', () => {
    it(`should parse system.element(by.system.label('tapMe')).atIndex(1).tap()`, async () => {
      const testCall = await e.system.element(e.by.system.label('tapMe')).atIndex(1).tap();
      const jsonOutput = {
        invocation: {
          type: 'systemAction',
          systemAction: 'tap',
          systemPredicate: {
            type: 'label',
            value: 'tapMe'
          },
          systemAtIndex: 1
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse expect(system.element(by.system.type('button'))).not.toExist()`, async () => {
      const testCall = await e.expect(e.system.element(e.by.system.type('button'))).not.toExist();
      const jsonOutput = {
        invocation: {
          type: 'systemExpectation',
          systemExpectation: 'toExist',
          systemModifiers: ['not'],
          systemPredicate: {
            type: 'type',
            value: 'button'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });
  });

  describe('web views', () => {
    it(`should parse expect(web(by.id('webViewId').element(web(by.label('tapMe')))).toExist()`, async () => {
      const testCall = await e.expect(e.web(e.by.id('webViewId')).atIndex(1).element(e.by.web.label('tapMe')).atIndex(2)).toExist();

      const jsonOutput = {
        invocation: {
          type: 'webExpectation',
          webExpectation: 'toExist',
          predicate: {
            type: 'id',
            value: 'webViewId',
            isRegex: false
          },
          atIndex: 1,
          webPredicate: {
            type: 'label',
            value: 'tapMe'
          },
          webAtIndex: 2
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web(by.id('webViewId').element(web(by.label('tapMe')))).not.toHaveText('Hey')`, async () => {
      const testCall = await e.expect(e.web(e.by.id('webViewId')).element(e.by.web.label('tapMe'))).not.toHaveText('Hey');

      const jsonOutput = {
        invocation: {
          type: 'webExpectation',
          webExpectation: 'toHaveText',
          params: ['Hey'],
          predicate: {
            type: 'id',
            value: 'webViewId',
            isRegex: false
          },
          webModifiers: ['not'],
          webPredicate: {
            type: 'label',
            value: 'tapMe'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it('should throw when passing non-web-element matcher to element()', async () => {
      const expectedErrorMsg = 'is not a Detox web-view matcher';

      jestExpect(() => e.expect(
          e.web(e.by.id('webViewId')).element(e.by.label('tapMe'))
      ).toExist()).toThrow(expectedErrorMsg);
    });

    it('should throw when not passing matcher to web()', async () => {
      const expectedErrorMsg = 'invalid is not a Detox matcher';
      jestExpect(() => e.web('invalid').element(e.by.label('tapMe')).toExist()).toThrow(expectedErrorMsg);
    });

    it('should throw when passing at-index to a non-matcher', async () => {
      const expectedErrorMsg = 'cannot apply atIndex to a non-matcher';
      jestExpect(() => e.web('invalid').atIndex(1).element(e.by.web.label('tapMe')).toExist()).toThrow(expectedErrorMsg);
    });

    it(`should parse web(by.id('webViewId')).atIndex(2).element(web.by.label('tapMe')).atIndex(1).clearText()`, async () => {
      const testCall =
          await e.web(e.by.id('webViewId')).atIndex(2).element(e.by.web.label('tapMe')).atIndex(1).clearText();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'clearText',
          webAtIndex: 1,
          predicate: {
            type: 'id',
            value: 'webViewId',
            isRegex: false
          },
          atIndex: 2,
          webPredicate: {
            type: 'label',
            value: 'tapMe'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it('should raise on invalid at-index', async () => {
      const expectedErrorMsg = 'index should be an integer, got -1 (number)';
      jestExpect(() => e.web(e.by.id('webViewId')).atIndex(-1).element(e.by.web.label('tapMe')).atIndex(1).clearText()).toThrow(expectedErrorMsg);
    });

    it('should raise on invalid web-matcher at-index', async () => {
      const expectedErrorMsg = 'index should be an integer, got -1 (number)';
      jestExpect(() => e.web(e.by.id('webViewId')).element(e.by.web.label('tapMe')).atIndex(-1).clearText()).toThrow(expectedErrorMsg);
    });

    it(`should parse web.element(by.web.label('tapMe')).tap()`, async () => {
      const testCall = await e.web.element(e.by.web.label('tapMe')).tap();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'tap',
          webPredicate: {
            type: 'label',
            value: 'tapMe'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.id('someValue')).typeText('text')`, async () => {
      const testCall = await e.web.element(e.by.web.id('someValue')).atIndex(3).typeText('text');

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'typeText',
          webAtIndex: 3,
          params: ['text'],
          webPredicate: {
            type: 'id',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.id('someValue')).typeText('text', true)`, async () => {
      const testCall = await e.web.element(e.by.web.id('someValue')).atIndex(3).typeText('text', true);

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'typeText',
          webAtIndex: 3,
          params: ['text'],
          webPredicate: {
            type: 'id',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.className('someValue')).replaceText('text')`, async () => {
      const testCall = await e.web.element(e.by.web.className('someValue')).replaceText('text');

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'replaceText',
          params: ['text'],
          webPredicate: {
            type: 'class',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.cssSelector('someValue')).focus()`, async () => {
      const testCall = await e.web.element(e.by.web.cssSelector('someValue')).focus();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'focus',
          webPredicate: {
            type: 'css',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.xpath('someValue')).getCurrentUrl()`, async () => {
      const testCall = await e.web.element(e.by.web.xpath('someValue')).getCurrentUrl();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'getCurrentUrl',
          webPredicate: {
            type: 'xpath',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.name('someValue')).getText()`, async () => {
      const testCall = await e.web.element(e.by.web.name('someValue')).getText();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'getText',
          webPredicate: {
            type: 'name',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.href('someValue')).getTitle()`, async () => {
      const testCall = await e.web.element(e.by.web.href('someValue')).getTitle();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'getTitle',
          webPredicate: {
            type: 'href',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.hrefContains('someValue')).moveCursorToEnd()`, async () => {
      const testCall = await e.web.element(e.by.web.hrefContains('someValue')).moveCursorToEnd();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'moveCursorToEnd',
          webPredicate: {
            type: 'hrefContains',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.tag('someValue')).runScript('script')`, async () => {
      const testCall = await e.web.element(e.by.web.tag('someValue')).runScript('script');

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'runScript',
          params: ['script'],
          webPredicate: {
            type: 'tag',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.value('someValue')).runScript(() => {}, ['arg'])`, async () => {
      const testCall = await e.web.element(e.by.web.value('someValue')).runScript(() => {}, ['arg']);

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'runScriptWithArgs',
          params: ['() => {}', ['arg']],
          webPredicate: {
            type: 'value',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.value('someValue')).runScript('() => {}', ['arg'])`, async () => {
      const testCall = await e.web.element(e.by.web.value('someValue')).runScript('() => {}', ['arg']);

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'runScriptWithArgs',
          params: ['() => {}', ['arg']],
          webPredicate: {
            type: 'value',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.name('someValue')).selectAllText()`, async () => {
      const testCall = await e.web.element(e.by.web.name('someValue')).selectAllText();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'selectAllText',
          webPredicate: {
            type: 'name',
            value: 'someValue'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it(`should parse web.element(by.web.id('webViewId')).scrollToView()`, async () => {
      const testCall = await e.web.element(e.by.web.id('webViewId')).scrollToView();

      const jsonOutput = {
        invocation: {
          type: 'webAction',
          webAction: 'scrollToView',
          webPredicate: {
            type: 'id',
            value: 'webViewId'
          }
        }
      };

      expect(testCall).toDeepEqual(jsonOutput);
    });

    it('should throw when invocation returns an error', async () => {
      invocationManager.execute.mockResolvedValueOnce({
        error: 'some error'
      });

      await expect(() => e.web.element(e.by.web.id('uniqueId')).getTitle()).rejects.toThrow('some error');
    });

    it('should extract return value (`return`) when exists on getter', async () => {
      invocationManager.execute.mockResolvedValueOnce({
        result: 'some result'
      });

      const result = await e.web.element(e.by.web.id('uniqueId')).getTitle();
      expect(result).toBe('some result');
    });

    it('should extract return value (`title`) when exists on getter', async () => {
      invocationManager.execute.mockResolvedValueOnce({
        title: 'some result'
      });

      const result = await e.web.element(e.by.web.id('uniqueId')).getTitle();
      expect(result).toBe('some result');
    });

    it('should return undefined value when no return value exists and undefined allowed', async () => {
      invocationManager.execute.mockResolvedValueOnce({});

      const result = await e.web.element(e.by.web.id('uniqueId')).runScript(() => {});
      expect(result).toBe(undefined);
    });
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
