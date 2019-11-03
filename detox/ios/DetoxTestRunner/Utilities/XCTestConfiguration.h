//
//  XCTestConfiguration.h
//  Detox
//
//  Created by Leo Natan (Wix) on 11/3/19.
//

@interface XCTestConfiguration : NSObject <NSSecureCoding, NSCopying>

+ (instancetype)activeTestConfiguration;

@property(copy) NSString *productModuleName; // @synthesize productModuleName=_productModuleName;
@property(copy) NSString *targetApplicationBundleID; // @synthesize targetApplicationBundleID=_targetApplicationBundleID;
@property(copy) NSString *targetApplicationPath; // @synthesize targetApplicationPath=_targetApplicationPath;

@end
