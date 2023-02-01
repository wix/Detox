#import "TestHelper.h"

@interface EXPMatchers_conformToTest : XCTestCase {
    id foo;
    id baz;
}
@end

@implementation EXPMatchers_conformToTest

- (void)setUp {
    foo = [Foo new];
    baz = [Baz new];
}

- (void)test_conformTo {
    assertPass(test_expect([Baz class]).conformTo(@protocol(Protocol)));
    assertPass(test_expect(baz).conformTo(@protocol(Protocol)));

    assertFail(test_expect([Foo class]).conformTo(@protocol(Protocol)), @"expected: Foo to conform to Protocol");
    assertFail(test_expect(foo).conformTo(@protocol(Protocol)), ([NSString stringWithFormat:@"expected: <Foo: %p> to conform to Protocol", foo]));

    assertFail(test_expect(nil).conformTo(@protocol(Protocol)), @"the object is nil/null");
    assertFail(test_expect([Foo class]).conformTo(nil), @"the protocol is nil/null");
}

- (void)test_toNot_conformTo {
    assertPass(test_expect([Foo class]).notTo.conformTo(@protocol(Protocol)));
    assertPass(test_expect(foo).notTo.conformTo(@protocol(Protocol)));

    assertFail(test_expect([Baz class]).notTo.conformTo(@protocol(Protocol)), @"expected: Baz not to conform to Protocol");
    assertFail(test_expect(baz).notTo.conformTo(@protocol(Protocol)), ([NSString stringWithFormat:@"expected: <Baz: %p> not to conform to Protocol", baz]));

    assertFail(test_expect(nil).notTo.conformTo(@protocol(Protocol)), @"the object is nil/null");
    assertFail(test_expect([Foo class]).notTo.conformTo(nil), @"the protocol is nil/null");
}

@end
