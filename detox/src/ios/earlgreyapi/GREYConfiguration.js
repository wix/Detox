/**

	This code is generated.
	For more information see generation/README.md.
*/



class GREYConfiguration {
  /*@return The singleton GREYConfiguration instance.
*/static sharedInstance() {
    return {
      target: {
        type: "Class",
        value: "GREYConfiguration"
      },
      method: "sharedInstance",
      args: []
    };
  }

  /*If a user-configured value is associated with the given @c configKey, it is returned,
otherwise the default value is returned. If a default value is not found, or an
NSInvalidArgumentException is raised.

@param configKey The key whose value is being queried. Must be a valid @c NSString.

@throws NSInvalidArgumentException If no value could be found associated with @c configKey.

@return The value for the configuration stored associate with @c configKey.
*/static valueForConfigKey(element, configKey) {
    if (typeof configKey !== "string") throw new Error("configKey should be a string, but got " + (configKey + (" (" + (typeof configKey + ")"))));
    return {
      target: element,
      method: "valueForConfigKey:",
      args: [{
        type: "NSString",
        value: configKey
      }]
    };
  }

  /*If a user-configured value is associated with the given @c configKey, it is returned, otherwise
the default value is returned. If a default value is not found, NSInvalidArgumentException is
raised.

@param configKey The key whose value is being queried. Must be a valid @c NSString.

@throws NSInvalidArgumentException If no value could be found for the given @c configKey.

@return The @c BOOL value for the configuration associated with @c configKey.
*/static boolValueForConfigKey(element, configKey) {
    if (typeof configKey !== "string") throw new Error("configKey should be a string, but got " + (configKey + (" (" + (typeof configKey + ")"))));
    return {
      target: element,
      method: "boolValueForConfigKey:",
      args: [{
        type: "NSString",
        value: configKey
      }]
    };
  }

  /*If a user-configured value is associated with the given @c configKey, it is returned, otherwise
the default value is returned. If a default value is not found, NSInvalidArgumentException is
raised.

@param configKey The key whose value is being queried. Must be a valid @c NSString.

@throws NSInvalidArgumentException If no value could be found for the given @c configKey.

@return The integer value for the configuration associated with @c configKey.
*/static integerValueForConfigKey(element, configKey) {
    if (typeof configKey !== "string") throw new Error("configKey should be a string, but got " + (configKey + (" (" + (typeof configKey + ")"))));
    return {
      target: element,
      method: "integerValueForConfigKey:",
      args: [{
        type: "NSString",
        value: configKey
      }]
    };
  }

  /*If a user-configured value is associated with the given @c configKey, it is returned, otherwise
the default value is returned. If a default value is not found, NSInvalidArgumentException is
raised.

@param configKey The key whose value is being queried. Must be a valid @c NSString.

@throws NSInvalidArgumentException If no value could be found for the given @c configKey.

@return The @c double value for the configuration associated with @c configKey.
*/static doubleValueForConfigKey(element, configKey) {
    if (typeof configKey !== "string") throw new Error("configKey should be a string, but got " + (configKey + (" (" + (typeof configKey + ")"))));
    return {
      target: element,
      method: "doubleValueForConfigKey:",
      args: [{
        type: "NSString",
        value: configKey
      }]
    };
  }

  /*Resets all configurations to default values, removing all the configured values.

@remark Any default values added by calling GREYConfiguration:setDefaultValue:forConfigKey:
are not reset.
*/static reset(element) {
    return {
      target: element,
      method: "reset",
      args: []
    };
  }

  /*Given a value and a key that identifies a configuration, set the value of the configuration.
Overwrites any previous value for the configuration.

@remark To restore original values, call GREYConfiguration::reset.

@param value     The configuration value to be set. Scalars should be wrapped in @c NSValue.
@param configKey Key identifying an existing or new configuration. Must be a valid @c NSString.
*/static setValueForConfigKey(element, value, configKey) {
    if (typeof configKey !== "string") throw new Error("configKey should be a string, but got " + (configKey + (" (" + (typeof configKey + ")"))));
    return {
      target: element,
      method: "setValue:forConfigKey:",
      args: [value, {
        type: "NSString",
        value: configKey
      }]
    };
  }

  /*Associates configuration identified by @c configKey with the provided @c value.

@remark Default values persist even after resetting the configuration
(using GREYConfiguration::reset)

@param value     The configuration value to be set. Scalars should be wrapped in @c NSValue.
@param configKey Key identifying an existing or new configuration. Must be a valid @c NSString.
*/static setDefaultValueForConfigKey(element, value, configKey) {
    if (typeof configKey !== "string") throw new Error("configKey should be a string, but got " + (configKey + (" (" + (typeof configKey + ")"))));
    return {
      target: element,
      method: "setDefaultValue:forConfigKey:",
      args: [value, {
        type: "NSString",
        value: configKey
      }]
    };
  }

}

module.exports = GREYConfiguration;