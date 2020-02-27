//
//  XCTestConfiguration.h
//  Detox
//
//  Created by Leo Natan (Wix) on 11/3/19.
//

@interface XCTestConfiguration : NSObject <NSSecureCoding, NSCopying>

+ (instancetype)activeTestConfiguration;

@property(copy) NSString *productModuleName;
@property(copy) NSString *targetApplicationBundleID;
@property(copy) NSString *targetApplicationPath;

@end
