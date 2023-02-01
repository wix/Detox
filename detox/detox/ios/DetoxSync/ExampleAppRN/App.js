
import React, {Component} from 'react';
import {AppRegistry, StyleSheet, View, Text, Button} from 'react-native';

console.disableYellowBox = true;

export default class ReactNativeTesterApp extends Component
{
	constructor(props)
	{
		super(props);
		this.slowJSTimer = null;
		this.slowBridgeTimer = null;
		this.state = {counter: 0};
	}
	
	_performTask()
	{
		let counter = 0;
		for(let i = 0; i < Math.pow(2, 25); i++)
		{
			counter++;
		}
	}
	
	_startSlowJSTimer()
	{
		console.log("Slowing CPU!");
		this._performTask();
		this.slowJSTimer = setTimeout(() => {
									  this._startSlowJSTimer();
									  }, 3500);
	}
	
	_startBusyBridgeTimer()
	{
		if(this.state.counter == 200)
		{
			this.clearBusyBridgeTimeout();
			return;
		}
		
		this.setState({counter: this.state.counter + 1}, () => {
					  this.slowBridgeTimer = setTimeout(() => {
														this._startBusyBridgeTimer();
														}, 30);
					  });
	}
	
	onSlowJSThread()
	{
		if(this.slowJSTimer)
		{
			clearTimeout(this.slowJSTimer);
			this.slowJSTimer = null;
		}
		else
		{
			this._startSlowJSTimer();
		}
	}
	
	clearBusyBridgeTimeout()
	{
		clearTimeout(this.slowBridgeTimer);
		this.slowBridgeTimer = null;
	}
	
	onBusyBridge()
	{
		if(this.slowBridgeTimer)
		{
			this.clearBusyBridgeTimeout();
		}
		else
		{
			this.setState({counter: 0}, () => {
						  this._startBusyBridgeTimer();
						  });
		}
	}
	
	onNetwork()
	{
		fetch('https://jsonplaceholder.typicode.com/photos')
		.then(function(response)
			  {
			  return response.json();
			  })
		.then(function(myJson)
			  {
			  let count = 0;
			  for(img of myJson)
			  {
			  fetch(img["thumbnailUrl"])
			  .then(function(response) {
					console.log("Got an image");
					});
			  count+=1;
			  if(count >= 50) { return; }
			  }
			  });
	}
	
	render()
	{
		return (
				<View style={styles.container}>
				<Button title="Slow JS Thread"    style={styles.button} onPress={() => this.onSlowJSThread()} />
				<Button title="Busy Bridge"     style={styles.button} onPress={() => this.onBusyBridge()} />
				<Text>Counter: {this.state.counter}</Text>
				<Button title="Network Requests"   style={styles.button} onPress={() => this.onNetwork()} />
				</View>
				);
	}
	
	componentDidMount()
	{
		setTimeout(function() {
				   console.log("⏲ 1");

				   setTimeout(function() {
							  console.log("⏲ 1");
							  }, 750);

				   }, 750);
	}
}

const styles = StyleSheet.create({
								 container: {
								 flex: 1,
								 justifyContent: 'center',
								 alignItems: 'center',
								 backgroundColor: '#F5FCFF',
								 },
								 button: {
								 height: 40,
								 justifyContent: 'center'
								 },
								 buttonText: {
								 fontSize: 20,
								 textAlign: 'center',
								 margin: 10,
								 },
								 });

//import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue.js';
//
//const spyFunction = (msg) => {
//	global.nativeLoggingHook(JSON.stringify(msg));
//};
//
//MessageQueue.spy(spyFunction);
