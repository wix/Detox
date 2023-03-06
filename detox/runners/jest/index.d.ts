declare module 'detox/runners/jest' {
  import type NodeEnvironment from 'jest-environment-node';

  export function globalSetup(): Promise<void>;
  export function globalTeardown(): Promise<void>;

  export type DetoxCircusListenerConstructorOpts = {
    readonly env: DetoxCircusEnvironment;
  }

  /**
   * @example
   * class CustomListener implements DetoxCircusListener {
   *   constructor(opts: DetoxCircusListenerConstructorOpts) {
   *     console.log('Current test path is:', opts.env.testPath);
   *   }
   * }
   */
  export interface DetoxCircusListener {
    start_describe_definition?(event: unknown, state: unknown): void;
    finish_describe_definition?(event: unknown, state: unknown): void;
    add_hook?(event: unknown, state: unknown): void;
    add_test?(event: unknown, state: unknown): void;
    error?(event: unknown, state: unknown): void;

    setup?(event: unknown, state: unknown): void | Promise<void>;
    include_test_location_in_result?(event: unknown, state: unknown): void | Promise<void>;
    hook_start?(event: unknown, state: unknown): void | Promise<void>;
    hook_success?(event: unknown, state: unknown): void | Promise<void>;
    hook_failure?(event: unknown, state: unknown): void | Promise<void>;
    test_fn_start?(event: unknown, state: unknown): void | Promise<void>;
    test_fn_success?(event: unknown, state: unknown): void | Promise<void>;
    test_fn_failure?(event: unknown, state: unknown): void | Promise<void>;
    test_retry?(event: unknown, state: unknown): void | Promise<void>;
    test_start?(event: unknown, state: unknown): void | Promise<void>;
    test_skip?(event: unknown, state: unknown): void | Promise<void>;
    test_todo?(event: unknown, state: unknown): void | Promise<void>;
    test_done?(event: unknown, state: unknown): void | Promise<void>;
    run_describe_start?(event: unknown, state: unknown): void | Promise<void>;
    run_describe_finish?(event: unknown, state: unknown): void | Promise<void>;
    run_start?(event: unknown, state: unknown): void | Promise<void>;
    run_finish?(event: unknown, state: unknown): void | Promise<void>;
    teardown?(event: unknown, state: unknown): void | Promise<void>;
  }

  export interface DetoxListenerFactory {
    new (opts: DetoxCircusListenerConstructorOpts): DetoxCircusListener;
  }

  export class DetoxCircusEnvironment extends NodeEnvironment {
    public readonly testPath: string;

    public handleTestEvent(event: unknown, state: unknown): void | Promise<void>;

    protected registerListeners(map: Record<string, DetoxListenerFactory>): void;
    protected setupTimeout: number;
    protected teardownTimeout: number;
    protected initDetox(): Promise<DetoxInternals.Worker>;
    protected cleanupDetox(): Promise<void>;
  }
}
