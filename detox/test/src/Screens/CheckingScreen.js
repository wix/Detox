import React, { Component } from 'react';
import {
  Alert,
  View,
  TouchableOpacity,
  Text,
  StyleSheet
} from 'react-native';
import PasteBoardScreen from './PasteBoardScreen';

export default class CheckingScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            example: undefined
        };
    }

  render() {
    if (this.state.example) {
        const CheckingScreen = this.state.example;
        return <CheckingScreen />;
    }
    return (
        <View style  = {styles.container}>
        <TouchableOpacity testID = "backButton" onPress={(() => this.setState({example : PasteBoardScreen}))}>
            <Text style={styles.buttonText}>
              Back button
            </Text>
          </TouchableOpacity>
        </View>
    );
  }
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      // justifyContent: 'center',
      paddingTop: 60,
      alignItems: 'center',
      backgroundColor: '#F5FCFF',
    },
    buttonText: {
      color: 'blue',
      marginBottom: 20,
      fontSize: 20
    }
  });



