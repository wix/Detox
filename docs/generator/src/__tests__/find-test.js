const { parse } = require('@babel/parser');
const glob = require('glob').sync;
const readFileSync = require('fs').readFileSync;
const { findDocumentedFiles, findDocumentationComments, findClassAfterComment } = require('../find');

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

describe('findDocumentationComments', () => {
  it('does not find comments without a documentation header', () => {
    const comments = findDocumentationComments(
      parse(
        `/**
         * @Documented
         * id: my-id
         **/ 
        const foo = 42;

        /**
         * TODO: write docs
         **/
        const bar = 23;

        // Documented: Should not be seen
        const baz = 42;

        /**
         * @Documented
         * id: my-other-id
         **/
        const yay = "awesome";
         `
      )
    );

    expect(comments.length).toBe(2);
  });
});

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

    expect(findDocumentedFiles(__dirname, './**/*.js')).toEqual([['/expect.js', parse(pathToContent['/expect.js'])]]);
    expect(glob).toHaveBeenCalled();
    expect(readFileSync).toHaveBeenCalledTimes(2);
  });
});

describe('findClassAfterComment', () => {
  it('throws an error if called with falsy values', () => {
    const ast = parse(`
    /**
     * @Documented
     * id: expected
     **/
    const foo = 42;
    `);
    const comment = ast.comments[0];

    expect(() => findClassAfterComment(null, comment)).toThrowErrorMatchingInlineSnapshot(`"ast needs to be set"`);
    expect(() => findClassAfterComment(ast, null)).toThrowErrorMatchingInlineSnapshot(`"ast needs to be set"`);
  });

  it('throws an error if there is no class after the comment', () => {
    const ast = parse(`
    /**
     * @Documented
     * id: expected
     **/
    const foo = 42;
    `);
    const comment = ast.comments[0];

    expect(() => findClassAfterComment(ast, comment)).toThrowErrorMatchingInlineSnapshot(
      `"Could not find a class after documentation comment"`
    );
  });

  it('finds the first class after the comment', () => {
    const ast = parse(`
    /**
     * @Documented
     * id: expected
     **/
    class foo {}
    class bar {}
    `);
    const comment = ast.comments[0];

    expect(findClassAfterComment(ast, comment).id.name).toBe('foo');
  });

  it('does not find a class before the comment', () => {
    const ast = parse(`
    class foo {}
    /**
     * @Documented
     * id: expected
     **/
    `);
    const comment = ast.comments[0];

    expect(() => findClassAfterComment(ast, comment)).toThrowErrorMatchingInlineSnapshot(
      `"Could not find a class after documentation comment"`
    );
  });
});
