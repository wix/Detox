import {LaunchArguments} from 'react-native-launch-arguments';
import AbstractArgsListScreen from './AbstractArgsListScreen';

export default class LaunchArgsScreen extends AbstractArgsListScreen {
  constructor(props) {
    super(props, 'launchArg');
  }

  async readArguments() {
    return LaunchArguments.value();
  }

  getTitle() {
    return 'Launch Arguments';
  }
}
