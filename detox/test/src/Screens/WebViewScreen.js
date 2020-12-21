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
        <View style={{flex: 1,flexDirection: 'column' ,backgroundColor:'blue'}}>
          <View style={{flex: 8}}>
            <WebView testID={'webview_1'} source={{html: webpageSource}}/>
          </View>
          <View style={{flex: 1}}>
            <WebView testID={'webview_2'} source={{html: webpageSource2}} scrollEnabled={false}/>
          </View>
        </View>

    );
  }
}

const webpageSource2 = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=320, user-scalable=no">
</head>
  <body>
  <p>Second Webview</p>
  </body>
</html>
`;

const webpageSource = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=320, user-scalable=no">
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
npm

</style>
<h1 id="testingh1">Testing <mark>Heading1</mark></h1>

<div id="spacer" style="height:600px;"></div>
<a id="cssSelector" href="http://www.disney.com">disney.com</a>

<div id="root" style="min-height:80px;">
   <div class="QiJxn LG3cc _2KPOx" dir="ltr" data-id="rce">
      <style id="dynamicStyles"></style>
      <div class="Tux6h _2N_hG">
         <div class="DraftEditor-root">
            <div class="DraftEditor-editorContainer">
               <div aria-autocomplete="list" aria-describedby="placeholder-editor" aria-expanded="false" class="notranslate public-DraftEditor-content has-custom-focus" contenteditable="true" role="combobox" spellcheck="true" style="outline: none; user-select: text; white-space: pre-wrap; overflow-wrap: break-word;">
                  <div data-contents="true">
                     <div class="jwLWP _2hXa7 public-DraftStyleDefault-block-depth0 public-DraftStyleDefault-text-ltr" data-block="true" data-editor="editor" data-offset-key="00000-0-0">
                        <div data-offset-key="00000-0-0" class="public-DraftStyleDefault-block public-DraftStyleDefault-ltr"><span data-offset-key="00000-0-0"><span data-text="true">Rich Content Test</span></span></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</div>

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

<input name="sec_input" type="text" id="textInput2" placeholder="Second Input"/><br>

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
