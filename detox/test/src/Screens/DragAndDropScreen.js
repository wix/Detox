import React, {Component} from 'react'
import {Dimensions, Image, StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native'
import {DragSortableView} from 'react-native-drag-sort'
const {width} = Dimensions.get('window')

const parentWidth = width
const childrenWidth = width
const childrenHeight = 48

let testData = []
for (let i = 0; i < 10; i++) {
  testData.push({txt: `Cell number ${i+1}`, testID: `cellId_${i}`},);
}

export default class DragAndDropScreen extends Component {

  constructor(props) {
    super(props);

    this.state = {
      data: testData,
      scrollEnabled: true,
    }
  }

  render() {
    return (
      <SafeAreaView style={{backgroundColor: '#fff',flex: 1}}>
        <ScrollView
          ref={(scrollView)=> this.scrollView = scrollView}
          scrollEnabled = {this.state.scrollEnabled}
          style={styles.container}>
          <DragSortableView
            dataSource={this.state.data}
            parentWidth={parentWidth}
            childrenWidth= {childrenWidth}
            childrenHeight={childrenHeight}
            scaleStatus={'scaleY'}
            onDragStart={(startIndex,endIndex)=>{
              this.setState({
                scrollEnabled: false
              })
            }}
            onDragEnd={(startIndex)=>{
              this.setState({
                scrollEnabled: true
              })
            }}
            onDataChange = {(data)=>{
              if (data.length != this.state.data.length) {
                this.setState({
                  data: data
                })
              }
            }}
            keyExtractor={(item,index)=> item.testID}
            onClickItem={(data,item,index)=>{
              // Don't do anything, just an example
            }}
            renderItem={(item,index)=>{
              return this.renderItem(item,index)
            }}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }

  renderItem(item,index) {
    return (
      <View style={styles.item} testID={item.testID}>
        <View style={styles.item_children}>
          <Text style={styles.item_text}>{item.txt}</Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  item: {
    width: childrenWidth,
    height: childrenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item_children: {
    width: childrenWidth,
    height: childrenHeight-8,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  item_text: {
    color: '#344feb',
    marginLeft: 12,
    fontSize: 20
  }
})