import React, { useCallback, useState } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';

const DeviceTapScreen = () => {
  const [shouldShowScreenText, setShouldShowScreenText] = useState(false);
  const [shouldShowButtonText, setShouldShowButtonText] = useState(false);
  const [shouldShowLongText, setShouldShowLongText] = useState(false);
  const [shouldShowLongCustomText, setShouldShowLongCustomText] = useState(false);

  const onPressLongCustom = useCallback(() => {
    setShouldShowLongCustomText(true);
  }, [setShouldShowLongCustomText]);

  const onPressScreen = useCallback(() => {
    setShouldShowScreenText(true);
  }, [setShouldShowScreenText]);

  const onPressButton = useCallback(() => {
    setShouldShowButtonText(true);
  }, [setShouldShowButtonText]);

  const onPressLong = useCallback(() => {
    setShouldShowLongText(true);
  }, [setShouldShowLongText]);

  return (<>
    <TouchableOpacity onLongPress={onPressLong} onPress={onPressScreen} style={{ flex: 1 }}>
      <View style={{ left: 190, top: 190, position: 'absolute' }}>
        <Button onPress={onPressButton} title="TAP ME" />
      </View>
      <TouchableOpacity delayLongPress={900} onLongPress={onPressLongCustom} style={{ left: 150, top: 150, position: 'absolute' }}>
        <Text>{'TAP LONG TIME'}</Text>
      </TouchableOpacity>
      {shouldShowLongCustomText && <Text>{'Screen Long Custom Duration Pressed'}</Text>}
      {shouldShowLongText && <Text>{'Screen Long Pressed'}</Text>}
      {shouldShowScreenText && <Text>{'Screen Tapped'}</Text>}
      {shouldShowButtonText && <Text>{'Button Tapped'}</Text>}
    </TouchableOpacity>
  </>
  );
};

export default DeviceTapScreen;
