const _ = require('lodash');

describe('expectTwo', () => {
  beforeEach(() => {
    const IosExpect = require('./expectTwo');
    e = new IosExpect({
      invocationManager: new MockExecutor(),
    });
  });

  it(`element(by.text('tapMe')).tap()`, () => {
    const testCall = e.element(e.by.text('tapMe')).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'text',
          value: 'tapMe'
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.text('tapMe')).tap({x:1, y:2})`, () => {
    const testCall = e.element(e.by.text('tapMe')).tap({ x: 1, y: 2 });
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
          value: 'tapMe'
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('uniqueId').and(by.text('some text'))).tap()`, () => {
    const testCall = e.element(e.by.id('uniqueId').and(e.by.text('some text'))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'uniqueId'
            },
            {
              type: 'text',
              value: 'some text'
            }
          ]
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').withAncestor(by.id('parent'))).tap()`, () => {
    const testCall = e.element(e.by.id('child').withAncestor(e.by.id('parent'))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'child'
            },
            {
              type: 'ancestor',
              predicate: {
                type: 'id',
                value: 'parent'
              }
            }
          ]
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').withAncestor(by.id('parent'))).atIndex(0).tap()`, () => {
    const testCall = e.element(e.by.id('child').withAncestor(e.by.id('parent'))).atIndex(0).tap();
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
              value: 'child'
            },
            {
              type: 'ancestor',
              predicate: {
                type: 'id',
                value: 'parent'
              }
            }
          ]
        }
      }
    };
    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').withAncestor(by.id('parent').and(by.text('text')))).tap()`, () => {
    const testCall = e.element(e.by.id('child').withAncestor(e.by.id('parent').and(e.by.text('text')))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'child'
            },
            {
              type: 'ancestor',
              predicate: {
                type: 'and',
                predicates: [
                  {
                    type: 'id',
                    value: 'parent'
                  },
                  {
                    type: 'text',
                    value: 'text'
                  }
                ]
              }
            }
          ]
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').and(by.text('text').and(by.value('value')))).tap()`, () => {
    const testCall = e.element(e.by.id('child').and(e.by.text('text').and(e.by.value('value')))).tap();
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'tap',
        predicate: {
          type: 'and',
          predicates: [
            {
              type: 'id',
              value: 'child'
            },
            {
              type: 'text',
              value: 'text'
            },
            {
              type: 'value',
              value: 'value'
            }
          ]
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('tappable')).tapAtPoint({x:5, y:10})`, () => {
    const testCall = e.element(e.by.id('tappable')).tapAtPoint({ x: 5, y: 10 });
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
          value: 'tappable'
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.text('Tap Working!!!'))).toBeVisible()`, () => {
    const testCall = e.expect(e.element(e.by.text('Tap Working!!!'))).toBeVisible();
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'text',
          value: 'Tap Working!!!'
        },
        expectation: 'toBeVisible'
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.text('Tap Working!!!'))).toBeNotVisible()`, () => {
    const testCall = e.expect(e.element(e.by.text('Tap Working!!!'))).toBeNotVisible();
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'text',
          value: 'Tap Working!!!'
        },
        modifiers: ['not'],
        expectation: 'toBeVisible'
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.id('UniqueId204'))).toHaveText('I contain some text')`, () => {
    const testCall = e.expect(e.element(e.by.id('UniqueId204'))).toHaveText('I contain some text');
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'id',
          value: 'UniqueId204'
        },
        expectation: 'toHaveText',
        params: ['I contain some text']
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.text('Product')).atIndex(2)).toHaveId('ProductId002')`, () => {
    const testCall = e.expect(e.element(e.by.text('Product')).atIndex(2)).toHaveId('ProductId002');
    const jsonOutput = {
      'invocation': {
        'type': 'expectation',
        'atIndex': 2,
        'predicate': {
          'type': 'text',
          'value': 'Product'
        },
        'expectation': 'toHaveId',
        'params': ['ProductId002']
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.id('slider'))).toHaveSliderPosition(position, tolerance)`, () => {
    const testCall = e.expect(e.element(e.by.id('slider'))).toHaveSliderPosition(0.5, 1);
    const jsonOutput = {
      'invocation': {
        'type': 'expectation',
        'predicate': {
          'type': 'id',
          'value': 'slider'
        },
        'expectation': 'toHaveSliderPosition',
        'params': [0.5, 1]
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.id('switch'))).toHaveToggleValue(value)`, () => {
    const testCall = e.expect(e.element(e.by.id('switch'))).toHaveToggleValue(true);
    const jsonOutput = {
      'invocation': {
        'type': 'expectation',
        'predicate': {
          'type': 'id',
          'value': 'switch'
        },
        'expectation': 'toHaveValue',
        'params': ['1']
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('ScrollView100')).swipe('up', 'fast', undefined, undefined, 0.5)`, () => {
    const testCall = e.element(e.by.id('ScrollView100')).swipe('up', 'fast', undefined, undefined, 0.5);
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'swipe',
        params: ['up', 'fast', 0.75, null, 0.5],
        predicate: {
          type: 'id',
          value: 'ScrollView100'
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`waitFor(element(by.text('Text5'))).toBeNotVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down')`, () => {
    const testCall = e.waitFor(e.element(e.by.text('Text5'))).toBeNotVisible().whileElement(e.by.id('ScrollView630')).scroll(50, 'down');
    const jsonOutput = {
      invocation: {
        type: 'action',
        action: 'scroll',
        params: [50, 'down', null, null],
        predicate: {
          type: 'id',
          value: 'ScrollView630'
        },
        while: {
          type: 'expectation',
          predicate: {
            type: 'text',
            value: 'Text5'
          },
          modifiers: ['not'],
          expectation: 'toBeVisible'
        }
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(` waitFor(element(by.id('createdAndVisibleText'))).toExist().withTimeout(20000)`, async () => {
    const testCall = await e.waitFor(e.element(e.by.id('createdAndVisibleText'))).toExist().withTimeout(2000);
    const jsonOutput = {
      invocation:
        {
          type: 'expectation',
          predicate: {
            type: 'id',
            value: 'createdAndVisibleText'
          },
          expectation: 'toExist',
          timeout: 2000
        }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`waitFor(element(by.id('uniqueId'))).not.toHaveValue('Some value').withTimeout(2000)`, () => {
    const testCall = e.waitFor(e.element(e.by.id('uniqueId'))).not.toBeVisible().withTimeout(2000);
    const jsonOutput = {
      invocation: {
        type: 'expectation',
        predicate: {
          type: 'id',
          value: 'uniqueId'
        },
        modifiers: ['not'],
        expectation: 'toBeVisible',
        timeout: 2000
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element().takeScreenshot`, () => {
    try {
      e.element(e.by.id('uniqueId')).takeScreenshot();
      fail();
    } catch (e) {
      expect(e.message).toContain('not supported on iOS');
    }
  });
});

expect.extend({
  deepEquals(a, b) {
    const pass = _.isEqual(a, b);
    return {
      pass,
      message: () => `${JSON.stringify(a)} does not match 
       ${JSON.stringify(b)}`
    };
  }
});


class MockExecutor {
  execute(invocation) {
    return { invocation };
  };
}
