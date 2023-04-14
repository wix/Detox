const setUniqueProperty = require('./setUniqueProperty');

describe('setUniqueProperty(obj, key, value', () => {
  it('should set obj[key] = value', () => {
    expect(setUniqueProperty({}, 'a', 1)).toEqual({ a: 1 });
  });

  it('should set obj[key + 2] = value if obj[key] exists', () => {
    expect(setUniqueProperty({ a: 1 }, 'a', 2)).toEqual({ a: 1, a2: 2 });
  });

  it('should set obj[key + 3] = value if obj[key] and obj[key + 2] exist', () => {
    expect(setUniqueProperty({ a: 1, a2: 2 }, 'a', 3)).toEqual({ a: 1, a2: 2, a3: 3 });
  });
});
