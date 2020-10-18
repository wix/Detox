import React, { Component } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default class WebViewScreen extends Component {
  render() {
    // const debugSource = require('../assets/html/test.html');
    // const releaseSourcePrefix = Platform.OS === 'android' ? 'file:///android_asset' : './assets';
    // const releaseSource = { uri: `${releaseSourcePrefix}/assets/html/test.html` };
    // const webViewSource = Image.resolveAssetSource(global.__DEV__ ? debugSource : releaseSource);
    return (
      <View style={{flex: 1}}>
        <WebView testID={'webview_1'} source={{html: webpageSource}}/>
      </View>
    );
  }
}

const webpageSource = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=320, user-scalable=yes">
</head>
<body>
<style>
span.a {
  display: inline; /* the default for span */
  width: 100px;
  height: 100px;
  padding: 5px;
  border: 1px solid blue;
  background-color: yellow;
}

span.b {
  display: inline-block;
  width: 100px;
  height: 100px;
  padding: 5px;
  border: 1px solid blue;
  background-color: yellow;
}

span.c {
  display: block;
  width: 100px;
  height: 100px;
  padding: 5px;
  border: 1px solid blue;
  background-color: yellow;
}

#cssSelector {
  background-color: yellow;
}


</style>
<h1 id="testingh1">Testing Heading1</h1>

<div id="spacer" style="height:600px;"></div>
<a id="cssSelector" href="http://www.disney.com">disney.com</a>

<div id="testingDiv">
    <div id="testingDiv2">
        <div id="testingDiv3">
            <div id="testingDiv4">
                <div id="testingDiv5">
                    <div id="testingDiv6">
                        <div id="testingDiv7">
                            <div id="testingDiv8">
                                <h1 id="testingh1-2">Testing Heading2</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<span class="a">Aa</span>
<span class="b">Ba</span>
<span class="c">Ca</span>
<input type="text" id="textInput" placeholder="type something"/><br>
<input type="button" value="Change Text" onclick="changeText()" id="changeTextBtn"/><br>
<p id="testingPar">Message</p>

<div id="spacer2" style="height:2000px;"></div>

<input type="text" id="textInput2" placeholder="Second Input"/><br>

<div id="testingDiv9">
    <h2 id="testingh1-1">Xpath</h2>
</div>
<script>
    function changeText() {
        var typedText = document.getElementById('textInput').value;
        document.getElementById('testingPar').innerHTML=typedText;
    }
</script>

</body>
</html>`
