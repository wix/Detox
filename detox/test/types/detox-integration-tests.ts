import type { Circus } from '@jest/types';
import {
  globalSetup,
  globalTeardown,
  DetoxCircusEnvironment,
  DetoxCircusListener,
  DetoxCircusListenerConstructorOpts
} from 'detox/runners/jest';

class NoneListener implements DetoxCircusListener {}

class OmniListener implements DetoxCircusListener {
  constructor(opts: DetoxCircusListenerConstructorOpts) {
    console.log('Current test path is:', opts.env.testPath);
  }

  start_describe_definition(event: Circus.Event & { name: 'start_describe_definition' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.blockName);
  }

  finish_describe_definition(event: Circus.Event & { name: 'finish_describe_definition' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.blockName);
  }

  add_hook(event: Circus.Event & { name: 'add_hook' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.hookType);
  }

  add_test(event: Circus.Event & { name: 'add_test' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.testName);
  }

  error(event: Circus.Event & { name: 'error' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.error);
  }

  async setup(event: Circus.Event & { name: 'setup' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.runtimeGlobals);
  }

  async include_test_location_in_result(event: Circus.Event & { name: 'include_test_location_in_result' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.name);
  }

  async hook_start(event: Circus.Event & { name: 'hook_start' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.hook.type);
  }

  async hook_success(event: Circus.Event & { name: 'hook_success' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.hook.type);
  }

  async hook_failure(event: Circus.Event & { name: 'hook_failure' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.hook.type, event.error);
  }

  async test_fn_start(event: Circus.Event & { name: 'test_fn_start' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name);
  }

  async test_fn_success(event: Circus.Event & { name: 'test_fn_success' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name);
  }

  async test_fn_failure(event: Circus.Event & { name: 'test_fn_failure' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name, event.error);
  }

  async test_retry(event: Circus.Event & { name: 'test_retry' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name);
  }

  async test_start(event: Circus.Event & { name: 'test_start' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name);
  }

  async test_skip(event: Circus.Event & { name: 'test_skip' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name);
  }

  async test_todo(event: Circus.Event & { name: 'test_todo' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name);
  }

  async test_done(event: Circus.Event & { name: 'test_done' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.test.name);
  }

  async run_describe_start(event: Circus.Event & { name: 'run_describe_start' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.describeBlock.name);
  }

  async run_describe_finish(event: Circus.Event & { name: 'run_describe_finish' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.describeBlock.name);
  }

  async run_start(event: Circus.Event & { name: 'run_start' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.name);
  }

  async run_finish(event: Circus.Event & { name: 'run_finish' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.name);
  }

  async teardown(event: Circus.Event & { name: 'teardown' }, state: Circus.State) {
    if (state.unhandledErrors.length > 0) return;
    console.log(event.name);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CustomEnvironment extends DetoxCircusEnvironment {
  constructor(config: any, context: any) {
    super(config, context);

    this.setupTimeout = 20000;
    this.teardownTimeout = 10000;
    this.registerListeners({
      NoneListener,
      OmniListener,
    });
  }

  handleTestEvent(event: Circus.Event, state: Circus.State): void | Promise<void> {
    if (event.name === 'test_done') {
      console.log(event.test.name);
    }

    return super.handleTestEvent(event, state);
  }
}

async function main() {
  try {
    await globalSetup();
  } finally {
    await globalTeardown();
  }
}

main().catch(() => {});
