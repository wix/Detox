// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function instantiateMaybeClass(Klass: any, ...args: unknown[]) {
  try {
    return new Klass(...args);
  } catch (error: unknown) {
    if (!(error instanceof TypeError) || typeof Klass !== 'function') {
      throw error;
    }

    if (!error.message.endsWith('is not a constructor')) {
      throw error;
    }

    return Klass(...args);
  }
}
