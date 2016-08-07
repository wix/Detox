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

#import "FTRPickerViewController.h"

@implementation FTRPickerViewController

@synthesize customPicker;
@synthesize datePicker;
@synthesize datePickerSegmentedControl;
@synthesize customColumn1Array;
@synthesize customColumn2Array;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
  self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
  if (self) {
    customColumn1Array = [[NSMutableArray alloc] init];
    customColumn2Array = [[NSMutableArray alloc] init];
    customColumn1Array = @[@"Red", @"Green", @"Blue", @"Hidden"];
    customColumn2Array = @[@"1", @"2", @"3", @"4", @"5"];
  }
  return self;
}

- (instancetype)init {
  NSAssert(NO, @"Invalid Initializer");
  return nil;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  [self.customPicker setHidden:YES];
  [self.datePicker setHidden:YES];

  self.datePicker.accessibilityIdentifier = @"DatePickerId";
  self.customPicker.accessibilityIdentifier = @"CustomPickerId";
  self.dateLabel.accessibilityIdentifier = @"DateLabelId";
  self.clearLabelButton.accessibilityIdentifier = @"ClearDateLabelButtonId";

  [datePicker addTarget:self
                 action:@selector(datePickerValueChanged:)
       forControlEvents:UIControlEventValueChanged];
}

- (void)datePickerValueChanged:(id)sender {
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  dateFormatter.dateFormat = @"YYYY/MM/dd";
  self.dateLabel.text = [dateFormatter stringFromDate:datePicker.date];
}

- (IBAction)clearDateLabelButtonTapped:(id)sender {
  self.dateLabel.text = @"";
}

- (IBAction)valueChanged:(id)sender {
  [datePicker setHidden:YES];
  [customPicker setHidden:YES];
  NSInteger selectedSegment = datePickerSegmentedControl.selectedSegmentIndex;

  switch (selectedSegment) {
    case 0:
      datePicker.datePickerMode = UIDatePickerModeDate;
      [datePicker setHidden:NO];
      break;
    case 1:
      datePicker.datePickerMode = UIDatePickerModeTime;
      [datePicker setHidden:NO];
      break;
    case 2:
      datePicker.datePickerMode = UIDatePickerModeDateAndTime;
      [datePicker setHidden:NO];
      break;
    case 3:
      datePicker.datePickerMode = UIDatePickerModeCountDownTimer;
      [datePicker setHidden:NO];
      break;
    case 4:
      [customPicker setHidden:NO];
      break;
  }
}

#pragma mark - UIPickerViewDataSource Protocol

- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView {
  return 2;
}

- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent :(NSInteger)component {
  switch (component) {
    case 0:
      return (NSInteger)[customColumn1Array count];
      break;
    case 1:
      return (NSInteger)[customColumn2Array count];
      break;
    default:
      NSAssert(NO, @"shouldn't be here");
      break;
  }
  return 0;
}

#pragma mark - UIPickerViewDelegate Protocol

- (NSString *)pickerView:(UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(NSInteger)component {
  switch (component) {
    case 0:
      return [customColumn1Array objectAtIndex:(NSUInteger)row];
      break;
    case 1:
      return [customColumn2Array objectAtIndex:(NSUInteger)row];
      break;
  }
  return nil;
}

- (CGFloat)pickerView:(UIPickerView *)pickerView rowHeightForComponent:(NSInteger)component {
  return 30;
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UIView *)view {
  UILabel *columnView =
      [[UILabel alloc] initWithFrame:CGRectMake(35, 0, self.view.frame.size.width/3 - 35, 30)];
  columnView.text = [self pickerView:pickerView titleForRow:row forComponent:component];
  columnView.textAlignment = NSTextAlignmentCenter;

  return columnView;
}

- (void)pickerView:(UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(NSInteger)component {
  // If Hidden is selected, hide picker.
  if (component == 0 && [customColumn1Array[(NSUInteger)row] isEqualToString:@"Hidden"]) {
    [customPicker setHidden:YES];
  }
}

@end
