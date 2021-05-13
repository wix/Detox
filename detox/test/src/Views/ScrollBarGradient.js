import React, {useMemo} from 'react';
import {Image, StyleSheet, View} from 'react-native';

const GRADIENT_IMAGE = require('../assets/gradientOverlay.png');
const GRADIENT_COLOR = '#fff';

const ScrollBarGradient = ({
  left,
  width = 76,
  margins = 0,
}) => {
  const styles = useMemo(() => {
    return StyleSheet.create({
      view: {
        opacity: 1,
        position: 'absolute',
        width: width,
        height: '100%',
        left: left ? margins : undefined,
        right: !left ? margins : undefined,
      },
      image: {
        width,
        height: '100%',
        tintColor: GRADIENT_COLOR,
        transform: left ? [{scaleX: -1}] : undefined,
      },
    });
  }, [left, margins, width]);

  return (
    <View pointerEvents="none" style={styles.view}>
      <Image
        source={GRADIENT_IMAGE}
        style={styles.image}
        resizeMode={'stretch'}
      />
    </View>
  );
};

ScrollBarGradient.displayName = 'IGNORE';

export default ScrollBarGradient;
