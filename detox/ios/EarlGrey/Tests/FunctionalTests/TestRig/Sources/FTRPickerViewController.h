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

@interface FTRPickerViewController : UIViewController <UIPickerViewDelegate, UIPickerViewDataSource>

@property(nonatomic, retain) IBOutlet UIPickerView *customPicker;
@property(nonatomic, retain) IBOutlet UIDatePicker *datePicker;
@property(nonatomic, retain) IBOutlet UISegmentedControl *datePickerSegmentedControl;
@property(nonatomic, retain) IBOutlet UIButton *clearLabelButton;
@property(weak, nonatomic) IBOutlet UILabel *dateLabel;

@property(retain, nonatomic) NSArray *customColumn1Array;
@property(retain, nonatomic) NSArray *customColumn2Array;

@end
