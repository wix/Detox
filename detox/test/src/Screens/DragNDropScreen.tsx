import React, { Component } from 'react';
import { Text, View } from 'react-native';

export default class DragNDropScreen extends Component {
    render() {
        return (
            <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Text>DragNDropScreen</Text>
            </View>
        );
    }
}
