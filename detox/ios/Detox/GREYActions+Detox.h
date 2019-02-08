//
//  GREYActions+Detox.h
//  Detox
//
//  Created by Matt Findley on 2/7/19.
//  Copyright © 2019 Wix. All rights reserved.
//

@import Foundation;
#import <EarlGrey/EarlGrey.h>

@interface GREYActions (Detox)

+ (id<GREYAction>)detoxSetDatePickerDateIOSOnly:(NSString *)dateString withFormat:(NSString *)dateFormat;

@end
