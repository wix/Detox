import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  TouchableOpacity
} from 'react-native';

import { FullWindowOverlay } from 'react-native-screens';

const ToastScreen = () => {
  const [showToast, setShowToast] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="toggle-toast-button"
        onPress={() => {
          setShowToast(!showToast);
        }}>
        <Text>Show/Hide Window Overlay Toast</Text>
      </TouchableOpacity>

      <Toast visible={showToast} />
    </View>
  );
};

const Toast = ({visible}) => {
  return visible ? (
    <FullWindowOverlay>
      <View style={styles.toastContainer}>
        <Pressable testID="toast-button" style={styles.toastView}>
          <Text>Toast Button</Text>
        </Pressable>
      </View>
    </FullWindowOverlay>
  ) : null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastView: {
    padding: 20,
    margin: 20
  }
});

export default ToastScreen;
