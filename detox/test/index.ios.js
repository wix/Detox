import { LogBox, AppRegistry } from 'react-native';

import example from './src/app';

import registerEarlyCrashIfNeeded from './registerEarlyCrashIfNeeded';

class exampleIos extends example {}

registerEarlyCrashIfNeeded();

LogBox.ignoreAllLogs();
AppRegistry.registerComponent('example', () => exampleIos);
