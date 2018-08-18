const combineDocumentations = require('../combine');

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
