const {
  findDocumentedFiles,
  extractMetaInformation,
  extractDocumentedMethods,
  combineDocumentations,
  buildDocumentation,
  writeDocumentation
} = require('../');
const glob = require('glob').sync;
const readFileSync = require('fs').readFileSync;
const { parse } = require('@babel/parser');

jest.mock('glob', () => ({
  sync: jest.fn()
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

const pathToContent = {
  '/expect.js': `
/**
 * @Documented
 * id: expect
 * title: Expectations
 * platform: general
 * 
 **/
`,
  '/somethingDifferent.js': `const foo = 42; `
};

describe('findDocumentedFiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('gets all files matching the glob', () => {
    glob.mockReturnValueOnce(['/expect.js']);
    readFileSync.mockImplementation((path) => pathToContent[path]);

    findDocumentedFiles(__dirname, './**/*.js');

    expect(glob).toHaveBeenCalledTimes(1);
    expect(readFileSync).toHaveBeenCalledWith('/expect.js', 'utf-8');
  });

  it('only includes files with a documentation header', () => {
    glob.mockReturnValueOnce(['/expect.js', '/somethingDifferent.js']);
    readFileSync.mockImplementation((path) => pathToContent[path]);

    expect(findDocumentedFiles(__dirname, './**/*.js')).toEqual([['/expect.js', pathToContent['/expect.js']]]);
    expect(glob).toHaveBeenCalled();
    expect(readFileSync).toHaveBeenCalledTimes(2);
  });
});

describe('extractMetaInformation', () => {
  it('finds the first comment with the documented flag', () => {
    expect(
      extractMetaInformation(`
      /**
       * Not documented
       **/

       const foo = 42;
       /**
        * @Documented
        * id: my-id
        **/
       
        const bar = 23;

        /**
         * @Docuemnted
         * id: wrong-id
         **/
      `).id
    ).toBe('my-id');
  });

  it('extracts information provided', () => {
    expect(
      extractMetaInformation(`
          /**
           * @Documented
           * id: expect
           * title: Expect.js
           * platform: android
           **/
        `)
    ).toEqual({
      id: 'expect',
      title: 'Expect.js',
      platform: 'android'
    });
  });

  it('errors on a different platform then android and ios', () => {
    expect(
      extractMetaInformation(`
            /**
             * @Documented
             * id: expect
             * platform: ios
             **/
          `).platform
    ).toBe('ios');

    expect(
      extractMetaInformation(`
              /**
               * @Documented
               * id: expect
               * platform: android
               **/
            `).platform
    ).toBe('android');

    expect(() =>
      extractMetaInformation(`
              /**
               * @Documented
               * id: expect
               * platform: blackberr<
               **/
            `)
    ).toThrow();
  });
});

function firstClass(ast) {
  return ast.program.body.filter((node) => node.type === 'ClassDeclaration')[0];
}

describe('extractDocumentedMethods', () => {
  it('ignores undocumented methods', () => {
    const classString = `class Foo {
          undocumentedMethod(args) {
              // TODO: document this
            }
        }`;
    const ast = parse(classString);
    expect(extractDocumentedMethods(firstClass(ast), ast).length).toBe(0);
  });

  it('ignores non-block comments', () => {
    const classString = `class Foo {
            // This method does something
            undocumentedMethod(args) {
            }
        }`;
    const ast = parse(classString);
    expect(extractDocumentedMethods(firstClass(ast), ast).length).toBe(0);
  });

  it('ignores block comments within the method', () => {
    const classString = `class Foo {
          innerDocumentedMethod(args) {
              /**
               * This is a great variable, let me describe it
               * 
               * It's awesome
               */
              const bestVariable = 42;
            }
          }`;
    const ast = parse(classString);
    expect(extractDocumentedMethods(firstClass(ast), ast).length).toBe(0);
  });

  it('ignores block comments within the method when there is a next method', () => {
    const classString = `class Foo {
          innerDocumentedMethod(args) {
              /**
               * This is a great variable, let me describe it
               * 
               * It's awesome
               */
              const bestVariable = 42;
            }

            otherUnrelatedMethod(args){}
          }`;
    const ast = parse(classString);
    expect(extractDocumentedMethods(firstClass(ast), ast).length).toBe(0);
  });

  it('extracts information form a well formed block comment', () => {
    const classString = `class Foo {
      /**
       * This method is used to showcase documentation
       * @example fooInstance.documentedMethod("do stuff")
       * @param {Array} args A lot of arguments
       * @returns {Boolean} mostly true, sometimes false
       */
      documentedMethod(args) {
          const bestVariable = 42;
        }
    }`;
    const ast = parse(classString);

    const docs = extractDocumentedMethods(firstClass(ast), ast);
    expect(docs.length).toBe(1);
    expect(docs[0]).toEqual({
      name: 'documentedMethod',
      description: 'This method is used to showcase documentation',
      args: [{ type: 'Array', name: 'args', description: 'A lot of arguments' }],
      examples: ['fooInstance.documentedMethod("do stuff")'],
      returns: { type: 'Boolean', description: 'mostly true, sometimes false' }
    });
  });

  it('knows how to handle constructors', () => {
    const classString = `class Foo {
            /**
             * This a constructor
             */
            constructor(args) {
                const bestVariable = 42;
              }
          }`;
    const ast = parse(classString);

    const docs = extractDocumentedMethods(firstClass(ast), ast);
    expect(docs.length).toBe(1);
    expect(docs[0]).toEqual({
      isConstructor: true,
      description: 'This a constructor',
      args: [],
      examples: []
    });
  });
});

describe('combineDocumentations', () => {
  const documentationAiOS = [
    './ios/a.js',
    {
      meta: {
        id: 'expect',
        title: 'What to expect?',
        platform: 'ios'
      },
      methods: [{ name: 'toBeVisible', args: [] }]
    }
  ];

  const documentationAAndroid = [
    './android/a.js',
    {
      meta: {
        id: 'expect',
        platform: 'android'
      },
      methods: [{ name: 'toBeVisible', args: [] }, { name: 'toBeAlmostVisible', args: [] }]
    }
  ];

  const documentationBiOS = [
    './ios/b.js',
    {
      meta: {
        id: 'actions',
        platform: 'ios'
      },
      methods: [{ name: 'click', args: [] }]
    }
  ];

  const documentationCiOS = [
    './ios/c.js',
    {
      meta: {
        id: 'actions',
        platform: 'ios'
      },
      methods: [{ name: 'clickTwice', args: [] }]
    }
  ];

  it('leaves unmatched ids alone', () => {
    expect(combineDocumentations([documentationAiOS, documentationBiOS])).toEqual(
      expect.arrayContaining([
        {
          paths: ['./ios/a.js'],
          platform: ['ios'],
          id: 'expect',
          title: 'What to expect?',
          methods: [{ platform: ['ios'], name: 'toBeVisible', args: [] }]
        },
        { paths: ['./ios/b.js'], platform: ['ios'], id: 'actions', methods: [{ platform: ['ios'], name: 'click', args: [] }] }
      ])
    );
  });

  it('enhances ids of the same platform', () => {
    expect(combineDocumentations([documentationAiOS, documentationBiOS, documentationCiOS])).toEqual(
      expect.arrayContaining([
        {
          paths: ['./ios/a.js'],
          platform: ['ios'],
          id: 'expect',
          title: 'What to expect?',
          methods: [{ platform: ['ios'], name: 'toBeVisible', args: [] }]
        },
        {
          paths: ['./ios/b.js', './ios/c.js'],
          platform: ['ios'],
          id: 'actions',
          methods: [{ platform: ['ios'], name: 'click', args: [] }, { platform: ['ios'], name: 'clickTwice', args: [] }]
        }
      ])
    );
  });

  it('adds second platform for documentations with same id', () => {
    expect(combineDocumentations([documentationAiOS, documentationBiOS, documentationAAndroid])).toEqual(
      expect.arrayContaining([
        {
          paths: ['./ios/a.js', './android/a.js'],
          platform: ['ios', 'android'],
          id: 'expect',
          title: 'What to expect?',
          methods: [
            { platform: ['ios', 'android'], name: 'toBeVisible', args: [] },
            {
              platform: ['android'],
              name: 'toBeAlmostVisible',
              args: []
            }
          ]
        },
        { paths: ['./ios/b.js'], platform: ['ios'], id: 'actions', methods: [{ name: 'click', args: [], platform: ['ios'] }] }
      ])
    );
  });

  // TODO: implement convenience functionality to make it more safe for devs to use
  // it('throws an error if documentation with the same platform has title on both')
  // it('throws an error if documentation with the same platform has descriptions on both')
});

describe('buildDocumentation', () => {
  it('uses the the id as markdown id', () => {
    expect(
      buildDocumentation({
        platform: ['ios', 'android'],
        id: 'expect',
        title: 'What to expect?',
        methods: [{ platform: ['ios', 'android'], name: 'toBeVisible', args: [] }]
      })
    ).toEqual(expect.stringContaining('id: expect'));
  });

  it('uses the the title as markdown title', () => {
    expect(
      buildDocumentation({
        platform: ['ios', 'android'],
        id: 'expect',
        title: 'What to expect?',
        methods: [{ platform: ['ios', 'android'], name: 'toBeVisible', args: [] }]
      })
    ).toEqual(expect.stringContaining('title: What to expect?'));
  });

  it('omits the title if documentation misses it', () => {
    expect(
      buildDocumentation({
        platform: ['ios', 'android'],
        id: 'expect',
        methods: [{ platform: ['ios', 'android'], name: 'toBeVisible', args: [] }]
      })
    ).not.toEqual(expect.stringContaining('title:'));
  });

  it('uses the constructor description as first text part', () => {
    expect(
      buildDocumentation({
        platform: ['ios', 'android'],
        id: 'expect',
        methods: [
          {
            platform: ['ios', 'android'],
            isConstructor: true,
            description: 'Detox uses **Matchers** to find UI elements.'
          }
        ]
      })
    ).toEqual(expect.stringContaining('Detox uses **Matchers** to find UI elements.'));
  });

  describe('methods', () => {
    it('renders every method', () => {
      const doc = buildDocumentation({
        platform: ['ios', 'android'],
        id: 'expect',
        methods: [
          {
            platform: ['ios', 'android'],
            name: 'toBeVisible',
            args: [],
            description: 'checks if it is visible'
          },
          {
            platform: ['ios', 'android'],
            name: 'toBeRed',
            args: [],
            description: 'checks if it is red'
          }
        ]
      });

      expect(doc).toEqual(expect.stringContaining('## toBeVisible'));
      expect(doc).toEqual(expect.stringContaining('## toBeRed'));
    });

    it('renders the description', () => {
      const doc = buildDocumentation({
        platform: ['ios', 'android'],
        id: 'expect',
        methods: [
          {
            platform: ['ios', 'android'],
            name: 'clickAtPosition',
            args: [],
            description: 'clicks at position'
          }
        ]
      });

      expect(doc).toEqual(expect.stringContaining('clicks at position'));
    });

    it('renders the examples', () => {
      const doc = buildDocumentation({
        platform: ['ios', 'android'],
        id: 'element',
        methods: [
          {
            platform: ['ios', 'android'],
            name: 'clickAtPosition',
            args: [],
            description: 'clicks at position',
            examples: ['element(by.id("foo")).clickAtPosition()', 'element(by.id("foo")).clickAtPosition(true, false)']
          }
        ]
      });

      expect(doc).toEqual(expect.stringContaining('- `element(by.id("foo")).clickAtPosition()`'));
      expect(doc).toEqual(expect.stringContaining('- `element(by.id("foo")).clickAtPosition(true, false)`'));
    });
  });
});
