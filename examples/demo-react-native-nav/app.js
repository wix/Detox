import React, { useRef } from 'react';
import {
  Text,
  View,
  Button,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

const screenOptions = { animationEnabled: false };
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen name="Home" component={stack} />
        <Drawer.Screen name="Home2" component={stack} />
      </Drawer.Navigator>
    </NavigationContainer>
  )
};

const stack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="App" component={Example} options={screenOptions} />
    <Stack.Screen name="App2" component={Example} options={screenOptions} />
    <Stack.Screen name="App3" component={Example} options={screenOptions} />
    <Stack.Screen name="App4" component={Example} options={screenOptions} />
    <Stack.Screen name="App5" component={Example} options={screenOptions} />
  </Stack.Navigator>
);

const Example = ({navigation, route}) => {
  const alertButton = useRef(null);

  const exampleAlert = () => Alert.alert(
    "Some alert",
    alertButton.current.props.testID,
    [{ text: 'Close', style: 'cancel' }]
  );

  return (
    <View testID='welcome' style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
      <Text testID='route_name' style={{fontSize: 25, marginBottom: 30}}>Screen: {route.name}</Text>
      <Button testID='app_button_1' onPress={() => navigation.push('App')} title={'App'} />
      <Button testID='app_button_2' onPress={() => navigation.push('App2')} title={'App2'} />
      <Button testID='app_button_3' onPress={() => navigation.push('App3')} title={'App3'} />
      <Button testID='app_button_4' onPress={() => navigation.push('App4')} title={'App4'} />
      <Button testID='app_button_5' onPress={() => navigation.push('App5')} title={'App5'} />
      {navigation.canGoBack() && <Button testID='app_button_pop' onPress={() => navigation.pop()} title={'Pop'} />}
      <Button testID='app_button_alert' ref={alertButton} title={'Alert'} onPress={exampleAlert} />
    </View>
  );
}

export default App
