import example from './src/app';

import {
  AppRegistry,
} from 'react-native';

class exampleAndroid extends example {

}

AppRegistry.registerComponent('example', () => exampleAndroid);