import React, {useCallback, useState} from 'react';
import {Text, TouchableOpacity} from 'react-native';

const DeviceTapScreen = () => {
  const [shouldShowText, setShouldShowText] = useState(false);

  const onPressButton = useCallback(() => {
    setShouldShowText(true);
  }, [setShouldShowText]);

  return (
    <TouchableOpacity onPress={onPressButton} style={{flex: 1}}>
      {shouldShowText && <Text>{'Screen Tapped'}</Text>}
    </TouchableOpacity>
  );
};

export default DeviceTapScreen;
