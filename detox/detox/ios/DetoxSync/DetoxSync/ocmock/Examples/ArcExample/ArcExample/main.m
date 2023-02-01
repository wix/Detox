
#import <Foundation/Foundation.h>
#import <OCMock/OCMock.h>

@protocol SomeDelegateProtocol
- (void)doStuff;
@end

@interface SomeClass : NSObject
@property (nonatomic, weak) id<SomeDelegateProtocol> delegate;
@end

@implementation SomeClass

@synthesize delegate;

@end


int main (int argc, const char * argv[])
{

    @autoreleasepool {
        
        SomeClass *someObject = [[SomeClass alloc] init];
        id delegate = [OCMockObject mockForProtocol:@protocol(SomeDelegateProtocol)];
        someObject.delegate = delegate;
        NSLog(@"delegate = %@", delegate);
        NSLog(@"someObject = %@", someObject.delegate);
        
    }
    return 0;
}

