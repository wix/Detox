const { parse } = require('@babel/parser');
const { extractDocumentedMethods, extractMetaInformation } = require('../extract');

function firstClass(ast) {
  return ast.program.body.filter((node) => node.type === 'ClassDeclaration')[0];
}

describe('extractMetaInformation', () => {
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
