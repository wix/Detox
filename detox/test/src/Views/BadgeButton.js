import React, {useCallback, useState} from 'react';
import {Image, StyleSheet, Text, View, TouchableOpacity} from 'react-native';

const BadgeButton = ({ testID, icon, text }) => {
    const [visible, setVisible] = useState(true);

    const toggleVisible = useCallback(() => {
        setVisible(!visible);
    }, [visible]);

    return (
        <View style={styles.button}>
            <TouchableOpacity testID={testID} style={styles.button} onPress={toggleVisible}>
                <Image style={styles.image} source={icon} />
            </TouchableOpacity>
            {visible && <View key="badge" testID={testID + '.badge'} pointerEvents="none" style={styles.badge}>
                <Text style={styles.text}>{text}</Text>
            </View>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {

    },
    image: {
        height: 24,
        width: 24,
    },
    badge: {
        position: 'absolute',
        right: -2,
        top: -2,
        backgroundColor: 'purple',
        height: 16,
        width: 16,
        borderRadius: 8,
    },
    text: {
        fontSize: 12,
        lineHeight: 16,
        color: 'white',
        textAlign: 'center',
    },
});

export default BadgeButton;
