import React, { Component } from 'react';
import {
    View,
    Text,
    NativeModules
} from 'react-native';

const CalendarManager = NativeModules.CalendarManager;

export default class Permissions extends Component {

    constructor(props) {
        super(props);
        this.state = {status: "nothing yet"};
    }

    async getAuthorizationStatus() {
        const status = await CalendarManager.getAuthorizationStatus();
        this.setState({
            status: status
        });
    }

    render() {
        const {status} = this.state;

        return (
            <View onLayout={this.getAuthorizationStatus.bind(this)} style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
                <Text>{status}</Text>
            </View>
        );
    }
}
