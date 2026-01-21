import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  Switch,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';

export default function SemanticTypesScreen() {
  return (
    <ScrollView testID="semanticTypesScreen" style={{ flex: 1, padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Semantic Types Test</Text>
      
      {/* Image */}
      <Image 
        testID="semanticImage"
        source={require('../assets/star.png')} 
        style={{ width: 50, height: 50, marginBottom: 10 }} 
      />
      
      {/* Text */}
      <Text testID="semanticText" style={{ marginBottom: 10 }}>Text Element</Text>
      
      {/* Input Field */}
      <TextInput 
        testID="semanticInput"
        placeholder="Input field"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      {/* Activity Indicator / Progress */}
      <ActivityIndicator 
        testID="semanticProgress"
        size="large" 
        color="#0000ff" 
        style={{ marginBottom: 10 }} 
      />
      
      {/* Switch */}
      <Switch testID="semanticSwitch" style={{ marginBottom: 10 }} />
      
      {/* Slider */}
      <Slider 
        testID="semanticSlider"
        style={{ width: 200, marginBottom: 10 }} 
        minimumValue={0} 
        maximumValue={1} 
      />
      
      {/* Picker */}
      <Picker testID="semanticPicker" style={{ width: 200, height: 50, marginBottom: 10 }}>
        <Picker.Item label="Option 1" value="1" />
        <Picker.Item label="Option 2" value="2" />
      </Picker>
      
      {/* ScrollView (nested) */}
      <View style={{ height: 60, marginBottom: 10 }}>
        <ScrollView testID="semanticScrollView" style={{ backgroundColor: '#eee' }}>
          <Text>Scrollable content 1</Text>
          <Text>Scrollable content 2</Text>
        </ScrollView>
      </View>
      
      {/* List (FlatList) */}
      <FlatList
        testID="semanticList"
        data={[{key: '1', title: 'Item 1'}, {key: '2', title: 'Item 2'}]}
        renderItem={({item}) => <Text>{item.title}</Text>}
        style={{ height: 60, backgroundColor: '#ddd' }}
      />
    </ScrollView>
  );
}

