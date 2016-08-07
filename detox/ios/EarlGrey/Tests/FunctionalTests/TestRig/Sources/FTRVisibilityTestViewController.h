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

// View controller used for visibility checker tests.
@interface FTRVisibilityTestViewController : UIViewController

@property(retain, nonatomic) IBOutlet UIView *translucentOverlappingView;
@property(retain, nonatomic) IBOutlet UILabel *translucentLabel;
@property(retain, nonatomic) IBOutlet UIButton *button;
@property(retain, nonatomic) IBOutlet UIView *activationPointCover;

@end
