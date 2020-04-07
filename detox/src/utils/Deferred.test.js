const Deferred = require('./Deferred');

describe('Deferred', () => {
  /** @type {Deferred} */
  let deferred;

  describe('static properties', () => {
    it('should have "pending" status', () =>
      expect(Deferred.PENDING).toBe('pending'));

    it('should have "resolved" status', () =>
      expect(Deferred.RESOLVED).toBe('resolved'));

    it('should have "rejected" status', () =>
      expect(Deferred.REJECTED).toBe('rejected'));
  });

  describe('when created', () => {
    beforeEach(() => {
      deferred = new Deferred();
    });

    it('should have pending status', () =>
      expect(deferred.status).toBe(Deferred.PENDING));

    it('should have promise', () =>
      expect(deferred.promise).toBeInstanceOf(Promise));

    it('can be resolved', () =>
      expect(() => deferred.resolve()).not.toThrowError());

    it('can be rejected', () =>
      expect(() => deferred.reject()).not.toThrowError());

    describe('and resolved', () => {
      beforeEach(() => deferred.resolve(42));

      it('should have a resolved status', () =>
        expect(deferred.status).toBe(Deferred.RESOLVED));

      it('should have a resolved promise', () =>
        expect(deferred.promise).resolves.toBe(42));

      describe('and then rejected', () => {
        beforeEach(() => deferred.reject(new Error('RejectionTest')));

        it('should still have that resolved status', () =>
          expect(deferred.status).toBe(Deferred.RESOLVED));

        it('should still have that resolved promise', () =>
          expect(deferred.promise).resolves.toBe(42));
      });
    });

    describe('and rejected', () => {
      beforeEach(() => deferred.reject(new Error('RejectionTest')));

      it('should have a rejected status', () =>
        expect(deferred.status).toBe(Deferred.REJECTED));

      it('should have a rejected promise', () =>
        expect(deferred.promise).rejects.toThrowError('RejectionTest'));

      describe('and then resolved', () => {
        beforeEach(() => deferred.resolve(42));

        it('should still have that rejected status', () =>
          expect(deferred.status).toBe(Deferred.REJECTED));

        it('should still have that rejected promise', () =>
          expect(deferred.promise).rejects.toThrowError('RejectionTest'));
      });
    });
  });
});
