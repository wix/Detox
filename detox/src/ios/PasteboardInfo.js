const _ = require('lodash');

class PasteboardInfo {
  constructor(data) {
    this._currentData = data;
  }
  async toHaveString(value) {
    if (_.isEmpty(this._currentData.pbString)) {
      throw new Error(`pasteboard doesn't have string value`);
    }
    if (!_.isEqual(this._currentData.pbString, value)) {
      throw new Error(`value is not equal to pasteboard string value`);
    }  
  }
  async toHaveImage() {
    if (_.isEmpty(this._currentData.pbImage)) {
      throw new Error(`pasteboard have not image`);
    }
  }
  async toHaveColor() {
    if (_.isEmpty(this._currentData.pbColor)) {
      throw new Error(`pasteboard have not color`);
    }
  }
  async toHaveURL(value) {
    if (_.isEmpty(this._currentData.pbString)) {
      throw new Error(`pasteboard have not URL value`);
    }
    if (!_.isEqual(this._currentData.pbString, value)) {
      throw new Error(`URL is not equal to pasteboard URL value`);
    } 
  }
}

module.exports = {
    PasteboardInfo,
};