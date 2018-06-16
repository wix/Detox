const _ = require('lodash');

const errors = {
  EMPTY_STRING: `pasteboard doesn't have string value`,
  STRING_NOT_EQUAL: `value is not equal to pasteboard string value`,
  EMPTY_IMAGE : `pasteboard have not image`,
  EMPTY_COLOR : `pasteboard have not color`,
  EMPTY_URL : `pasteboard have not URL value`,
  URL_NOT_EQUAL : `URL is not equal to pasteboard URL value`
}

class PasteboardInfo {
  constructor(data) {
    this._currentData = data;
  }
  async toHaveString(value) {
    if (_.isEmpty(this._currentData.pbString)) {
      throw new Error(errors.EMPTY_STRING);
    }
    if (!_.isEqual(this._currentData.pbString, value)) {
      throw new Error(errors.STRING_NOT_EQUAL);
    }  
  }
  async toHaveImage() {
    if (_.isEmpty(this._currentData.pbImage)) {
      throw new Error(errors.EMPTY_IMAGE);
    }
  }
  async toHaveColor() {
    if (_.isEmpty(this._currentData.pbColor)) {
      throw new Error(errors.EMPTY_COLOR);
    }
  }
  async toHaveURL(value) {
    if (_.isEmpty(this._currentData.pbString)) {
      throw new Error(errors.EMPTY_URL);
    }
    if (!_.isEqual(this._currentData.pbString, value)) {
      throw new Error(errors.URL_NOT_EQUAL);
    } 
  }
}

module.exports = {
    PasteboardInfo,
    errors
};