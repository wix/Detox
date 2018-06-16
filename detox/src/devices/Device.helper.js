const _ = require('lodash');
const configurationsMock = require('../configurations.mock');

const validScheme = configurationsMock.validOneDeviceAndSession;
const invalidDeviceNoBinary = configurationsMock.invalidDeviceNoBinary;
const invalidDeviceNoDeviceName = configurationsMock.invalidDeviceNoDeviceName;

let fs;
let DeviceDriverBase;
let SimulatorDriver;
let Device;
let device;
let argparse;
let sh;

let Client;
let client;


 

async function prepareClient() {

        jest.mock('fs');
        fs = require('fs');
    
        Device = require('./Device');
    
        jest.mock('../utils/sh');
        sh = require('../utils/sh');
        sh.cp = jest.fn();
    
        jest.mock('../client/Client');
        jest.mock('../utils/argparse');
        argparse = require('../utils/argparse');
    
        jest.mock('./DeviceDriverBase');
        DeviceDriverBase = require('./DeviceDriverBase');
        SimulatorDriver = require('./SimulatorDriver');
        Client = require('../client/Client');
    
        client = new Client(validScheme.session);
        await client.connect();
    }


  

function  validDevice() {
    await prepareClient();
    const device = new Device(validScheme.configurations['ios.sim.release'], validScheme.session, new DeviceDriverBase(client));
    fs.existsSync.mockReturnValue(true);
    device.deviceDriver.defaultLaunchArgsPrefix.mockReturnValue('-');
    device.deviceDriver.acquireFreeDevice.mockReturnValue('mockDeviceId');

    return device;
  }


module.exports = { prepareClient, validDevice}