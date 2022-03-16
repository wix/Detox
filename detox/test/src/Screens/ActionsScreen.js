import React, { Component } from 'react';
import {
  Text,
  BackHandler,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Dimensions,
  StyleSheet,
  Slider,
  SafeAreaView,
  requireNativeComponent,
} from 'react-native';
import TextInput from '../Views/TextInput';

const DoubleTapsText = requireNativeComponent('DetoxDoubleTapsTextView');
const SluggishTapsText = requireNativeComponent('DetoxSluggishTapsTextView');

const { width } = Dimensions.get('window');

// Calc horizontal item size to have exactly 5 items visible
const hItemWidth = (width / 5) - 20;

const styles = StyleSheet.create({
  item: { height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10 },
  horizItem: { width: hItemWidth, backgroundColor: '#e8e8f8', margin: 10, textAlign: 'center', textAlignVertical: 'center' },
});

const isIos = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

export default class ActionsScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      greeting: undefined,
      typeText: '',
      clearText: 'some stuff here..',
      numTaps: 0,
      isRefreshing: false,
      backPressed: false,
      showScrollOverlays: false,
    };
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backHandler.bind(this));
  }

  render() {
    if (this.state.greeting) return this.renderAfterButton();
    if (this.state.backPressed) return this.renderPopupBackPressedDetected();

    return (
      <SafeAreaView  testID='View7990' style={{ flex: 1 ,justifyContent: 'flex-start' }}>

        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'Tap Working')}
          onLongPress={this.onButtonPress.bind(this, 'Long Press Working')}
        >
          <Text style={{ color: 'blue', marginTop: isIos? 40 : 0, marginBottom: 10, textAlign: 'center' }}>Tap Me</Text>
        </TouchableOpacity>

        <TouchableOpacity
          delayLongPress={1200}
          onLongPress={this.onButtonPress.bind(this, 'Long Press With Duration Working')}
        >
          <Text style={{ color: 'blue', marginBottom: 10, textAlign: 'center' }}>Long Press Me 1.5s</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onLongTimeout.bind(this)}
        >
          <Text testID='WhyDoAllTheTestIDsHaveTheseStrangeNames' style={{ color: 'blue', marginBottom: 10, textAlign: 'center' }}>Tap Me For Long Timeout</Text>
        </TouchableOpacity>

        <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 10}}>
          <TouchableOpacity onPress={this.onMultiTapPress.bind(this)}>
            <Text style={{ color: 'blue', textAlign: 'center' }}
              testID='UniqueId819'>Taps: {this.state.numTaps}</Text>
          </TouchableOpacity>

          {isAndroid && this.renderInlineSeparator()}
          {isAndroid && <View style={{ width: 110 }}>
            <DoubleTapsText style={{ flex: 1 }}/>
          </View>}
          {isAndroid && this.renderInlineSeparator()}
          {isAndroid && <View style={{ width: 75 }}>
            <SluggishTapsText style={{ flex: 1 }}/>
          </View>}
        </View>

        <View testID='UniqueId937_wrapper'>
          <TextInput style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, marginHorizontal: 20, padding: 5 }}
            onChangeText={this.onChangeTypeText.bind(this)}
            value={this.state.typeText}
            testID='UniqueId937'
            onSubmitEditing={this.onReturn.bind(this)}
            />
        </View>

        {isIos && <TouchableOpacity style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, marginHorizontal: 20, padding: 5 }} testID='NoTextInputInside' />}

        <TextInput style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, marginHorizontal: 20, padding: 5 }}
          onChangeText={this.onChangeClearText.bind(this)}
          value={this.state.clearText}
          testID='UniqueId005'
          multiline
        />

        <TextInput style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, marginHorizontal: 20, padding: 5 }}
          onChangeText={this.onReplaceText.bind(this)}
          value={this.state.replaceText}
          testID='UniqueId006'
        />

        <View style={{ height: 20, borderColor: '#c0c0c0', borderWidth: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
          <TouchableOpacity onPress={this.onToggleScrollViewVisibility.bind(this)}>
            <Text testID='toggleScrollOverlays' style={{ color: 'blue' }}>Toggle scroll overlays</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100, borderColor: '#c0c0c0', borderWidth: 1, backgroundColor: '#f8f8ff' }}>
          <ScrollView testID='ScrollView161'>
            <Text style={styles.item}>Text1</Text>
            <Text style={styles.item}>Text2</Text>
            <Text style={styles.item}>Text3</Text>
            <Text style={styles.item}>Text4</Text>
            <Text style={styles.item}>Text5</Text>
            <Text style={styles.item}>Text6</Text>
            <Text style={styles.item}>Text7</Text>
            <Text style={styles.item}>Text8</Text>
            <Text style={styles.item}>Text9</Text>
            <Text style={styles.item}>Text10</Text>
            <Text style={styles.item}>Text11</Text>
            <Text style={styles.item}>Text12</Text>
          </ScrollView>
          { this.state.showScrollOverlays ? <View style={{ height: 55, width: width * 0.75, backgroundColor: 'deepskyblue', position: 'absolute', bottom: 0 }} /> : null }
          { this.state.showScrollOverlays ? <View style={{ height: 55, width: width * 0.75, backgroundColor: 'goldenrod', position: 'absolute', right: 0 }} /> : null }
        </View>

        <View style={{ height: 50, borderColor: '#c0c0c0', borderWidth: 1, backgroundColor: '#f8f8ff' }}>
          <ScrollView testID='ScrollViewH' horizontal>
            <Text style={styles.horizItem}>HText1</Text>
            <Text style={styles.horizItem}>HText2</Text>
            <Text style={styles.horizItem}>HText3</Text>
            <Text style={styles.horizItem}>HText4</Text>
            <Text style={styles.horizItem}>HText5</Text>
            <Text style={styles.horizItem}>HText6</Text>
            <Text style={styles.horizItem}>HText7</Text>
            <Text style={styles.horizItem}>HText8</Text>
          </ScrollView>
          { this.state.showScrollOverlays ? <View style={{ height: 28, width: width * 0.75, backgroundColor: 'goldenrod', position: 'absolute', bottom: 0 }} /> : null }
          { this.state.showScrollOverlays ? <View style={{ height: 28, width: width * 0.75, backgroundColor: 'deepskyblue', position: 'absolute', right: 0 }} /> : null }
        </View>

        <View style={{ height: 100, borderColor: '#c0c0c0', borderWidth: 1, backgroundColor: '#f8f8ff', marginBottom: 15 }}>
          <ScrollView testID='ScrollView799' refreshControl={
            <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this.onRefresh.bind(this)} title="Loading..." />
          }>
          </ScrollView>
        </View>

        <View style={{ height: 40, borderColor: '#c0c0c0', marginHorizontal: 20 }}>
          <Slider testID='sliderWithASimpleID' maximumValue={1000.0} minimumValue={0.0} value={250.0}/>
        </View>

        <View>
          <ScrollView testID='PinchableScrollView' minimumZoomScale={1} maximumZoomScale={10}>
            <View>
              <View testID='UniqueId007' style={{ height: 30, width: 30, backgroundColor:'red' }} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  renderInlineSeparator() {
    return <Text style={{width: 10}}> | </Text>;
  }

  renderAfterButton() {
    return (
      <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 25 }}>
          {this.state.greeting}!!!
        </Text>
      </View>
    );
  }

  renderPopupBackPressedDetected() {
    return (
      <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 25 }}>
          Back pressed !
        </Text>
      </View>
    );
  }

  onButtonPress(greeting) {
    this.setState({
      greeting: greeting
    });
  }

  onReturn() {
    this.setState({
      greeting: "Return Working"
    });
  }

  onLongTimeout() {
    setTimeout(() => {
      this.setState({
        greeting: "After Long Timeout"
      });
    }, 4000);
  }

  onMultiTapPress() {
    this.setState({
      numTaps: this.state.numTaps + 1
    });
  }

  onChangeTypeText(text) {
    if (text === 'passcode') {
      this.setState({
        greeting: 'Type Working'
      });
    } else {
      this.setState({
        typeText: text
      });
    }
  }

  onReplaceText(text) {
    if (text === 'replaced_text') {
      this.setState({
        greeting: 'Replace Working'
      });
    } else {
      this.setState({
        replaceText: text
      });
    }
  }

  onChangeClearText(text) {
    if (text === '') {
      this.setState({
        greeting: 'Clear Working'
      });
    } else {
      this.setState({
        clearText: text
      });
    }
  }

  onRefresh() {
    this.setState({
      isRefreshing: true
    });
    setTimeout(() => {
      this.setState({
        greeting: 'PullToReload Working'
      });
    }, 500);
  }

  onToggleScrollViewVisibility() {
    this.setState({
      showScrollOverlays: !this.state.showScrollOverlays,
    })
  }

  backHandler() {
    this.setState({
      backPressed: true
    });
    return true;
  };

}
