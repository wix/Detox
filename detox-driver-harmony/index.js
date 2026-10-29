const HarmonyExpect = require('./src/HarmonyExpect');
const HarmonyAttachedAllocDriver = require('./src/HarmonyAllocDriver');
const HarmonyRuntimeDriver = require('./src/HarmonyRuntimeDriver');

module.exports = {
  DeviceAllocationDriverClass: HarmonyAttachedAllocDriver,
  RuntimeDriverClass: HarmonyRuntimeDriver,
  ExpectClass: HarmonyExpect,
};
