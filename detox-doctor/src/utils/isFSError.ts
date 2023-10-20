type FSError = Error & { code: string };

export function isFSError(error: unknown): error is FSError {
  return error && typeof error === 'object' ? 'code' in error : false;
}
