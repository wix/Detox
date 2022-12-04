import {
  AppRegistry,
  NativeModules,
} from 'react-native';

import example from './src/app';

const { NativeModule } = NativeModules;

class exampleAndroid extends example {
  async componentDidMount() {
    await super.componentDidMount();
    await this._registerEarlyCrashIfNeeded();
  }

  async _registerEarlyCrashIfNeeded() {
    const launchArguments = await NativeModule.getLaunchArguments();
    if (launchArguments.simulateEarlyCrash) {
      console.warn('simulateEarlyCrash=true detected: Will crash in a few seconds from now (all-the-while keeping the app busy)...');
      this._setupBusyFutureCrash();
    }
  }

  /**
   * What we're aiming at here is to have the app crash while Detox is waiting for it to become *ready* (i.e. idle)
   * for the first time, because this is a soft-spot, as we know. If we crash immediately, it might be too soon (i.e. before 'isReady'
   * is sent & received). We therefore wait a few seconds, and only then crash, provided that in a 99% chance we'll be past
   * the isReady request. We also want to keep things busy (i.e. make sure a 'ready' isn't responded), so we use short *timeouts*
   * rather than setInterval() and >1500ms intervals.
   */
  _setupBusyFutureCrash() {
    const INTERVAL = 1000;
    const ITERATIONS = 8;

    let count = 0;

    const handler = () => {
      count++;

      if (count === ITERATIONS) {
        console.warn('simulateEarlyCrash=true', 'Simulating a crash now!');
        throw new Error('Simulating early crash');
      }
      setTimeout(handler, INTERVAL);
    };
    setTimeout(handler, INTERVAL);
  }
}

AppRegistry.registerComponent('example', () => exampleAndroid);
