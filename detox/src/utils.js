var __cachedDetoxArgs = null;

// returns undefined if not found
function _getArgValue(key) {
    var result = undefined;

    if (__cachedDetoxArgs == null) {
        const argv = process.argv.map(str => str.toLowerCase());

        __cachedDetoxArgs = argv.filter(el => el.startsWith('--___detoxargs___:::'))[0];
        if (__cachedDetoxArgs === undefined) {
            return undefined;
        }

        __cachedDetoxArgs = __cachedDetoxArgs.split(':::')[1].split(' ');
    }

    __cachedDetoxArgs.filter(e => e.startsWith(key))
        .forEach(e => {
            if (e.startsWith(key + '=')) {
                result = e.split('=')[1];
            }
            else if (e === key) {
                result = true;
            }
        });

    return result;
}

module.exports = {
    getArgValue: _getArgValue
};
