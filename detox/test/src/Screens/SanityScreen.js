import _ from 'lodash';
import React, { useCallback, useState, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  SortableList,
  View,
  TouchableOpacity,
  Text,
  Icon,
  Assets,
  Colors,
  Button,
} from 'react-native-ui-lib';

// const data = _.times(30, (index) => {
//   let text = `${index}`;
//   if (index === 3) {
//     text = 'Locked item';
//   }
//
//   return {
//     text,
//     id: `${index}`,
//     locked: index === 3,
//   };
// });
//
// const SortableListScreen = () => {
//   const [items, setItems] = useState(data);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [removedItems, setRemovedItems] = useState([]);
//   const orderedItems = useRef(data);
//
//   const toggleItemSelection = useCallback((item) => {
//     if (selectedItems.includes(item)) {
//       setSelectedItems(selectedItems.filter((selectedItem) => ![item.id].includes(selectedItem.id)));
//     } else {
//       setSelectedItems(selectedItems.concat(item));
//     }
//   }, [selectedItems, setSelectedItems]);
//
//   const addItem = useCallback(() => {
//     if (removedItems.length > 0) {
//       orderedItems.current = orderedItems.current.concat(removedItems[0]);
//       setItems(orderedItems.current);
//       setRemovedItems(removedItems.slice(1));
//     }
//   }, [removedItems, setItems, setRemovedItems]);
//
//   const removeSelectedItems = useCallback(() => {
//     setRemovedItems(removedItems.concat(selectedItems));
//     setSelectedItems([]);
//     orderedItems.current = orderedItems.current.filter((item) => !selectedItems.includes(item));
//     setItems(orderedItems.current);
//   }, [setRemovedItems, removedItems, selectedItems, setItems, setSelectedItems]);
//
//   const keyExtractor = useCallback((item) => {
//     return `${item.id}`;
//   }, []);
//
//   const onOrderChange = useCallback((newData) => {
//     console.log('New order:', newData);
//     orderedItems.current = newData;
//   }, []);
//
//   const renderItem = useCallback(({ item, index }) => {
//     const isSelected = selectedItems.includes(item);
//     const { locked } = item;
//     const Container = locked ? View : TouchableOpacity;
//     return (
//       <Container
//         style={[styles.itemContainer, isSelected && styles.selectedItemContainer]}
//         onPress={() => toggleItemSelection(item)}
//         centerV
//         centerH={locked}
//         paddingH-page
//       >
//         <View flex row spread centerV>
//           {!locked && <Icon source={Assets.icons.demo.drag} tintColor={Colors.$iconDisabled} />}
//           <Text center $textDefault={!locked} $textNeutralLight={locked}>
//             {item.text}
//           </Text>
//           {!locked && <Icon source={Assets.icons.demo.chevronRight} tintColor={Colors.$iconDefault} />}
//         </View>
//       </Container>
//     );
//   }, [selectedItems, toggleItemSelection]);
//
//   return (
//     <View flex bg-$backgroundDefault>
//       <View row center marginB-s2>
//         <Button label="Add Item" size={Button.sizes.xSmall} disabled={removedItems.length === 0} onPress={addItem} />
//         <Button
//           label="Remove Items"
//           size={Button.sizes.xSmall}
//           disabled={selectedItems.length === 0}
//           marginL-s3
//           onPress={removeSelectedItems}
//         />
//       </View>
//       <View flex useSafeArea>
//         <SortableList
//           flexMigration
//           data={items}
//           renderItem={renderItem}
//           keyExtractor={keyExtractor}
//           onOrderChange={onOrderChange}
//           scale={1.02}
//         />
//       </View>
//     </View>
//   );
// };
//
// export default SortableListScreen;
// const styles = StyleSheet.create({
//   itemContainer: {
//     height: 52,
//     borderColor: Colors.$outlineDefault,
//     borderBottomWidth: 1,
//   },
//   selectedItemContainer: {
//     borderLeftColor: Colors.$outlinePrimary,
//     borderLeftWidth: 5,
//   },
// });




export default function Example(props) {
  const data = Array.from({length: 10}, (_, index) => {
    let text = `${index}`;
    if (index === 3) {
      text = 'Locked item';
    }

    return {
      text,
      id: `${index}`,
      locked: index === 3
    };
  });

  const renderItem = useCallback(({item, index: _index}) => {
    const {locked} = item;
    return (
      <View
        style={{height: 52, borderColor: Colors.$outlineDefault, borderBottomWidth: 1}}
        centerV
        centerH={locked}
        paddingH-10
      >
        <View flex row spread centerV>
          {!locked && <Icon source={Assets.icons.demo.drag} tintColor={Colors.$iconDisabled}/>}
          <Text center $textDefault={!locked} $textNeutralLight={locked}>
            {item.text}
          </Text>
          {!locked && <Icon source={Assets.icons.demo.chevronRight} tintColor={Colors.$iconDefault}/>}
        </View>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item) => {
    return `${item.id}`;
  }, []);

  return (
    <View>
      <SortableList
        data={data}
        flexMigration
        onOrderChange={() => {}}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </View>
  );
}
