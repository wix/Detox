import React, { Component } from 'react';
import {
  Text,
  View
} from 'react-native';

export default class LocationScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      coordinates: null
    }

    this.getLocation();
  }

  getLocation() {
    function success(pos) {
      this.setState({
        coordinates: pos.coords
      });
    };

    function error(err) {
      this.setState({
        coordinates: null
      });
    };

    navigator.geolocation.getCurrentPosition(success.bind(this), error.bind(this));
  }

  render() {
    if (this.state.coordinates) {
      return (
        <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Text testID="latitude" style={{ marginBottom: 20 }}>Latitude: {this.state.coordinates.latitude}</Text>
          <Text testID="longitude" style={{ marginBottom: 20 }}>Longitude: {this.state.coordinates.longitude}</Text>
        </View>
      );
    } else {
      return (
        <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Text testID="error" style={{ marginBottom: 20 }}>Location unavailable</Text>
        </View>
      );
    }
  }
}
