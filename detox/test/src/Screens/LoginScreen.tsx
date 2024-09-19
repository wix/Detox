import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    Alert,
} from 'react-native';

const { width } = Dimensions.get('window');

const LoginDragDropScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isDropped, setIsDropped] = useState(false);

    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: (_, gestureState) => {
                const dropZone = calculateDropZone();
                if (isDropZone(gestureState, dropZone)) {
                    setIsDropped(true);
                } else {
                    setIsDropped(false);
                }
                // Allow the element to stay where it was dropped
                pan.flattenOffset();
            },
            onPanResponderGrant: () => {
                // When the drag starts, set the offset to the current position
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value
                });
                pan.setValue({ x: 0, y: 0 });
            }
        })
    ).current;

    const calculateDropZone = () => {
        return {
            x: width / 2 - 50,
            y: 400,
            width: 100,
            height: 100,
        };
    };

    const isDropZone = (gesture: { moveX: number; moveY: number }, dropZone: { x: number; y: number; width: number; height: number }) => {
        return (
            gesture.moveY > dropZone.y &&
            gesture.moveY < dropZone.y + dropZone.height &&
            gesture.moveX > dropZone.x &&
            gesture.moveX < dropZone.x + dropZone.width
        );
    };

    const handleLogin = () => {
        if (username === 'user123' && password === 'password123') {
            setIsLoggedIn(true);
            Alert.alert('Success', 'You have successfully logged in!');
        } else {
            Alert.alert('Error', 'Invalid username or password');
        }
    };

    return (
        <View style={styles.container}>
            {!isLoggedIn ? (
                <View style={styles.loginContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                        testID="usernameInput"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        testID="passwordInput"
                    />
                    <TouchableOpacity style={styles.button} onPress={handleLogin} testID="loginButton">
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.dragDropContainer}>
                    <Text style={styles.successText}>Login Successful!</Text>
                    <View style={styles.dropZone} testID="dropZone" />
                    <Animated.View
                        style={{
                            transform: [{ translateX: pan.x }, { translateY: pan.y }],
                        }}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.draggable} testID="draggable" />
                    </Animated.View>
                    {isDropped && <Text style={styles.successText}>Ball dropped in the target zone!</Text>}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loginContainer: {
        width: '80%',
    },
    input: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dragDropContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    dropZone: {
        width: 100,
        height: 100,
        backgroundColor: 'yellow',
        border: '2px solid black',
        position: 'absolute',
        top: 400,
        left: width / 2 - 50,
    },
    draggable: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'blue',
        border: '2px solid black',
    },
});

export default LoginDragDropScreen;
