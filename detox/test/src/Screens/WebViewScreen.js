import React from 'react';
import {Button, View} from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebViewScreen() {
    const [is2ndWebViewVisible, setIs2ndWebViewVisible] = React.useState(false);
    const [is3rdWebViewVisible, setIs3rdWebViewVisible] = React.useState(false);

    return (
        <View style={{flex: 1, flexDirection: 'column'}}>
            <View style={{
                flex: 2,
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                backgroundColor: '#edf6ff'
            }}>
                <View style={{flex: 1}}>
                    <Button
                        testID={'toggle2ndWebviewButton'}
                        title={is2ndWebViewVisible ? 'Hide 2nd webview' : 'Show 2nd webview'}
                        onPress={() => setIs2ndWebViewVisible(!is2ndWebViewVisible)}
                    />
                </View>
                <View style={{flex: 1}}>
                    <Button
                        testID={'toggle3rdWebviewButton'}
                        title={is3rdWebViewVisible ? 'Hide 3rd webview' : 'Show 3rd webview'}
                        onPress={() => setIs3rdWebViewVisible(!is3rdWebViewVisible)}
                    />
                </View>
            </View>
            <View style={{flex: 7, flexDirection: 'column'}}>
                <View style={{flex: 5}}>
                    <WebView
                      testID={'webViewFormWithScrolling'}
                      source={{html: webViewFormWithScrolling}}
                    />
                </View>
                {is2ndWebViewVisible && (
                    <View style={{flex: 5}}>
                        <WebView
                          testID={'webView'}
                          source={{html: dummyWebView}}
                          scrollEnabled={false}
                        />
                    </View>
                )}
                {is3rdWebViewVisible && (
                    <View style={{flex: 7}}>
                        <WebView
                          testID={'webView'}
                          originWhitelist={['*']}
                          source={{html: iframeWebView}}
                          scrollEnabled={false}
                          allowUniversalAccessFromFileURLs={true}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

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

            input[type=text], input[type=email] {
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

            .specialParagraph {
              margin-top: 1000px;
              color: blue;
              font-size: 20px;
            }

            .contentEditable {
              margin: 20px;
              padding: 10px;
              border: 1px solid grey;
            }
        </style>
    </head>
    <body>
        <h1 id="pageHeadline">First Webview</h1>
        <h2>Form</h2>
        <form>
            <label for="fname">Your name:</label><br>
            <input type="text" id="fname" name="fname" maxlength="10"><br>
            <input type="submit" id="submit" value="Submit" onclick="document.getElementById('resultFname').innerHTML = document.getElementById('fname').value; return false;">
        </form>

        <h2>Form Results</h2>
        <p>Your first name is: <span id="resultFname">No input yet</span></p>

        <h2>Content Editable</h2>
        <div id="contentEditable" class='contentEditable' contenteditable="true">Name: </div>

        <h2>Text and link</h2>
        <p>Some text and a <a id="w3link" href="https://www.w3schools.com">link</a>.</p>
        <p id="bottomParagraph" class="specialParagraph">This is a bottom paragraph with class.</p>
    </body>
</html>
`;

const dummyWebView = `
<!DOCTYPE html>
<html>
    <head>
        <title>Dummy Webview</title>
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
        <p id="message">This is a dummy webview.</p>
    </body>
</html>
`;

const iframeWebView = `
<!DOCTYPE html>
<html>
    <head>
        <title>Inline Frame Webview</title>
        <meta name="viewport" content="width=320, user-scalable=no">
        <style>
            body {
              background-color: #b9e0ff;
              font-family: Arial, sans-serif;
              font-size: 16px;
              padding: 20px;
              text-align: center;
            }

            iframe {
              border: 1px solid #000;
              background-color: #fff;
            }
        </style>
    </head>
    <body>
        <p id="message">This is a webview with an inline frame inside.</p>
        <iframe
            id="iframe"
            src="http://localhost:9001/hello-world.html"
            width="95%"
            height="150">
        </iframe>
    </body>
</html>
`;
