const _ = require('lodash');
var object = {
    'name': 'ABC',
    'os': 'ios',
    'osVersion': '12'
};
const arr = ['name', 'os', 'osVersion'];
console.log(_.pick(object, arr));

// console.log(Object.keys(object).every(ele => arr.includes(ele)));
// console.log(Object.keys(object), arr);
const arr1 = ["video", "cloudDeviceLogs", "cloudNetworkLogs"];

var plugins = {
    
};

plugins = arr1.reduce((acc, curr) => {
    const enabled = _.get(acc, `${curr}.enabled`);
    if (acc[curr]) {
        acc[curr] = {
            'enabled': enabled
        };
    }
    else {
        acc[curr] = {
            'enabled': curr === 'video' ? true : false
        };
    }
    return acc;
}, plugins);

console.log(plugins);