const pIteration = require('p-iteration');

function forEachSeriesObj(objMap, callback, _this) {
  return pIteration.forEachSeries(Object.keys(objMap), ((key) => {
    const obj = objMap[key];
    return callback(obj, key);
  }), _this);
}

module.exports = {
  ...pIteration,
  forEachSeriesObj,
};
