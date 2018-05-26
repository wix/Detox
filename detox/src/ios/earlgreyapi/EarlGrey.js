/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_uiDeviceOrientation(value) {
	const orientationMapping = {
		landscape: 3, // top at left side landscape
		portrait: 1 // non-reversed portrait
	};

	return orientationMapping[value];
} 
class EarlGreyImpl {
  /*Provides the file name and line number of the code that is calling into EarlGrey.
In case of a failure, the information is used to tell XCTest the exact line which caused
the failure so it can be highlighted in the IDE.

@param fileName   The name of the file where the failing code exists.
@param lineNumber The line number of the failing code.

@return An EarlGreyImpl instance, with details of the code invoking EarlGrey.
*/static invokedFromFileLineNumber(fileName, lineNumber) {
    if (typeof fileName !== "string") throw new Error("fileName should be a string, but got " + (fileName + (" (" + (typeof fileName + ")"))));
    if (typeof lineNumber !== "number") throw new Error("lineNumber should be a number, but got " + (lineNumber + (" (" + (typeof lineNumber + ")"))));
    return {
      target: {
        type: "Class",
        value: "EarlGreyImpl"
      },
      method: "invokedFromFile:lineNumber:",
      args: [{
        type: "NSString",
        value: fileName
      }, {
        type: "NSInteger",
        value: lineNumber
      }]
    };
  }

  /*Rotate the device to a given @c deviceOrientation. All device orientations except for
@c UIDeviceOrientationUnknown are supported. If a non-nil @c errorOrNil is provided, it will
be populated with the failure reason if the orientation change fails, otherwise a test failure
will be registered.

@param      deviceOrientation The desired orientation of the device.
@param[out] errorOrNil        Error that will be populated on failure. If @c nil, a test
failure will be reported if the rotation attempt fails.

@return @c YES if the rotation was successful, @c NO otherwise.
*/static rotateDeviceToOrientationErrorOrNil(element, deviceOrientation) {
    if (!["landscape", "portrait"].some(option => option === deviceOrientation)) throw new Error("deviceOrientation should be one of [landscape, portrait], but got " + deviceOrientation);
    return {
      target: element,
      method: "rotateDeviceToOrientation:errorOrNil:",
      args: [{
        type: "NSInteger",
        value: sanitize_uiDeviceOrientation(deviceOrientation)
      }]
    };
  }

  /*Dismisses the keyboard by resigning the first responder, if any. Will populate the provided
error if the first responder is not present or if the keyboard is not visible.

@param[out] errorOrNil Error that will be populated on failure. If @c nil, a test
failure will be reported if the dismissing fails.

@return @c YES if the dismissing of the keyboard was successful, @c NO otherwise.
*/static dismissKeyboardWithError(element) {
    return {
      target: element,
      method: "dismissKeyboardWithError:",
      args: []
    };
  }

}

module.exports = EarlGreyImpl;