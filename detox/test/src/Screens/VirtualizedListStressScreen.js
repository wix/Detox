import _ from 'lodash';
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  TouchableOpacity
} from 'react-native';

function Block({ children }) {
  const subBlocks = _.times(30, (i) => (
    <SubBlock>{i + 1}</SubBlock>
  ));

  return (
    <View style={styles.block}>
      {subBlocks}
    </View>
  );
}

function SubBlock({ children }) {
  return (
    <View style={styles.subBlock}>
      <Text style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

export default class VirtualizedListStressScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ready: false
    };
  }

  componentDidMount() {
    this.setState({
      ready: true
    })
  }

  render() {
    if (!this.state.ready) {
      return <View testID={'stub'} />;
    }

    const blocks = _.times(30, () => (<Block />));

    return (
      <ScrollView testID={'stressContainer'}
                  contentContainerStyle={styles.container}
                  windowSize={4}
                  maxToRenderPerBatch={4}>
        {blocks}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    borderColor: 'red',
    borderWidth: 1,
    borderStyle: 'solid',
    paddingTop: 40,
  },
  block: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'silver',
    marginVertical: 10,
    padding: 10,
  },
  subBlock: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    margin: 10,
    padding: 10,
  },
  text: {
    textAlign: 'center',
    fontSize: 20,
  },
})
