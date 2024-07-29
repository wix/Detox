import React, { useCallback, useState } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';

const DeviceTapScreen = () => {
  const [shouldShowScreenText, setShouldShowScreenText] = useState(false);
  const [shouldShowButtonText, setShouldShowButtonText] = useState(false);

  const onPressScreen = useCallback(() => {
    setShouldShowScreenText(true);
  }, [setShouldShowScreenText]);

  const onPressButton = useCallback(() => {
    setShouldShowButtonText(true);
  }, [setShouldShowScreenText]);

  return (
    <TouchableOpacity onPress={onPressScreen} style={{ flex: 1 }}>
      <View style={{ left: 40, top: 25, position: 'absolute' }}>
        <Button onPress={onPressButton} title="TAP ME" />
      </View>
      {shouldShowScreenText && <Text>{'Screen Tapped'}</Text>}
      {shouldShowButtonText && <Text>{'Button Tapped'}</Text>}
    </TouchableOpacity>
  );
};

export default DeviceTapScreen;
