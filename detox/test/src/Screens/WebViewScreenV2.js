import React, { Component } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default class WebViewScreenV2 extends Component {
  render() {
    return (
        <View style={{flex: 1,flexDirection: 'column' ,backgroundColor:'blue'}}>
          <View style={{flex: 5}}>
            <WebView testID={'webViewFormWithScrolling'} source={{html: webViewFormWithScrolling}}/>
          </View>
          <View style={{flex: 5}}>
            <WebView testID={'dummyWebView'} source={{html: dummyWebView}} scrollEnabled={false}/>
          </View>
        </View>
    );
  }
}

// HTML content for the form with scrolling, for testing purposes.
const webViewFormWithScrolling = `
<!DOCTYPE html>
<html>
    <head>
        <title>First Webview</title>
        <meta name="viewport" content="width=320, user-scalable=no">
        <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 16px;
              margin: 0;
              padding: 0;
            }
            form {
              margin: 20px;
            }
            input[type=text] {
              width: 100%;
              padding: 12px 20px;
              margin: 8px 0;
              box-sizing: border-box;
            }
            input[type=submit] {
              background-color: #4CAF50;
              color: white;
              padding: 14px 20px;
              margin: 8px 0;
              border: none;
              cursor: pointer;
              width: 100%;
            }
            input[type=submit]:hover {
              background-color: #45a049;
            }
            p, h1, h2 {
              margin: 20px;
            }
            h1 {
              margin-top: 50px;
            }
            .specialParagraph {
              margin-top: 200px;
              color: blue;
              font-size: 20px;
            }
        </style>
    </head>
    <body>
        <h1 id="pageHeadline">First Webview</h1>
        <h2>Form</h2>
        <form>
            <label for="fname">Your name:</label><br>
            <input type="text" id="fname" name="fname"><br>
            <input type="submit" id="submit" value="Submit" onclick="document.getElementById('resultFname').innerHTML = document.getElementById('fname').value; return false;">
        </form>

        <h2>Form Results</h2>
        <p>Your first name is: <span id="resultFname">No input yet</span></p>

        <h2>Text and link</h2>
        <p>Some text and a <a href="https://www.w3schools.com">link</a>.</p>
        <p class="specialParagraph" id="bottomParagraph">This is a paragraph with class.</p>
    </body>
</html>
`;

// HTML content for the dummy webview, for testing purposes.
const dummyWebView = `
<!DOCTYPE html>
<html>
    <head>
        <title>Second Webview</title>
        <meta name="viewport" content="width=320, user-scalable=no">
        <style>
            body {
              background-color: #b9e0ff;
              font-family: Arial, sans-serif;
              font-size: 16px;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
            }
        </style>
    </head>
    <body>
        <p id="secondWebview">
            This is the second webview
        </p>
    </body>
</html>
`;
