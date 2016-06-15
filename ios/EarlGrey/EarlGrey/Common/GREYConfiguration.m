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

#import "Common/GREYConfiguration.h"

#import "Additions/NSString+GREYAdditions.h"

NSString *const kGREYConfigKeyAnalyticsEnabled = @"GREYConfigKeyAnalyticsEnabled";
NSString *const kGREYConfigKeyActionConstraintsEnabled = @"GREYConfigKeyActionConstraintsEnabled";
NSString *const kGREYConfigKeyInteractionTimeoutDuration =
    @"GREYConfigKeyInteractionTimeoutDuration";
NSString *const kGREYConfigKeySynchronizationEnabled = @"GREYConfigKeySynchronizationEnabled";
NSString *const kGREYConfigKeyNSTimerMaxTrackableInterval =
    @"GREYConfigKeyNSTimerMaxTrackableInterval";
NSString *const kGREYConfigKeyCALayerModifyAnimations = @"GREYConfigKeyCALayerModifyAnimations";
NSString *const kGREYConfigKeyCALayerMaxAnimationDuration =
    @"GREYConfigKeyCALayerMaxAnimationDuration";
NSString *const kGREYConfigKeyURLBlacklistRegex = @"GREYConfigKeyURLBlacklistRegex";
NSString *const kGREYConfigKeyVerboseLogging = @"GREYConfigKeyVerboseLogging";
NSString *const kGREYConfigKeyDispatchAfterMaxTrackableDelay =
    @"GREYConfigKeyDispatchAfterMaxTrackableDelay";
NSString *const kGREYConfigKeyDelayedPerformMaxTrackableDuration =
    @"GREYConfigKeyDelayedPerformMaxTrackableDuration";
NSString *const kGREYConfigKeyIncludeStatusBarWindow = @"GREYConfigKeyIncludeStatusBarWindow";
NSString *const kGREYConfigKeyScreenshotDirLocation = @"GREYConfigKeyScreenshotDirLocation";

@implementation GREYConfiguration {
  NSMutableDictionary *_defaultConfiguration; // Dict for storing the default configs
  NSMutableDictionary *_overridenConfiguration; // Dict for storing the user-defined overrides
  NSMutableDictionary *_mergedConfiguration; // Dict for storing the merged default/overriden dicts
  BOOL _needsMerge; // Indicates whether the merged configuration was invalidated due to a change
                    // in the default or overriden configurations
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _defaultConfiguration = [[NSMutableDictionary alloc] init];
    _overridenConfiguration = [[NSMutableDictionary alloc] init];
    _mergedConfiguration = [[NSMutableDictionary alloc] init];
    _needsMerge = YES;

    NSArray *searchPaths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,
                                                               NSUserDomainMask,
                                                               YES);
    NSAssert(searchPaths.count > 0, @"Couldn't find a valid documents directory");
    [self setDefaultValue:searchPaths.firstObject forConfigKey:kGREYConfigKeyScreenshotDirLocation];
    [self setDefaultValue:@YES forConfigKey:kGREYConfigKeyAnalyticsEnabled];
    [self setDefaultValue:@YES forConfigKey:kGREYConfigKeyActionConstraintsEnabled];
    [self setDefaultValue:@(30.0) forConfigKey:kGREYConfigKeyInteractionTimeoutDuration];
    [self setDefaultValue:@(10.0) forConfigKey:kGREYConfigKeyCALayerMaxAnimationDuration];
    [self setDefaultValue:@YES forConfigKey:kGREYConfigKeySynchronizationEnabled];
    [self setDefaultValue:@(1.5) forConfigKey:kGREYConfigKeyNSTimerMaxTrackableInterval];
    [self setDefaultValue:@YES forConfigKey:kGREYConfigKeyCALayerModifyAnimations];
    [self setDefaultValue:[NSNull null] forConfigKey:kGREYConfigKeyURLBlacklistRegex];
    [self setDefaultValue:@NO forConfigKey:kGREYConfigKeyVerboseLogging];
    [self setDefaultValue:@(1.5) forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
    [self setDefaultValue:@NO forConfigKey:kGREYConfigKeyIncludeStatusBarWindow];
    [self setDefaultValue:@(1.5) forConfigKey:kGREYConfigKeyDelayedPerformMaxTrackableDuration];
  }
  return self;
}

+ (id)sharedInstance {
  static GREYConfiguration *sharedInstance = nil;
  static dispatch_once_t token = 0;

  dispatch_once(&token, ^{
    sharedInstance = [[GREYConfiguration alloc] init];
  });

  return sharedInstance;
}

- (void)setValue:(id)value forConfigKey:(NSString *)configKey {
  [self grey_validateConfigKey:configKey];
  @synchronized(self) {
    [_overridenConfiguration setObject:(value ? value : [NSNull null]) forKey:configKey];
    _needsMerge = YES;
  }
}

- (void)setDefaultValue:(id)value forConfigKey:(NSString *)configKey {
  @synchronized(self) {
    [_defaultConfiguration setObject:value forKey:configKey];
    _needsMerge = YES;
  }
}

- (id)valueForConfigKey:(NSString *)configKey {
  [self grey_validateConfigKey:configKey];
  id value;
  @synchronized(self) {
    if (_needsMerge) {
      [_mergedConfiguration removeAllObjects];
      [_mergedConfiguration addEntriesFromDictionary:_defaultConfiguration];
      [_mergedConfiguration addEntriesFromDictionary:_overridenConfiguration];
      _needsMerge = NO;
    }
    value = [_mergedConfiguration objectForKey:configKey];
  }

  if (!value) {
    [NSException raise:@"NSUnknownKeyException" format:@"Unknown configuration key: %@", configKey];
  }
  return ([value isEqual:[NSNull null]] ? nil : value);
}

- (BOOL)boolValueForConfigKey:(NSString *)configKey {
  return [[self valueForConfigKey:configKey] boolValue];
}

- (NSInteger)intValueForConfigKey:(NSString *)configKey {
  return [[self valueForConfigKey:configKey] integerValue];
}

- (double)doubleValueForConfigKey:(NSString *)configKey {
  return [[self valueForConfigKey:configKey] doubleValue];
}

- (NSString *)stringValueForConfigKey:(NSString *)configKey {
  NSString *value = [self valueForConfigKey:configKey];

  if (value && ![value isKindOfClass:[NSString class]]) {
    [NSException raise:NSInternalInconsistencyException
                format:@"%@'s value type %@ is not of type NSString.", configKey, [value class]];
  }

  return value;
}

- (void)reset {
  @synchronized(self) {
    [_overridenConfiguration removeAllObjects];
    [_mergedConfiguration removeAllObjects];
    _needsMerge = YES;
  }
}

#pragma mark - Private

/**
 *  Validates the given @c configKey.
 *
 *  @param configKey The config key to be validated.
 *
 *  @throws NSException If its not a valid key.
 */
- (void)grey_validateConfigKey:(NSString *)configKey {
  if (![configKey grey_isNonEmptyAfterTrimming]) {
    [NSException raise:NSInvalidArgumentException
                format:@"Configuration keys cannot be empty strings or nil."];
  }
}

@end
