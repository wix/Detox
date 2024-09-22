import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

type Shape = 'circle' | 'square' | 'triangle';
type Color = '#ff0000' | '#0033FF' | '#ff4d00';

interface ShapeProps {
    shape: Shape;
    color: Color;
    matched: boolean;
}

const ShapeMatchGameScreen: React.FC = () => {
    const [score, setScore] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [shapes, setShapes] = useState<ShapeProps[]>([
        { shape: 'circle', color: '#ff0000', matched: false },
        { shape: 'square', color: '#0033FF', matched: false },
        { shape: 'triangle', color: '#ff4d00', matched: false },
        { shape: 'circle', color: '#0033FF', matched: false },
        { shape: 'triangle', color: '#ff0000', matched: false },
        { shape: 'square', color: '#ff0000', matched: false },
    ]);

    const panRefs = useRef(shapes.map(() => new Animated.ValueXY())).current;

    const startPositions = [
        { x: 50, y: height - 550 },
        { x: width / 2 - 30, y: height - 550 },
        { x: width - 110, y: height - 550 },
        { x: 50, y: height - 450 },
        { x: width / 2 - 30, y: height - 450 },
        { x: width - 110, y: height - 450 },
    ];

    const createPanResponder = (index: number) => {
        return PanResponder.create({
            onMoveShouldSetPanResponder: () => !shapes[index].matched,
            onPanResponderMove: (_, gesture) => {
                if (!shapes[index].matched) {
                    Animated.event([null, { dx: panRefs[index].x, dy: panRefs[index].y }], { useNativeDriver: false })(_, gesture);
                }
            },
            onPanResponderRelease: (_, gesture) => handleRelease(index, gesture),
            onPanResponderGrant: () => {
                if (!shapes[index].matched) {
                    panRefs[index].setOffset({
                        x: panRefs[index].x._value,
                        y: panRefs[index].y._value
                    });
                    panRefs[index].setValue({ x: 0, y: 0 });
                }
            }
        });
    };

    const handleRelease = (index: number, gesture: { moveX: number; moveY: number }) => {
        const shape = shapes[index];
        const hole = getMatchingHole(shape);
        if (isInHole(gesture, hole)) {
            setScore(prevScore => prevScore + 1);
            setShapes(prevShapes => prevShapes.map((s, i) => i === index ? {...s, matched: true} : s));
        } else {
            Animated.spring(panRefs[index], {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false
            }).start();
        }
    };

    const getMatchingHole = (shape: ShapeProps) => {
        const holeSize = 80;
        const holeSpacing = 100;
        const startY = height * 0.2;
        const index = shapes.findIndex(s => s.shape === shape.shape && s.color === shape.color);
        return {
            x: width / 2 - (shapes.length / 2 * holeSpacing) / 2 + (index % 3) * holeSpacing,
            y: startY + Math.floor(index / 3) * holeSpacing,
            width: holeSize,
            height: holeSize,
        };
    };

    const isInHole = (gesture: { moveX: number; moveY: number }, hole: { x: number; y: number; width: number; height: number }) => {
        const errorMargin = 20;
        return (
            gesture.moveX > hole.x - errorMargin &&
            gesture.moveX < hole.x + hole.width + errorMargin &&
            gesture.moveY - 120 > hole.y - errorMargin &&
            gesture.moveY - 120 < hole.y + hole.height + errorMargin);
    };

    const renderShape = (shape: ShapeProps, index: number) => {
        const panResponder = createPanResponder(index);
        return (
            <Animated.View
                testID={`shape-${index}`}
                key={index}
                style={[
                    styles.shape,
                    { backgroundColor: shape.color },
                    shape.shape === 'circle' && styles.circle,
                    shape.shape === 'square' && styles.square,
                    shape.shape === 'triangle' && styles.triangle,
                    {
                        position: 'absolute',
                        left: startPositions[index].x,
                        top: startPositions[index].y,
                        transform: [
                            { translateX: panRefs[index].x },
                            { translateY: panRefs[index].y },
                        ],
                    },
                ]}
                {...panResponder.panHandlers}
            />
        );
    };

    const renderHole = (shape: ShapeProps, index: number) => {
        const hole = getMatchingHole(shape);
        return (
            <View
                testID={`shape-hole-${index}`}
                key={index}
                style={[
                    styles.hole,
                    { left: hole.x, top: hole.y },
                    shape.shape === 'circle' && styles.circleHole,
                    shape.shape === 'square' && styles.squareHole,
                    shape.shape === 'triangle' && styles.triangleHole,
                ]}
            />
        );
    };

    const resetGame = () => {
        setScore(0);
        setErrorMessage('');
        setShapes([
            { shape: 'circle', color: '#ff0000', matched: false },
            { shape: 'square', color: '#0033FFFF', matched: false },
            { shape: 'triangle', color: '#FF4D00FF', matched: false },
            { shape: 'circle', color: '#0033FF', matched: false },
            { shape: 'triangle', color: '#ff0000', matched: false },
            { shape: 'square', color: '#ff0000', matched: false },
        ]);
        panRefs.forEach(ref => ref.setValue({ x: 0, y: 0 }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Shape Matcher</Text>
                <Text style={styles.score}>Score: {score}</Text>
            </View>
            <View style={styles.gameArea}>
                {shapes.slice(0, 3).map(renderHole)}
                {shapes.map(renderShape)}
            </View>
            {errorMessage ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                </View>
            ) : null}
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                <Text style={styles.resetButtonText}>Reset Game</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    score: {
        fontSize: 18,
        color: '#666',
        marginTop: 5,
    },
    gameArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shape: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    circle: {
        borderRadius: 30,
    },
    square: {},
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderColor: '#ffae00',
        borderLeftWidth: 30,
        borderRightWidth: 30,
        borderBottomWidth: 60,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    hole: {
        width: 80,
        height: 80,
        backgroundColor: '#CCC',
        position: 'absolute',
    },
    circleHole: {
        borderRadius: 40,
    },
    squareHole: {},
    triangleHole: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 40,
        borderRightWidth: 40,
        borderBottomWidth: 80,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#CCC',
    },
    resetButton: {
        backgroundColor: '#0033FF',
        padding: 15,
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 8,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        padding: 10,
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    errorMessage: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ShapeMatchGameScreen;
