//
//  ProtocolTests.m
//  iOS5Example
//

#import <OCMock/OCMock.h>
#import "ProtocolTests.h"


@protocol AuthenticationServiceProtocol

- (void)loginWithEmail:(NSString *)email andPassword:(NSString *)password;

@end

@interface Foo : NSObject
{
    id<AuthenticationServiceProtocol> authService;
}

- (id)initWithAuthenticationService:(id<AuthenticationServiceProtocol>)anAuthService;
- (void)doStuff;

@end

@implementation Foo

- (id)initWithAuthenticationService:(id<AuthenticationServiceProtocol>)anAuthService
{
    self = [super init];
    authService = anAuthService;
    return self;
}

- (void)doStuff
{
    [authService loginWithEmail:@"x" andPassword:@"y"];
}

@end

@implementation ProtocolTests

- (void)testTheProtocol
{
    id authService = [OCMockObject mockForProtocol:@protocol(AuthenticationServiceProtocol)];
    id foo = [[Foo alloc] initWithAuthenticationService:authService];
    
    [[authService expect] loginWithEmail:[OCMArg any] andPassword:[OCMArg any]];
    
    [foo doStuff];
    
    [authService verify];
}

@end
