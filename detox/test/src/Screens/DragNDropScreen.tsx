import React, { Component, useRef } from 'react';
import { Animated, PanResponder, SafeAreaView, StatusBar, Text, View } from 'react-native';


const DragNDropComponent = () => {
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                pan.extractOffset();
            }
        })
    ).current;


    return (
        <Animated.View
            style={{
                transform: [{ translateX: pan.x }, { translateY: pan.y }]
            }}
            {...panResponder.panHandlers}>
            <View testID="draggable" style={{ height: 30, width: 30, backgroundColor: 'blue', borderRadius: 16 }} />
        </Animated.View>
    );
};

export default class DragNDropScreen extends Component {
    render() {
        return (
            <SafeAreaView style={{flex: 1}}>
                <View style={{
                    flex: 1,
                    marginTop: 32,
                    paddingHorizontal: 24
                }}>
                    <Text testID="DragAndDropTitle">DragNDropScreen</Text>

                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'orange' }}>
                        <DragNDropComponent />
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}
