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
import ImgToBase64 from 'react-native-image-base64';

const { NativeModule } = NativeModules;

export default class PasteBoardScreen extends Component {

  constructor(props) {
    super(props)
    this.state = {
        stringValue : undefined,
        urlValue : undefined,
        choosenImage : undefined,
        choosenColor : undefined
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
    var message = "Pasteboard haven't any result"
    if (this.state.stringValue != undefined) {
        NativeModule.clipValueToPasteboard({string : this.state.stringValue});
        message = "Pasteboard have string : " + this.state.stringValue
    }
    if (this.state.urlValue != undefined) {
        NativeModule.clipValueToPasteboard({ url : this.state.urlValue});
        message = "Pasteboard have url : " + this.state.urlValue
    }
    if (this.state.choosenImage != undefined) {
      ImgToBase64.getBase64String(this.state.choosenImage)
        .then(base64String => NativeModule.clipValueToPasteboard({image : base64String}))
        .catch(err => Alert.alert(err));
      
      message = "Pasteboard have image : " + this.state.choosenImage
    }
    if (this.state.choosenColor != undefined) {
        NativeModule.clipValueToPasteboard({color : processColor(this.state.choosenColor)});
        message = "Pasteboard have color : " + this.state.choosenColor
    }
    window.alert(message)
    this.restoreValues()
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
    return (
      <View style={styles.container} >
        <Text style = {styles.titleText}> Set some string: </Text>
        <TextInput testID = "stringValueInput"
             style = {styles.stringTF}
             placeholder = {'set string...'}
             autoCorrect = {false}
             onChangeText={this.setTextString}
             value={this.state.stringValue}
         />
         <Text style = {styles.titleText}> Choose image: </Text>
         <View style = {styles.collectionImages}>
            <TouchableOpacity style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, '../assets/11.png')
            }}>
               <Image source={require('../assets/11.png')} />
            </TouchableOpacity>
            <TouchableOpacity style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, 'Superman icon')
            }}>
              <Image source={require('../assets/22.jpg')} />
            </TouchableOpacity>
            <TouchableOpacity style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, 'Star icon')
            }}>
              <Image source={require('../assets/33.png')} style={{width:100,height:100}} /> 
            </TouchableOpacity>
            <TouchableOpacity style = {styles.imageButton} onPress = {(e) => {
                this.setImage(e, 'Girl icon')
            }}>
              <Image source={require('../assets/44.png')} />
            </TouchableOpacity>
         </View>
         <Text style = {styles.titleText}> Set some url: </Text>
         <TextInput
             style = {styles.urlTF}
             placeholder = {'set url...'}
             autoCorrect = {false}
             onChangeText={this.setUrlValue}
             value={this.state.urlValue}
         />
         <Text style = {styles.titleText}> Choose some color: </Text>
         <View style = {styles.collectionImages}>
            <TouchableOpacity style = {{height : 100,flex : 1,backgroundColor:'red'}} onPress = {(e) => {
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
