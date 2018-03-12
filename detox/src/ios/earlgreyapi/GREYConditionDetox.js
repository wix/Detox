/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_greyElementInteraction(value) {
	return {
		type: "Invocation",
		value
	};
} 
class GREYCondition {
  static detoxConditionForElementMatched(interaction) {
    if (typeof interaction !== "object") {
      throw new Error('interaction should be a GREYElementInteraction, but got ' + JSON.stringify(interaction));
    }

    return {
      target: {
        type: "Class",
        value: "GREYCondition"
      },
      method: "detoxConditionForElementMatched:",
      args: [sanitize_greyElementInteraction(interaction)]
    };
  }

  static detoxConditionForNotElementMatched(interaction) {
    if (typeof interaction !== "object") {
      throw new Error('interaction should be a GREYElementInteraction, but got ' + JSON.stringify(interaction));
    }

    return {
      target: {
        type: "Class",
        value: "GREYCondition"
      },
      method: "detoxConditionForNotElementMatched:",
      args: [sanitize_greyElementInteraction(interaction)]
    };
  }

}

module.exports = GREYCondition;