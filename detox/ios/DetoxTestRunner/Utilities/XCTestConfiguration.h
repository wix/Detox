//
//  XCTestConfiguration.h
//  Detox
//
//  Created by Alon Haiut on 11/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

@interface XCTestConfiguration : NSObject <NSSecureCoding, NSCopying>

+ (instancetype)activeTestConfiguration;

@property(copy) NSString *productModuleName;
@property(copy) NSString *targetApplicationBundleID;
@property(copy) NSString *targetApplicationPath;

@end

