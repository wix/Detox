const _ = require('lodash');

describe('expectTwo', () => {
  beforeEach(() => {
    const IosExpect = require('./expectTwo');
    e = new IosExpect(new MockExecutor());
  });

  it(`element(by.text('tapMe')).tap()`, () => {
    const testCall = e.element(e.by.text('tapMe')).tap();
    const jsonOutput = {
      type: 'action',
      action: 'tap',
      predicate: {
        type: 'text',
        value: 'tapMe'
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('uniqueId').and(by.text('some text'))).tap()`, () => {
    const testCall = e.element(e.by.id('uniqueId').and(e.by.text('some text'))).tap();
    const jsonOutput = {
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
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').withAncestor(by.id('parent'))).tap()`, () => {
    const testCall = e.element(e.by.id('child').withAncestor(e.by.id('parent'))).tap();
    const jsonOutput = {
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
            value: {
              type: 'id',
              value: 'parent'
            }
          }
        ]
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').withAncestor(by.id('parent'))).atIndex(1).tap()`, () => {
    const testCall = e.element(e.by.id('child').withAncestor(e.by.id('parent'))).atIndex(1).tap();
    const jsonOutput = {
      type: 'action',
      action: 'tap',
      atIndex: 1,
      predicate: {
        type: 'and',
        predicates: [
          {
            type: 'id',
            value: 'child'
          },
          {
            type: 'ancestor',
            value: {
              type: 'id',
              value: 'parent'
            }
          }
        ]
      }
    };
    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').withAncestor(by.id('parent').and(by.text('text')))).tap()`, () => {
    const testCall = e.element(e.by.id('child').withAncestor(e.by.id('parent').and(e.by.text('text')))).tap();
    const jsonOutput = {
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
            value: {
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
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`element(by.id('child').withAncestor(by.id('parent').and(by.text('text')))).tap()`, () => {
    const testCall = e.element(e.by.id('child').and(e.by.text('text').and(e.by.value('value')))).tap();
    const jsonOutput = {
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
    };

    expect(testCall).deepEquals(jsonOutput);
  })
  ;

  it(`element(by.id('tappable')).tapAtPoint({x:5, y:10})`, () => {
    const testCall = e.element(e.by.id('tappable')).tapAtPoint({ x: 5, y: 10 });
    const jsonOutput = {
      type: 'action',
      action: 'tapAtPoint',
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
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.text('Tap Working!!!'))).toBeVisible()`, () => {
    const testCall = e.expect(e.element(e.by.text('Tap Working!!!'))).toBeVisible();
    const jsonOutput = {
      type: 'expectation',
      predicate: {
        type: 'text',
        value: 'Tap Working!!!'
      },
      expectation: 'toBeVisible'
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`expect(element(by.id('UniqueId204'))).toHaveText('I contain some text')`, () => {
    const testCall = e.expect(e.element(e.by.id('UniqueId204'))).toHaveText('I contain some text');
    const jsonOutput = {
      type: 'expectation',
      predicate: {
        type: 'id',
        value: 'UniqueId204'
      },
      expectation: 'toHaveText',
      params: ['I contain some text']
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down')`, () => {
    const testCall = e.waitFor(e.element(e.by.text('Text5'))).toBeVisible().whileElement(e.by.id('ScrollView630')).scroll(50, 'down');
    const jsonOutput = {
      type: 'action',
      action: 'scroll',
      params: [50, 'down'],
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
        expectation: 'toBeVisible'
      }
    };

    expect(testCall).deepEquals(jsonOutput);
  });

  it(`waitFor(element(by.id('uniqueId'))).toHaveValue('Some value').withTimeout(2000)`, () => {
    const testCall = e.waitFor(e.element(e.by.id('uniqueId'))).toHaveValue('Some value').withTimeout(2000);
    const jsonOutput = {
      type: 'waitFor',
      timeout: 2000,
      predicate: {
        type: 'id',
        value: 'uniqueId'
      },
      expectation: 'toHaveValue',
      params: ['Some value']
    };

    expect(testCall).deepEquals(jsonOutput);
  });
})
;

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
    return invocation;
  };
}
