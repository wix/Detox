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

#import "Core/GREYAutomationSetup.h"

#include <dlfcn.h>
#include <execinfo.h>
#include <signal.h>

#import "Additions/XCTestCase+GREYAdditions.h"
#import "Common/GREYDefines.h"
#import "Common/GREYExposed.h"

@implementation GREYAutomationSetup

+ (instancetype)sharedInstance {
  static GREYAutomationSetup *sharedInstance = nil;
  static dispatch_once_t token = 0;
  dispatch_once(&token, ^{
    sharedInstance = [[GREYAutomationSetup alloc] initOnce];
  });
  return sharedInstance;
}

- (instancetype)initOnce {
  self = [super init];
  return self;
}

- (void)perform {
  Class selfClass = [self class];
  [selfClass grey_setupCrashHandlers];
  // Force software keyboard.
  [[UIKeyboardImpl sharedInstance] setAutomaticMinimizationEnabled:NO];
  // Showing accessibility inspector turns on accessibility for the AUT.
  [selfClass grey_setEnableAccessibilityInspector:YES];
  // Turn off auto correction as it inteferes with typing on iOS8.2+.
  if (iOS8_2_OR_ABOVE()) {
    [selfClass grey_modifyKeyboardSettings];
  }

  // Setup performed aboves leaves unwanted traces (such as the accessibility inspector)
  // lingering around after all tests finish.
  // Register to perform cleanup task right after the first test case ends. After much trial and
  // error, this approach seems to work nicer than atexit and xctestobservation. atexit isn't
  // reliable and gets called multiple times and using xctestobservation mysteriously eats up some
  // of the logs.
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(grey_tearDown:)
                                               name:kGREYXCTestCaseInstanceDidFinish
                                             object:nil];
}

#pragma mark - Automation Setup

// Enables (or disables) the accessibility inspector which is required for using any properties of
// the accessibility tree.
+ (void)grey_setEnableAccessibilityInspector:(BOOL)enabled {
  NSString *accessibilitySettingsPrefBundlePath =
      @"/System/Library/PreferenceBundles/AccessibilitySettings.bundle/AccessibilitySettings";
  NSString *accessibilityControllerClassName = @"AccessibilitySettingsController";
  id accessibilityControllerInstance =
      [self grey_settingsClassInstanceFromBundleAtPath:accessibilitySettingsPrefBundlePath
                                         withClassName:accessibilityControllerClassName];
  [accessibilityControllerInstance setAXInspectorEnabled:@(enabled) specifier:nil];
}

// Modifies the autocorrect and predictive typing settings to turn them off through the
// keyboard settings bundle.
+ (void)grey_modifyKeyboardSettings {
  NSString *keyboardSettingsPrefBundlePath =
      @"/System/Library/PreferenceBundles/KeyboardSettings.bundle/KeyboardSettings";
  NSString *keyboardControllerClassName = @"KeyboardController";
  id keyboardControllerInstance =
      [self grey_settingsClassInstanceFromBundleAtPath:keyboardSettingsPrefBundlePath
                                         withClassName:keyboardControllerClassName];
  [keyboardControllerInstance setAutocorrectionPreferenceValue:@(NO) forSpecifier:nil];
  [keyboardControllerInstance setPredictionPreferenceValue:@(NO) forSpecifier:nil];
}

// For the provided settings bundle path, we use the actual name of the controller
// class to extract and return a class instance that can be modified.
+ (id)grey_settingsClassInstanceFromBundleAtPath:(NSString *)path
                                   withClassName:(NSString *)className {
  NSParameterAssert(path);
  NSParameterAssert(className);
  char const *const preferenceBundlePath = [path fileSystemRepresentation];
  void *handle = dlopen(preferenceBundlePath, RTLD_LAZY);
  if (!handle) {
    NSAssert(NO, @"dlopen couldn't open settings bundle at path bundle %@", path);
  }

  Class klass = NSClassFromString(className);
  if (!klass) {
    NSAssert(NO, @"Couldn't find %@ class", klass);
  }

  id klassInstance = [[klass alloc] init];
  if (!klassInstance) {
    NSAssert(NO, @"Couldn't initialize controller for class: %@", klass);
  }

  return klassInstance;
}

#pragma mark - Crash Handlers

// Call only asynchronous-safe functions within signal handlers
// See definition here: https://www.securecoding.cert.org/confluence/display/seccode/BB.+Definitions
static void grey_signalHandler(int signal) {
  char *signalString = strsignal(signal);
  write(STDERR_FILENO, signalString, strlen(signalString));
  write(STDERR_FILENO, "\n", 1);
  static const int kMaxStackSize = 128;
  void *callStack[kMaxStackSize];
  const int numFrames = backtrace(callStack, kMaxStackSize);
  backtrace_symbols_fd(callStack, numFrames, STDERR_FILENO);
  kill(getpid(), SIGKILL);
}

static void grey_uncaughtExceptionHandler(NSException *exception) {
  NSLog(@"Uncaught exception: %@", exception);
  exit(-1);
}

static void grey_installSignalHandler(int signalId, struct sigaction *handler) {
  int returnValue = sigaction(signalId, handler, NULL);
  if (returnValue != 0) {
    NSLog(@"Error installing %s handler: '%s'.", strsignal(signalId), strerror(errno));
  }
}

+ (void) grey_setupCrashHandlers {
  NSLog(@"Crash handler setup started.");

  struct sigaction signalActionHandler;
  memset(&signalActionHandler, 0, sizeof(signalActionHandler));
  int result = sigemptyset(&signalActionHandler.sa_mask);
  if (result != 0) {
    NSLog(@"Unable to empty sa_mask. Return value:%d", result);
    exit(-1);
  }
  signalActionHandler.sa_handler = &grey_signalHandler;

  // Register the signal handlers.
  grey_installSignalHandler(SIGQUIT, &signalActionHandler);
  grey_installSignalHandler(SIGILL, &signalActionHandler);
  grey_installSignalHandler(SIGTRAP, &signalActionHandler);
  grey_installSignalHandler(SIGABRT, &signalActionHandler);
  grey_installSignalHandler(SIGFPE, &signalActionHandler);
  grey_installSignalHandler(SIGBUS, &signalActionHandler);
  grey_installSignalHandler(SIGSEGV, &signalActionHandler);
  grey_installSignalHandler(SIGSYS, &signalActionHandler);

  // Register the handler for uncaught exceptions.
  NSSetUncaughtExceptionHandler(&grey_uncaughtExceptionHandler);

  NSLog(@"Crash handlers setup complete.");
}

#pragma mark - Test observation

// Called on tear down of any xctest.
- (void)grey_tearDown:(NSNotification *)note {
  [[self class] grey_setEnableAccessibilityInspector:NO];
  // Stop observing after one-time setup.
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:kGREYXCTestCaseInstanceDidFinish
                                                object:nil];
}

@end
