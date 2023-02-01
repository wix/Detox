#import <Foundation/Foundation.h>

@protocol Protocol <NSObject> @end

@interface Foo : NSObject
- (void)fooMethod;
@end

@interface Bar : Foo; @end;

@interface Baz : NSObject <Protocol>
+ (void)bazClassMethod;
- (void)bazInstanceMethod;
@end
