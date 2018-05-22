/**

	This code is generated.
	For more information see generation/README.md.
*/



class GREYConfiguration {
  static enableSynchronization(element) {
    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "enableSynchronization",
      args: []
    };
  }

  static disableSynchronization(element) {
    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "disableSynchronization",
      args: []
    };
  }

}

module.exports = GREYConfiguration;