//
//  NSObject+DontCrash.h
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@interface NSObject (DontCrash)

- (id)_dtx_text;
- (id)_dtx_placeholder;

@end

NS_ASSUME_NONNULL_END
