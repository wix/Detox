import React, { Component } from 'react';
import {
  Text,
  View,
  Button
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

function Frame({ children }) {
  return (
    <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
      {children}
    </View>
  );
}

function Label({ testID, children }) {
  return (
    <Text testID={testID} style={{ marginBottom: 20 }}>
      {children}
    </Text>
  );
}

export default class LocationScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locationRequested: false,
      coordinates: null,
      error: '',
    }
  }

  onLocationReceived = (pos) => {
    this.setState({
      coordinates: pos.coords,
      error: '',
    });
  };

  onLocationError = (error) => {
    this.setState({
      coordinates: null,
      error: error.message,
    });
  };

  requestLocation = async () => {
    this.setState({ locationRequested: true });

    await Geolocation.getCurrentPosition(this.onLocationReceived, this.onLocationError, {
      enableHighAccuracy: true,
      timeout: 4500,
      maximumAge: 0,
    });
  }

  render() {
    if (!this.state.locationRequested) {
      return (
        <Frame>
          <Button testID="getLocationButton" title="Get location" onPress={this.requestLocation} />
        </Frame>
      );
    }

    if (this.state.coordinates) {
      return (
        <Frame>
          <Label testID="latitude">Latitude: {this.state.coordinates.latitude}</Label>
          <Label testID="longitude">Longitude: {this.state.coordinates.longitude}</Label>
        </Frame>
      );
    }

    if (this.state.error) {
      return (
        <Frame>
          <Label testID="error">{this.state.error}</Label>
        </Frame>
      );
    }

    return (
      <Frame>
        <Label testID="loading">Locating...</Label>
      </Frame>
    );
  }
}