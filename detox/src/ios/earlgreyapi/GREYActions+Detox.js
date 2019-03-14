/**

	This code is generated.
	For more information see generation/README.md.
*/



class GREYActions {
  static detoxSetDatePickerDateWithFormat(dateString, dateFormat) {
    if (typeof dateString !== "string") throw new Error("dateString should be a string, but got " + (dateString + (" (" + (typeof dateString + ")"))));
    if (typeof dateFormat !== "string") throw new Error("dateFormat should be a string, but got " + (dateFormat + (" (" + (typeof dateFormat + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYActions"
      },
      method: "detoxSetDatePickerDate:withFormat:",
      args: [{
        type: "NSString",
        value: dateString
      }, {
        type: "NSString",
        value: dateFormat
      }]
    };
  }

}

module.exports = GREYActions;