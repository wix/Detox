import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  TouchableOpacity,
  Image,
  NativeModules,
  processColor,
  Alert
} from 'react-native';
import CheckingScreen from './CheckingScreen'

const { NativeModule } = NativeModules;
const batmanImage = 'data:image/jpeg;base64,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'
const boyImage = 'http://img.draugas.lt/forumas/veidukai/973676.gif'
const redPandaImage = 'https://orig00.deviantart.net/ee08/f/2009/073/e/d/free_red_panda_icon_100x100_by_supertuffpinkpuff.png'
const supermanImage = 'https://a.facdn.net/1484483600/perkalator445.gif'//'http://it.avatarstock.com/img/Superman-Logo_5194.jpg'

export default class PasteboardScreen extends Component {

  constructor(props) {
    super(props)
    this.state = {
        stringValue : undefined,
        urlValue : undefined,
        choosenImage : undefined,
        choosenColor : undefined,
        screen : undefined
    }
    this.setTextString = this.setTextString.bind(this);
    this.setUrlValue = this.setUrlValue.bind(this);
    this.setImage = this.setImage.bind(this);
    this.setColor = this.setColor.bind(this);
    this.onPressCheckButton = this.onPressCheckButton.bind(this)
    this.restoreValues = this.restoreValues.bind(this)
  }

  setTextString(text) {
    this.setState({
        stringValue : text
    })
  }

  setUrlValue(url) {
    this.setState({
       urlValue : url
    })
  }

  setImage(event, imagePath) {
    this.setState({
        choosenImage : imagePath,
     })
  }
  
  setColor(event, color) {
    this.setState({
        choosenColor : color
     })
  }

  onPressCheckButton() {
    if (this.state.stringValue != undefined) {
        NativeModule.clipValueToPasteboard({string : this.state.stringValue});
    }
    if (this.state.urlValue != undefined) {
        NativeModule.clipValueToPasteboard({ url : this.state.urlValue});
    }
    if (this.state.choosenImage != undefined) {
      NativeModule.clipValueToPasteboard({image : this.state.choosenImage})
    }
    if (this.state.choosenColor != undefined) {
        NativeModule.clipValueToPasteboard({color : processColor(this.state.choosenColor)});
    }
    this.restoreValues()
    this.setState({ screen : CheckingScreen })
  }

  restoreValues() {
    this.setState({
        stringValue : undefined,
        urlValue : undefined,
        choosenImage : undefined,
        choosenColor : undefined
    })
  }

  render() {
    if (this.state.screen) {
      const PasteBoardScreen = this.state.screen;
      return <PasteBoardScreen />;
    }
    return (
      <View style={styles.container} >
        <Text style = {styles.titleText}> Set some string: </Text>
        <TextInput  testID = "stringValueInput"
             style = {styles.stringTF}
             placeholder = {'set string...'}
             autoCorrect = {false}
             onChangeText={this.setTextString}
             value={this.state.stringValue}
         />
         <Text style = {styles.titleText}> Choose image: </Text>
         <View style = {styles.collectionImages}>
            <TouchableOpacity testID = "testImageValue" style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, batmanImage)
            }}>
               <Image style = {{width : 100, height:100}} source={{uri : batmanImage}} />
            </TouchableOpacity>
            <TouchableOpacity style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, boyImage)
            }}>
              <Image style = {{width : 100, height:100}} source={{uri : boyImage}} />
            </TouchableOpacity>
            <TouchableOpacity style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, redPandaImage)
            }}>
              <Image style={{width:100,height:100}} source={{uri : redPandaImage}} /> 
            </TouchableOpacity>
            <TouchableOpacity style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, supermanImage)
            }}>
              <Image style={{width:100,height:100}} source={{ uri : supermanImage}} />
            </TouchableOpacity>
         </View>
         <Text style = {styles.titleText}> Set some url: </Text>
         <TextInput
             testID = "testURLValue"
             style = {styles.urlTF}
             placeholder = {'set url...'}
             autoCorrect = {false}
             onChangeText={this.setUrlValue}
             value={this.state.urlValue}
         />
         <Text style = {styles.titleText}> Choose some color: </Text>
         <View style = {styles.collectionImages}>
            <TouchableOpacity testID = "testColorValue" style = {{height : 100,flex : 1,backgroundColor:'red'}} onPress = {(e) => {
                this.setColor(e, 'red')
            }}/>
            <TouchableOpacity style = {{height : 100,flex : 1,backgroundColor:'yellow'}} onPress = {(e) => {
                this.setColor(e, 'yellow')
            }}/>
            <TouchableOpacity style = {{height : 100,flex : 1,backgroundColor:'blue'}} onPress = {(e) => {
                this.setColor(e, 'blue')
            }}/>
            <TouchableOpacity style = {{height : 100,flex : 1,backgroundColor:'green'}} onPress = {(e) => {
                this.setColor(e, 'green')
            }}/>
         </View>
        <Button
            testID = "CheckButton" 
            onPress = {this.onPressCheckButton}
            title = "Check Pasteboard Value" > 
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  titleText : {
    padding : 20,
    fontWeight: 'bold',
    fontSize : 16,
  },
  stringTF : {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width : 100,
  },
  urlTF : {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width : 100,
  },
  collectionImages : {
    marginLeft : 10,
    marginRight :10,
    flexDirection : 'row'
  },
  imageButton : {
    height : 100,
    flex : 1,
  },
});
