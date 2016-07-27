//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

/**
 *  @file GREYConfiguration.h
 *  @brief Interfaces for reading and configuring various EarlGrey behaviours.
 */

#import <EarlGrey/GREYDefines.h>
#import <Foundation/Foundation.h>

/**
 *  Configuration that enables or disables usage tracking for the framework.
 *
 *  Accepted values: @c BOOL (@c YES or @c NO)
 *  Default value: @c YES
 */
GREY_EXTERN NSString *const kGREYConfigKeyAnalyticsEnabled;

/**
 *  Configuration that enables or disables constraint checks before performing an action.
 *
 *  Accepted values: @c BOOL (@c YES or @c NO)
 *  Default value: @c YES
 */
GREY_EXTERN NSString *const kGREYConfigKeyActionConstraintsEnabled;

/**
 *  Configuration that holds timeout duration (in seconds) for action and assertions. Actions or
 *  assertions that are not scheduled within this time will fail due to timeout.
 *
 *  Accepted values: @c double (negative values shouldn't be used)
 *  Default value: 30.0
 */
GREY_EXTERN NSString *const kGREYConfigKeyInteractionTimeoutDuration;

/**
 *  Configuration that enables or disables synchronization for all actions and assertions.
 *  When disabled, actions and assertions DO NOT wait for the App to idle before proceeding.
 *
 *  Accepted values: @c BOOL (@c YES or @c NO)
 *  Default value: @c YES
 */
GREY_EXTERN NSString *const kGREYConfigKeySynchronizationEnabled;

/**
 *  Configuration for setting the max interval (in seconds) of non-repeating NSTimers that EarlGrey
 *  will automatically track.
 *
 *  Accepted values: @c double (negative values shouldn't be used)
 *  Default value: 1.5
 */
GREY_EXTERN NSString *const kGREYConfigKeyNSTimerMaxTrackableInterval;

/**
 *  Configuration for setting the max delay (in seconds) for dispatch_after calls that EarlGrey
 *  will automatically track. dispatch_after exceeding the specified time won't be tracked by the
 *  framework.
 *
 *  Accepted values: @c double (negative values shouldn't be used)
 *  Default value: 1.5
 */
GREY_EXTERN NSString *const kGREYConfigKeyDispatchAfterMaxTrackableDelay;

/**
 *  Configuration for setting the max duration (in seconds) for delayed executions on the
 *  main thread originating from any performSelector:afterDelay invocations that EarlGrey will
 *  automatically track.
 *
 *  Accepted values: @c double (negative values shouldn't be used)
 *  Default value: 1.5
 */
GREY_EXTERN NSString *const kGREYConfigKeyDelayedPerformMaxTrackableDuration;

/**
 *  Configuration that determines whether or not CALayer animations are modified. If @c YES, then
 *  cyclic animations are set to only run once, and animation duration is limited to a maximum
 *  of @c kGREYConfigKeyCALayerMaxAnimationDuration.
 *  @remark This should only be used if synchronization is disabled, since otherwise cyclic
 *          animations will cause EarlGrey to timeout and fail tests.
 *
 *  Accepted values: @c BOOL (@c YES or @c NO)
 *  Default value: @c YES
 */
GREY_EXTERN NSString *const kGREYConfigKeyCALayerModifyAnimations;

/**
 *  Configuration for setting max allowable animation duration (in seconds) for any CALayer based
 *  animation. Animations exceeding the specified time will have their duration truncated to value
 *  specified by this config.
 *
 *  Accepted values: @c double (negative values shouldn't be used)
 *  Default value: 5.0
 */
GREY_EXTERN NSString *const kGREYConfigKeyCALayerMaxAnimationDuration;

/**
 *  Configuration that holds a regular expression used to determine whether EarlGrey should
 *  synchronize with a web request made to a URL or not. EarlGrey will not synchronize with requests
 *  made to URLs matching the configured regular expression.
 *
 *  Accepted values: @c nil or any regex strings accepted by NSRegularExpression. The empty string
 *                   and @c nil indicate that EarlGrey must synchronize with all network URLs.
 *  Default value: @c nil (synchronize with all network URLs.).
 */
GREY_EXTERN NSString *const kGREYConfigKeyURLBlacklistRegex;

/**
 *  Configuration that enables/disables verbose logging (logs emitted by GREYLogV(...))
 *
 *  Accepted values: @c BOOL (@c YES or @c NO)
 *  Default value: NO
 */
GREY_EXTERN NSString *const kGREYConfigKeyVerboseLogging;

/**
 *  Configuration that enables/disables inclusion of status bar window in every operation performed
 *  by EarlGrey. By default, the status bar window is excluded from screenshots and UI hierarchy.
 *
 *  Accepted values: @c BOOL (@c YES or @c NO)
 *  Default value: NO
 */
GREY_EXTERN NSString *const kGREYConfigKeyIncludeStatusBarWindow;

/**
 *  Configuration for setting the default screenshot location. The value must be absolute path
 *  pointing to a directory where screenshots will be saved.
 *
 *  Accepted values: NSString containing valid absolute filepath
 *  Default value: Documents directory of the app under test
 */
GREY_EXTERN NSString *const kGREYConfigKeyScreenshotDirLocation;

/**
 *  Provides an interface for runtime configuration of EarlGrey's behavior.
 */
@interface GREYConfiguration : NSObject

/**
 *  @return The singleton GREYConfiguration instance.
 */
+ (id)sharedInstance;

/**
 *  If a user-configured value is associated with the given @c configKey, it is returned,
 *  otherwise the default value is returned, if a default value is not found, or an
 *  NSInvalidArgumentException is raised.
 *
 *  @param configKey The key whose value is being queried. It cannot be be @c nil or empty.
 *
 *  @throws NSInvalidArgumentException If no value could be found associated with @c configKey.
 *
 *  @return The value for the configuration stored associate with @c configKey.
 */
- (id)valueForConfigKey:(NSString *)configKey;

/**
 *  If a user-configured value is associated with the given @c configKey, it is returned, otherwise
 *  the default value is returned, if a default value is not found, NSInvalidArgumentException is
 *  raised. Configuration keys cannot be be empty strings or @c nil.
 *
 *  @param configKey The key whose value is being queried.
 *
 *  @throws NSInvalidArgumentException If no value could be found for the given @c configKey.
 *
 *  @return The @c BOOL value for the configuration associated with @c configKey.
 */
- (BOOL)boolValueForConfigKey:(NSString *)configKey;

/**
 *  If a user-configured value is associated with the given @c configKey, it is returned, otherwise
 *  the default value is returned, if a default value is not found, NSInvalidArgumentException is
 *  raised. Configuration keys cannot be be empty strings or @c nil.
 *
 *  @param configKey The key whose value is being queried.
 *
 *  @throws NSInvalidArgumentException If no value could be found for the given @c configKey.
 *
 *  @return The integer value for the configuration associated with @c configKey.
 */
- (NSInteger)intValueForConfigKey:(NSString *)configKey;

/**
 *  If a user-configured value is associated with the given @c configKey, it is returned, otherwise
 *  the default value is returned, if a default value is not found, NSInvalidArgumentException is
 *  raised. Configuration keys cannot be be empty strings or @c nil.
 *
 *  @param configKey The key whose value is being queried.
 *
 *  @throws NSInvalidArgumentException If no value could be found for the given @c configKey.
 *
 *  @return The @c double value for the configuration associated with @c configKey.
 */
- (double)doubleValueForConfigKey:(NSString *)configKey;

/**
 *  If a user-configured value associated with the given @c configKey, it is returned, otherwise
 *  the default value is returned, if a default value is not found, NSInvalidArgumentException is
 *  raised. Configuration keys cannot be be empty strings or @c nil.
 *
 *  @param configKey The key whose value is being queried.
 *
 *  @throws NSInvalidArgumentException If no value could be found for the given @c configKey.
 *
 *  @return The string value for the configuration associated with @c configKey.
 */
- (NSString *)stringValueForConfigKey:(NSString *)configKey;

/**
 *  Resets the configuration to default values, removing all configured values.
 */
- (void)reset;

/**
 *  Sets the configuration with key @c configKey to the provided @c value. Overwrites any default
 *  entry for @c configKey. To restore the default values, call reset method. Configuration keys
 *  cannot be be empty strings or @c nil.
 *
 *  @param value     The configuration value to be set.
 *  @param configKey The key with which the given @c value will be associated.
 */
- (void)setValue:(id)value forConfigKey:(NSString *)configKey;

/**
 *  Adds a default entry for configuration with key @c configKey set to provided @c value. Default
 *  values persist even after reset is called but may be overwritten by calling
 *  GREYConfiguration::setValue:forConfigKey: Configuration keys cannot be be empty strings or
 *  @c nil.
 *
 *  @param value     The configuration value to be set.
 *  @param configKey The key with which the given @c value will be associated.
 */
- (void)setDefaultValue:(id)value forConfigKey:(NSString *)configKey;

@end

/**
 *  @return Value of type @c id associated with the given @c __configName.
 */
#define GREY_CONFIG(__configName) \
  [[GREYConfiguration sharedInstance] valueForConfigKey:(__configName)]

/**
 *  @return @c BOOL associated with the given @c __configName.
 */
#define GREY_CONFIG_BOOL(__configName) \
  [[GREYConfiguration sharedInstance] boolValueForConfigKey:(__configName)]

/**
 *  @return NSInteger associated with the given @c __configName.
 */
#define GREY_CONFIG_INT(__configName) \
  [[GREYConfiguration sharedInstance] intValueForConfigKey:(__configName)]

/**
 *  @return @c double associated with the given @c __configName.
 */
#define GREY_CONFIG_DOUBLE(__configName) \
  [[GREYConfiguration sharedInstance] doubleValueForConfigKey:(__configName)]

/**
 *  @return NSString associated with the given @c __configName.
 */
#define GREY_CONFIG_STRING(__configName) \
  [[GREYConfiguration sharedInstance] stringValueForConfigKey:(__configName)]
