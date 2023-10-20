import { FAILURE, SKIPPED, SUCCESS } from '../constants';
import { flattenResult } from './flattenResult';

describe('flattenResult', () => {
  it('should flatten a success result', () => {
    expect(
      flattenResult({
        status: SUCCESS,
        successMessage: 'Success message',
      }),
    ).toEqual({
      status: SUCCESS,
      message: 'Success message',
    });
  });

  it('should flatten a failure result', () => {
    expect(
      flattenResult({
        status: FAILURE,
        failureMessage: 'Failure message',
      }),
    ).toEqual({
      status: FAILURE,
      message: 'Failure message',
    });
  });

  it('should flatten a skipped result', () => {
    expect(
      flattenResult({
        status: SKIPPED,
        skipReason: 'Skipped reason',
      }),
    ).toEqual({
      status: SKIPPED,
      message: 'Skipped reason',
    });
  });

  it('should throw an error for an unknown status', () => {
    expect(() =>
      flattenResult({
        status: 'unknown' as any,
      }),
    ).toThrowError('Unknown rule result status: unknown');
  });
});
