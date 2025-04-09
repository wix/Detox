import React, { Component, useState } from 'react';
import { Alert, Button, SafeAreaView, Text, View } from 'react-native';


const AlertComponent = () => {
    const [textState, setTextState] = useState('Not Pressed');

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, alignContent: 'center' }}>
                <Text style={{ padding: 16 }} testID='AlertScreen.Text'>{textState}</Text>

                <Button title={'Show Alert'} testID='AlertScreen.Button' onPress={() => {
                    Alert.alert(
                        'Alert Title',
                        'My Alert Msg',
                        [{
                            text: 'Cancel',
                            onPress: () => setTextState('Cancel Pressed')
                        }, {
                            text: 'OK',
                            onPress: () => setTextState('OK Pressed')
                        }
                        ]);
                }} />
            </View>
        </SafeAreaView>
    );
};

export default class AlertScreen extends Component {
    render() {
        return (
            <AlertComponent />
        );
    }
}
