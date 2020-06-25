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

    it('should indicate an isPending=true, other statuses as false', () => {
      expect(deferred.isPending()).toEqual(true);
      expect(deferred.isResolved()).toEqual(false);
      expect(deferred.isRejected()).toEqual(false);
    });

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

      it('should indicate an isResolved=true, other statuses as false', () => {
        expect(deferred.isResolved()).toEqual(true);
        expect(deferred.isPending()).toEqual(false);
        expect(deferred.isRejected()).toEqual(false);
      });

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

      it('should indicate an isRejected=true, other statuses as false', () => {
        expect(deferred.isRejected()).toEqual(true);
        expect(deferred.isResolved()).toEqual(false);
        expect(deferred.isPending()).toEqual(false);
      });

      describe('and then resolved', () => {
        beforeEach(() => deferred.resolve(42));

        it('should still have that rejected status', () =>
          expect(deferred.status).toBe(Deferred.REJECTED));

        it('should still have that rejected promise', () =>
          expect(deferred.promise).rejects.toThrowError('RejectionTest'));
      });
    });
  });

  describe('when precreated as resolved', () => {
    it('should be resolved', async () => {
      deferred = Deferred.resolved('mock resolution');

      expect(deferred.status).toBe(Deferred.RESOLVED);
      expect(await deferred.promise).toEqual('mock resolution');
    });
  });

  describe('when precreated as rejected', () => {
    it('should be resolved', async () => {
      deferred = Deferred.rejected(new Error('error mock'));

      expect(deferred.status).toBe(Deferred.REJECTED);
      try {
        await deferred.promise;
        fail();
      } catch (e) {
        expect(e.message).toEqual('error mock');
      }
    });
  });
});
