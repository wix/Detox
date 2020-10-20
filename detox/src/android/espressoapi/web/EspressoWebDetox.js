/**

	This code is generated.
	For more information see generation/README.md.
*/



class EspressoWebDetox {
  static withElement(interaction, elementAtom) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.EspressoWebDetox"
      },
      method: "withElement",
      args: [{
        type: "Invocation",
        value: interaction
      }, {
        type: "Invocation",
        value: elementAtom
      }]
    };
  }

  static perform(interaction, action) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.EspressoWebDetox"
      },
      method: "perform",
      args: [{
        type: "Invocation",
        value: interaction
      }, {
        type: "Invocation",
        value: action
      }]
    };
  }

}

module.exports = EspressoWebDetox;