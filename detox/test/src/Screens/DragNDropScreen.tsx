import React, { Component, useRef } from 'react';
import { Animated, PanResponder, SafeAreaView, View } from 'react-native';


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
                    <View testID="DragAndDropTarget" style={{ width: 100, height: 100, alignSelf: 'center', backgroundColor: 'yellow' }} />

                    <View style={{ flex: 1, justifyContent: 'flex-end'}}>
                        <DragNDropComponent />
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}
