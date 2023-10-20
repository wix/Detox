export interface DebugLogger {
  debug: (typeof console)['debug'];
}

export interface Logger extends DebugLogger {
  log: (typeof console)['log'];
}
