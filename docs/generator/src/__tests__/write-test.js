const { buildDocumentation, writeDocumentation } = require('../write');
const writeFileSync = require('fs').writeFileSync;

jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}));

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
describe('writeDocumentation', () => {
  it('calls the path mapping', () => {
    const mockMapToDest = jest.fn().mockReturnValue('./foo.js');

    writeDocumentation(
      [
        {
          platform: ['ios', 'android'],
          id: 'element',
          paths: ['./foo/bar.js'],
          methods: [
            {
              platform: ['ios', 'android'],
              name: 'clickAtPosition',
              args: [],
              description: 'clicks at position',
              examples: ['element(by.id("foo")).clickAtPosition()', 'element(by.id("foo")).clickAtPosition(true, false)']
            }
          ]
        }
      ],
      mockMapToDest
    );

    expect(mockMapToDest).toHaveBeenCalledWith(['./foo/bar.js']);
  });

  it('writes to the mapped path', () => {
    writeDocumentation(
      [
        {
          platform: ['ios', 'android'],
          id: 'element',
          paths: ['./foo/bar.js'],
          methods: [
            {
              platform: ['ios', 'android'],
              name: 'clickAtPosition',
              args: [],
              description: 'clicks at position',
              examples: ['element(by.id("foo")).clickAtPosition()', 'element(by.id("foo")).clickAtPosition(true, false)']
            }
          ]
        }
      ],
      () => './foo/bar.js'
    );

    expect(writeFileSync).toHaveBeenCalledWith('./foo/bar.js', expect.stringContaining('clickAtPosition'));
  });
});
