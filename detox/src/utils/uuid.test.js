const { UUID, isUUID } = require('./uuid');

describe('uuid', () => {
  describe('UUID', () => {
    it('should generate uuids', () => {
      expect(UUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(UUID()).not.toBe(UUID());
    })
  });

  describe('isUUID', () => {
    it('should recognize uuids', () => {
      expect(isUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
      expect(isUUID(UUID())).toBe(true);

      expect(isUUID(UUID().substring(1))).toBe(false);
      expect(isUUID(UUID() + '-')).toBe(false);
      expect(isUUID(UUID() + '0')).toBe(false);
    })
  });
});
