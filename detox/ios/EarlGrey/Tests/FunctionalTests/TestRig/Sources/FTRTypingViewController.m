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

#import "FTRTypingViewController.h"

#define kFTRKeyboardTypeCount 11

@implementation FTRTypingViewController {
  UIKeyboardType _keyboardTypeArray[kFTRKeyboardTypeCount];
}

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
  self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
  if (self) {
    _keyboardTypeStringArray = @[@"Default",
                                 @"ASCIICapable",
                                 @"NumbersAndPunctuation",
                                 @"URL",
                                 @"NumberPad",
                                 @"PhonePad",
                                 @"NamePhonePad",
                                 @"EmailAddress",
                                 @"DecimalPad",
                                 @"Twitter",
                                 @"WebSearch"];
    NSAssert([_keyboardTypeStringArray count] == kFTRKeyboardTypeCount,
             @"count must be kFTRKeyboardTypeCount");
    _keyboardTypeArray[0] = UIKeyboardTypeDefault;
    _keyboardTypeArray[1] = UIKeyboardTypeASCIICapable;
    _keyboardTypeArray[2] = UIKeyboardTypeNumbersAndPunctuation;
    _keyboardTypeArray[3] = UIKeyboardTypeURL;
    _keyboardTypeArray[4] = UIKeyboardTypeNumberPad;
    _keyboardTypeArray[5] = UIKeyboardTypePhonePad;
    _keyboardTypeArray[6] = UIKeyboardTypeNamePhonePad;
    _keyboardTypeArray[7] = UIKeyboardTypeEmailAddress;
    _keyboardTypeArray[8] = UIKeyboardTypeDecimalPad;
    _keyboardTypeArray[9] = UIKeyboardTypeTwitter;
    _keyboardTypeArray[10] = UIKeyboardTypeWebSearch;
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  self.dismissKeyboardButton =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                    target:self
                                                    action:@selector(dismissKeyboard)];

  self.textField.delegate = self;
  self.textField.isAccessibilityElement = YES;
  self.textField.userInteractionEnabled = YES;
  self.textField.accessibilityIdentifier = @"TypingTextField";
  self.textField.autocorrectionType = UITextAutocorrectionTypeYes;

  self.nonTypingTextField.delegate = self;
  self.nonTypingTextField.isAccessibilityElement = YES;
  self.nonTypingTextField.userInteractionEnabled = YES;
  self.nonTypingTextField.accessibilityIdentifier = @"NonTypingTextField";

  self.textView.delegate = self;
  self.textView.isAccessibilityElement = YES;
  self.textView.userInteractionEnabled = YES;
  self.textView.accessibilityIdentifier = @"TypingTextView";
  self.textView.autocorrectionType = UITextAutocorrectionTypeYes;

  self.keyboardPicker.accessibilityIdentifier = @"KeyboardPicker";
}

- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField {
  return textField != self.nonTypingTextField;
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
  [textField resignFirstResponder];
  return NO;
}

- (void)textViewDidBeginEditing:(UITextView *)textView {
  self.navigationItem.rightBarButtonItem = self.dismissKeyboardButton;
}

- (void)dismissKeyboard {
  [self.textView resignFirstResponder];
  self.navigationItem.rightBarButtonItem = nil;
}

- (void)resetState {
  self.textField.text = @"";
  if ([self.textField isFirstResponder]) {
    [self.textField resignFirstResponder];
  }
  self.textView.text = @"";
  if ([self.textView isFirstResponder]) {
    [self.textView resignFirstResponder];
  }
}

- (IBAction)changeReturnKeyType:(id)sender {
  [self resetState];
  self.textField.returnKeyType = [self nextReturnKeyTypeFor:self.textField.returnKeyType];
  self.textView.returnKeyType =  [self nextReturnKeyTypeFor:self.textView.returnKeyType];
}

- (UIReturnKeyType)nextReturnKeyTypeFor:(UIReturnKeyType)type {
  switch (type) {
    case UIReturnKeyDefault:
      return UIReturnKeyGo;
    case UIReturnKeyGo:
      return UIReturnKeyGoogle;
    case UIReturnKeyGoogle:
      return UIReturnKeyJoin;
    case UIReturnKeyJoin:
      return UIReturnKeyNext;
    case UIReturnKeyNext:
      return UIReturnKeyRoute;
    case UIReturnKeyRoute:
      return UIReturnKeySearch;
    case UIReturnKeySearch:
      return UIReturnKeySend;
    case UIReturnKeySend:
      return UIReturnKeyYahoo;
    case UIReturnKeyYahoo:
      return UIReturnKeyDone;
    case UIReturnKeyDone:
      // The Emergency Call key is no longer accessible starting from iOS 9.1. Therefore, we move
      // to the Continue key that has to be present after iOS 9.0.
      if (([UIDevice currentDevice].systemVersion.floatValue > 9.0)) {
#if defined(__IPHONE_9_0) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_9_0)
        return UIReturnKeyContinue;
#endif
      } else {
        return UIReturnKeyEmergencyCall;
      }
    case UIReturnKeyEmergencyCall:
      return UIReturnKeyDefault;
#if defined(__IPHONE_9_0) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_9_0)
    case UIReturnKeyContinue:
      return UIReturnKeyContinue;
#endif
  }
}

#pragma mark - UIPickerViewDataSource Protocol

- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView {
  return 1;
}

- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent :(NSInteger)component {
  if (component == 0) {
    return (NSInteger)[_keyboardTypeStringArray count];
  }
  NSAssert(NO, @"invalid component number");
  return 0;
}

- (NSString *)pickerView:(UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(NSInteger)component {
  if (component == 0) {
    return _keyboardTypeStringArray[(NSUInteger)row];
  }
  NSAssert(NO, @"invalid component number");
  return nil;
}

#pragma mark - UIPickerViewDelegate Protocol

- (CGFloat)pickerView:(UIPickerView *)pickerView rowHeightForComponent:(NSInteger)component {
  return 30;
}

- (void)pickerView:(UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(NSInteger)component {
  NSAssert(0 <= row && row < kFTRKeyboardTypeCount, @"invalid row");
  [self resetState];
  self.textField.keyboardType = _keyboardTypeArray[row];
  self.textView.keyboardType = _keyboardTypeArray[row];
}

@end
