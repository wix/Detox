import AsyncStorage from '@react-native-async-storage/async-storage';

const SET_AND_GET_ITERATIONS = 50;
const GLOBAL_ITERATIONS = 4;

export async function runStressTest() {
  for (let globalCount = 1, keyCount = 10;
        globalCount <= GLOBAL_ITERATIONS;
        globalCount++, keyCount += 10) {
    console.log(`Storage@Stress Global iteration #${globalCount}`);
    await AsyncStorage.clear();

    for (let iterCount = 0; iterCount < SET_AND_GET_ITERATIONS; iterCount++) {
      await _setAndGetGeneratedData(keyCount);
    }
  }
}

async function _setAndGetGeneratedData(keyCount) {
  await _storeGeneratedData(keyCount);
  await _getAllData();
}

async function _storeGeneratedData(keyCount) {
  for (let index = 0; index < keyCount; index++) {
    const key = `@key${index}`;
    const value = {
      index,
      text: `Greetings from your SSD! I'm the stored-value of ${key} :-)`,
    };
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
}

async function _getAllData() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiGet(keys)
}
