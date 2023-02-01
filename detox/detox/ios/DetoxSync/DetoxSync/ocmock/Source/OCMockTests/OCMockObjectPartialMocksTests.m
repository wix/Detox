/*
 *  Copyright (c) 2013-2021 Erik Doernenburg and contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may
 *  not use these files except in compliance with the License. You may obtain
 *  a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

#import <CoreData/CoreData.h>
#import <XCTest/XCTest.h>
#import "OCMock.h"
#import "OCPartialMockObject.h"
#import "TestClassWithCustomReferenceCounting.h"

#if TARGET_OS_IPHONE
#define NSRect CGRect
#define NSZeroRect CGRectZero
#define NSMakeRect CGRectMake
#define valueWithRect valueWithCGRect
#endif


#pragma mark Helper classes

@interface TestClassWithSimpleMethod : NSObject
+ (NSUInteger)initializeCallCount;
- (NSString *)foo;
- (void)bar:(id)someArgument;
@end

@implementation TestClassWithSimpleMethod

static NSUInteger initializeCallCount = 0;

+ (void)initialize
{
    initializeCallCount += 1;
}

+ (NSUInteger)initializeCallCount
{
    return initializeCallCount;
}

- (NSString *)foo
{
    return @"Foo";
}

- (void)bar:(id)someArgument // maybe we should make it explicit that the arg is retainable
{
}

@end

@interface TestClassThatObservesFoo : NSObject
{
@public
    id observedObject;
}
@end

@implementation TestClassThatObservesFoo

- (instancetype)initWithObject:(id)object
{
    if((self = [super init]))
        observedObject = object;
    return self;
}

- (void)dealloc
{
    [self stopObserving];
}

- (void)startObserving
{
    [observedObject addObserver:self forKeyPath:@"foo" options:0 context:NULL];
}

- (void)stopObserving
{
    if(observedObject != nil)
    {
        [observedObject removeObserver:self forKeyPath:@"foo" context:NULL];
        observedObject = nil;
    }
}

@end


@interface TestClassThatCallsSelf : NSObject
{
    int methodInt;
}

- (NSString *)method1;
- (NSString *)method2;
- (NSRect)methodRect1;
- (NSRect)methodRect2;
- (int)methodInt;
- (void)methodVoid;
- (void)setMethodInt:(int)anInt;
@end

@implementation TestClassThatCallsSelf

- (NSString *)method1
{
    id retVal = [self method2];
    return retVal;
}

- (NSString *)method2
{
    return @"Foo";
}


- (NSRect)methodRect1
{
    NSRect retVal = [self methodRect2];
    return retVal;
}

- (NSRect)methodRect2
{
    return NSMakeRect(10, 10, 10, 10);
}

- (int)methodInt
{
    return methodInt;
}

- (void)methodVoid
{
}

- (void)setMethodInt:(int)anInt
{
    methodInt = anInt;
}

@end


@interface NSObject (OCMCategoryForTesting)

- (NSString *)categoryMethod;

@end

@implementation NSObject (OCMCategoryForTesting)

- (NSString *)categoryMethod
{
    return @"Foo-Category";
}

@end


@interface OCTestManagedObject : NSManagedObject

@property(nonatomic, copy) NSString *name;
@property(nonatomic, assign) int32_t sortOrder;

@property(nonatomic, strong) OCTestManagedObject *toOneRelationship;
@property(nonatomic, strong) NSSet *toManyRelationship;

@end

@interface OCTestManagedObject (CoreDataGeneratedAccessors)

- (void)addToManyRelationshipObject:(OCTestManagedObject *)value;
- (void)removeToManyRelationshipObject:(OCTestManagedObject *)value;
- (void)addToManyRelationship:(NSSet *)values;
- (void)removeToManyRelationship:(NSSet *)values;

@end

@implementation OCTestManagedObject

@dynamic name;
@dynamic sortOrder;

@dynamic toOneRelationship;
@dynamic toManyRelationship;

@end


#pragma mark Category for testing

@interface OCPartialMockObject (AccessToInvocationsForTesting)

- (NSArray *)invocationsExcludingInitialize;

@end

@implementation OCPartialMockObject (AccessToInvocationsForTesting)

- (NSArray *)invocationsExcludingInitialize
{
    NSMutableArray *filteredInvocations = [[NSMutableArray alloc] init];
    for(NSInvocation *i in invocations)
        if([NSStringFromSelector([i selector]) hasSuffix:@"initialize"] == NO)
            [filteredInvocations addObject:i];

    return filteredInvocations;
}

@end


@interface OCMockObjectPartialMocksTests : XCTestCase
{
    int numKVOCallbacks;
}

@end


@implementation OCMockObjectPartialMocksTests

#pragma mark Test for description

- (void)testDescription
{
    TestClassWithSimpleMethod *object = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:object];
    XCTAssertEqualObjects([mock description], @"OCPartialMockObject(TestClassWithSimpleMethod)");
}

#pragma mark Tests for stubbing with partial mocks

- (void)testStubsMethodsOnPartialMock
{
    TestClassWithSimpleMethod *object = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:object];
    [[[mock stub] andReturn:@"hi"] foo];
    XCTAssertEqualObjects(@"hi", [mock foo], @"Should have returned stubbed value");
}

- (void)testForwardsUnstubbedMethodsCallsToRealObjectOnPartialMock
{
    TestClassWithSimpleMethod *object = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:object];
    XCTAssertEqualObjects(@"Foo", [mock foo], @"Should have returned value from real object.");
}

//- (void)testForwardsUnstubbedMethodsCallsToRealObjectOnPartialMockForTollFreeBridgedClasses
//{
//	mock = [OCMockObject partialMockForObject:[NSString stringWithString:@"hello2"]];
//	STAssertEqualObjects(@"HELLO2", [mock uppercaseString], @"Should have returned value from real object.");
//}

- (void)testStubsMethodOnRealObjectReference
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andReturn:@"TestFoo"] foo];
    XCTAssertEqualObjects(@"TestFoo", [realObject foo], @"Should have stubbed method.");
}

- (void)testCallsToSelfInRealObjectAreShadowedByPartialMock
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andReturn:@"FooFoo"] method2];
    XCTAssertEqualObjects(@"FooFoo", [mock method1], @"Should have called through to stubbed method.");
}

- (void)testCallsToSelfInRealObjectStructReturnAreShadowedByPartialMock
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andReturnValue:OCMOCK_VALUE(NSZeroRect)] methodRect2];
#if TARGET_OS_IPHONE
#define NSEqualRects CGRectEqualToRect
#endif
    XCTAssertTrue(NSEqualRects(NSZeroRect, [mock methodRect1]), @"Should have called through to stubbed method.");
}

- (void)testInvocationsOfNSObjectCategoryMethodsCanBeStubbed
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andReturn:@"stubbed"] categoryMethod];
    XCTAssertEqualObjects(@"stubbed", [realObject categoryMethod], @"Should have stubbed NSObject's method");
}

#pragma mark Tests for remembering invocations for later verification

- (void)testRecordsInvocationWhenRealObjectIsUsed
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];

    [realObject foo];

    XCTAssertEqual(1, [[mock invocationsExcludingInitialize] count]);
}

- (void)testRecordsInvocationWhenMockIsUsed
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];

    [mock foo];

    XCTAssertEqual(1, [[mock invocationsExcludingInitialize] count]);
}

- (void)testRecordsInvocationWhenRealObjectIsUsedAndMethodIsStubbed
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andReturn:@"bar"] foo];

    [realObject foo];

    XCTAssertEqual(1, [[mock invocationsExcludingInitialize] count]);
}

- (void)testRecordsInvocationWhenMockIsUsedAndMethodIsStubbed
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andReturn:@"bar"] foo];

    [mock foo];

    XCTAssertEqual(1, [[mock invocationsExcludingInitialize] count]);
}

- (void)testRecordsInvocationWhenMockIsUsedAndMethodIsStubbedAndForwardsToRealObject
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andForwardToRealObject] foo];

    [mock foo];

    XCTAssertEqual(1, [[mock invocationsExcludingInitialize] count]);
}


#pragma mark Tests for behaviour when setting up partial mocks

- (void)testPartialMockClassOverrideReportsOriginalClass
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];
    Class origClass = [realObject class];
    id mock = [OCMockObject partialMockForObject:realObject];
    XCTAssertEqualObjects([realObject class], origClass, @"Override of -class method did not work");
    XCTAssertEqualObjects([mock class], origClass, @"Mock proxy -class method did not work");
    XCTAssertFalse(origClass == object_getClass(realObject), @"Subclassing did not work");
    [mock stopMocking];
    XCTAssertEqualObjects([realObject class], origClass, @"Classes different after stopMocking");
    XCTAssertEqualObjects(object_getClass(realObject), origClass, @"Classes different after stopMocking");
}

- (void)testInitializeIsNotCalledOnMockedClass
{
    NSUInteger countBefore = [TestClassWithSimpleMethod initializeCallCount];

    TestClassWithSimpleMethod *object = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:object];
    [[[mock expect] andForwardToRealObject] foo];
    [object foo];

    NSUInteger countAfter = [TestClassWithSimpleMethod initializeCallCount];

    XCTAssertEqual(countBefore, countAfter, @"Creating a mock should not have resulted in call to +initialize");
}


- (void)testRefusesToCreateTwoPartialMocksForTheSameObject
{
    id object = [[TestClassThatCallsSelf alloc] init];

    id partialMock1 = [OCMockObject partialMockForObject:object];

    XCTAssertNotNil(partialMock1, @"Should have created first partial mock.");
    XCTAssertThrows([OCMockObject partialMockForObject:object], @"Should not have allowed creation of second partial mock");
}

- (void)testRefusesToCreatePartialMockForTollFreeBridgedClasses
{
    id object = CFBridgingRelease(CFStringCreateWithCString(kCFAllocatorDefault, "foo", kCFStringEncodingASCII));
    XCTAssertThrowsSpecificNamed([OCMockObject partialMockForObject:object],
                                 NSException,
                                 NSInvalidArgumentException,
                                 @"should throw NSInvalidArgumentException exception");
}

#if TARGET_RT_64_BIT

- (void)testRefusesToCreatePartialMockForTaggedPointers
{
    NSDate *object = [NSDate dateWithTimeIntervalSince1970:0];
    XCTAssertThrowsSpecificNamed([OCMockObject partialMockForObject:object],
                                 NSException,
                                 NSInvalidArgumentException,
                                 @"should throw NSInvalidArgumentException exception");
}

#endif

- (void)testRefusesToCreatePartialMockForNilObject
{
    XCTAssertThrows(OCMPartialMock(nil));
}

- (void)testRefusesToCreatePartialMockForProxy
{
    id proxy = [NSProxy alloc];
    XCTAssertThrows([OCMockObject partialMockForObject:proxy]);
}


- (void)testPartialMockOfCustomReferenceCountingObject
{
    /* The point of using an object that implements its own reference counting methods is to force
       -retain to be called even though the test is compiled with ARC. (Normally ARC does some magic
       that bypasses dispatching to -retain.) Issue #245 turned up a recursive crash when partial
       mocks used a forwarder for -retain. */
    TestClassWithCustomReferenceCounting *realObject = [TestClassWithCustomReferenceCounting new];
    id partialMock = OCMPartialMock(realObject);
    XCTAssertNotNil(partialMock);
}

- (void)testSettingUpSecondPartialMockForSameClassDoesNotAffectInstanceMethods
{
    TestClassWithSimpleMethod *object1 = [[TestClassWithSimpleMethod alloc] init];
    TestClassWithSimpleMethod *object2 = [[TestClassWithSimpleMethod alloc] init];

    TestClassWithSimpleMethod *mock1 = OCMPartialMock(object1);
    XCTAssertEqualObjects(@"Foo", [object1 foo]);

    TestClassWithSimpleMethod *mock2 = OCMPartialMock(object2);
    XCTAssertEqualObjects(@"Foo", [object1 foo]);
    XCTAssertEqualObjects(@"Foo", [object2 foo]);

    XCTAssertEqualObjects(@"Foo", [mock1 foo]);
    XCTAssertEqualObjects(@"Foo", [mock2 foo]);
}

- (void)testSettingUpSecondPartialMockForSameClassDoesNotAffectStubs
{
    TestClassWithSimpleMethod *object1 = [[TestClassWithSimpleMethod alloc] init];
    TestClassWithSimpleMethod *object2 = [[TestClassWithSimpleMethod alloc] init];

    TestClassWithSimpleMethod *mock1 = OCMPartialMock(object1);
    XCTAssertEqualObjects(@"Foo", [object1 foo]);
    OCMStub([mock1 foo]).andReturn(@"Bar");
    XCTAssertEqualObjects(@"Bar", [object1 foo]);

    TestClassWithSimpleMethod *mock2 = OCMPartialMock(object2);
    XCTAssertEqualObjects(@"Bar", [object1 foo]);
    XCTAssertEqualObjects(@"Foo", [object2 foo]);

    XCTAssertEqualObjects(@"Bar", [mock1 foo]);
    XCTAssertEqualObjects(@"Foo", [mock2 foo]);
}


#pragma mark Tests for Core Data interaction with mocks

- (void)testMockingManagedObject
{
    // Set up the Core Data stack for the test.

    NSManagedObjectModel *const model = [NSManagedObjectModel mergedModelFromBundles:@[ [NSBundle bundleForClass:self.class] ]];
    NSEntityDescription *const entity = model.entitiesByName[NSStringFromClass([OCTestManagedObject class])];
    NSPersistentStoreCoordinator *const coordinator = [[NSPersistentStoreCoordinator alloc] initWithManagedObjectModel:model];
    [coordinator addPersistentStoreWithType:NSInMemoryStoreType configuration:nil URL:nil options:nil error:NULL];
    NSManagedObjectContext *const context = [[NSManagedObjectContext alloc] initWithConcurrencyType:NSMainQueueConcurrencyType];

    // Create and mock a real core data object.

    OCTestManagedObject *const realObject = [[OCTestManagedObject alloc] initWithEntity:entity insertIntoManagedObjectContext:context];
    OCTestManagedObject *const partialMock = [OCMockObject partialMockForObject:realObject];

    // Verify the subclassing behaviour is as we expect.

    Class const runtimeObjectClass = object_getClass(realObject);
    Class const reportedClass = [realObject class];

    // Core Data generates a dynamic subclass at runtime to implement modeled proprerties.
    // It will look something like "OCTestManagedObject_OCTestManagedObject_".
    XCTAssertTrue([runtimeObjectClass isSubclassOfClass:reportedClass]);
    XCTAssertNotEqual(runtimeObjectClass, reportedClass);

    // Verify accessors and setters for attributes work as expected.

    partialMock.name = @"OCMock";
    partialMock.sortOrder = 120;

    XCTAssertEqualObjects(partialMock.name, @"OCMock");
    XCTAssertEqual(partialMock.sortOrder, 120);

    partialMock.name = nil;
    partialMock.sortOrder = 0;

    XCTAssertNil(partialMock.name);
    XCTAssertEqual(partialMock.sortOrder, 0);

    // Verify to-many relationships work as expected.

    OCTestManagedObject *const realObject2 = [[OCTestManagedObject alloc] initWithEntity:entity insertIntoManagedObjectContext:context];
    OCTestManagedObject *const realObject3 = [[OCTestManagedObject alloc] initWithEntity:entity insertIntoManagedObjectContext:context];

    [partialMock addToManyRelationshipObject:realObject2];

    XCTAssertEqualObjects(partialMock.toManyRelationship, [NSSet setWithObject:realObject2]);
    XCTAssertEqualObjects(realObject2.toManyRelationship, [NSSet setWithObject:realObject]);

    partialMock.toOneRelationship = realObject3;

    XCTAssertEqualObjects(partialMock.toOneRelationship, realObject3);
    XCTAssertEqualObjects(realObject3.toOneRelationship, realObject);

    // Verify saving the context works as expected.

    NSError *saveError = nil;
    [context save:&saveError];

    XCTAssertNil(saveError);
}

#pragma mark Tests for KVO interaction with mocks

- (void)testAddingObserverAfterCreatingPartialMockShouldWork
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];

    id mock = [OCMockObject partialMockForObject:realObject];
    Class mockSubclass = object_getClass(realObject);

    [realObject addObserver:self forKeyPath:@"methodInt" options:NSKeyValueObservingOptionNew context:NULL];

    Class kvoSublass = object_getClass(realObject);
    XCTAssertTrue(kvoSublass != mockSubclass, @"Expected KVO to create its own subclass");
    // The -class method is overriden by KVO to return the actual class the object had before.
    // That happens to be our mock subclass, which isn't ideal, because it should be the real
    // class, but for now we simply assert that the behaviour is as expected.
    XCTAssertEqualObjects([realObject class], mockSubclass, @"Expected class method to return mock subclass");

    [realObject setMethodInt:45];
    XCTAssertEqual(numKVOCallbacks, 1, @"Should have received notification via real object");
    [mock setMethodInt:47];
    XCTAssertEqual(numKVOCallbacks, 2, @"Should have received notification via partial mock");

    [realObject removeObserver:self forKeyPath:@"methodInt" context:NULL];

    XCTAssertEqualObjects(object_getClass(realObject), mockSubclass, @"Class should be mock subclass again");
    XCTAssertEqualObjects([realObject class], [TestClassThatCallsSelf class], @"Class method should return real class");
}

- (void)testCreatingPartialMockAfterAddingObserverDoesNotCrash
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];
    Class realClass = [realObject class];

    [realObject addObserver:self forKeyPath:@"methodInt" options:NSKeyValueObservingOptionNew context:NULL];
    Class kvoSubclass = object_getClass(realObject);

    id mock = [OCMockObject partialMockForObject:realObject];
    Class mockSubclass = object_getClass(realObject);

    XCTAssertTrue(mockSubclass != kvoSubclass, @"Expected mock to create and set its own subclass");
    XCTAssertEqualObjects([realObject class], [TestClassThatCallsSelf class], @"Should have returned real class");

    // The implementation replaces the KVO subclass, which means that existing observers no
    // longer receive notifications. Of course, this is not ideal but so far it's the best
    // we can do, and so we simply assert that the behaviour is as expected.
    [realObject setMethodInt:45];
    XCTAssertEqual(numKVOCallbacks, 0, @"Did not expect to receive a notification via real object");
    [mock setMethodInt:47];
    XCTAssertEqual(numKVOCallbacks, 0, @"Did not expect to receive a notification via partial mock");

    [mock stopMocking];
    XCTAssertEqualObjects(object_getClass(realObject), realClass, @"Should have restored class");
    XCTAssertEqualObjects([realObject class], realClass, @"Should have returned real class");

    // Given that we have replaced the KVO subclass, we mostly care that there aren't any
    // crashes when removing observers. We also check that classes are as expected.
    [realObject removeObserver:self forKeyPath:@"methodInt" context:NULL];
    XCTAssertEqualObjects(object_getClass(realObject), realClass, @"Should not have changed class");
    XCTAssertEqualObjects([realObject class], realClass, @"Should not report different class");
}


- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    numKVOCallbacks++;
}


#pragma mark Tests for end of stubbing with partial mocks

- (void)testReturnsToRealImplementationWhenExpectedCallOccurred
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock expect] andReturn:@"TestFoo"] foo];
    XCTAssertEqualObjects(@"TestFoo", [realObject foo], @"Should have stubbed method.");
    XCTAssertEqualObjects(@"Foo", [realObject foo], @"Should have 'unstubbed' method.");
}

- (void)testRestoresObjectWhenStopped
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [[[mock stub] andReturn:@"TestFoo"] foo];
    XCTAssertEqualObjects(@"TestFoo", [realObject foo], @"Should have stubbed method.");
    XCTAssertEqualObjects(@"TestFoo", [realObject foo], @"Should have stubbed method.");
    [mock stopMocking];
    XCTAssertEqualObjects(@"Foo", [realObject foo], @"Should have 'unstubbed' method.");
}

- (void)testArgumentsGetReleasedAfterStopMocking
{
    __weak id weakArgument;
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = OCMPartialMock(realObject);
    @autoreleasepool
    {
        NSObject *argument = [NSObject new];
        weakArgument = argument;
        [mock bar:argument];
        [mock stopMocking];
    }
    XCTAssertNil(weakArgument);
}


#pragma mark Tests for explicit forward to real object with partial mocks

- (void)testForwardsToRealObjectWhenSetUpAndCalledOnMock
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];

    [[[mock expect] andForwardToRealObject] foo];
    XCTAssertEqual(@"Foo", [mock foo], @"Should have called method on real object.");

    [mock verify];
}

- (void)testForwardsToRealObjectWhenSetUpAndCalledOnRealObject
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];

    [[[mock expect] andForwardToRealObject] foo];
    XCTAssertEqual(@"Foo", [realObject foo], @"Should have called method on real object.");

    [mock verify];
}

- (void)testReturnValueFromRealObjectShouldBeReturnedEvenWithPrecedingAndCall
{
    TestClassThatCallsSelf *object = [[TestClassThatCallsSelf alloc] init];
    OCMockObject *mock = OCMPartialMock(object);
    [[[[mock stub] andCall:@selector(firstReturnValueMethod) onObject:self] andForwardToRealObject] method2];
    XCTAssertEqualObjects([object method2], @"Foo", @"Should have returned value from real object.");
}

- (NSString *)firstReturnValueMethod
{
    return @"Bar";
}

- (void)testExpectedMethodCallsExpectedMethodWithExpectationOrdering
{
    TestClassThatCallsSelf *object = [[TestClassThatCallsSelf alloc] init];
    id mock = OCMPartialMock(object);
    [mock setExpectationOrderMatters:YES];
    [[[mock expect] andForwardToRealObject] method1];
    [[[mock expect] andForwardToRealObject] method2];
    XCTAssertNoThrow([object method1], @"Calling an expected method that internally calls another expected method should not make expectations appear to be out of order.");
}


#pragma mark Tests for method swizzling with partial mocks

- (NSString *)differentMethodInDifferentClass
{
    return @"swizzled!";
}

- (void)testImplementsMethodSwizzling
{
    // using partial mocks and the indirect return value provider
    TestClassThatCallsSelf *foo = [[TestClassThatCallsSelf alloc] init];
    id mock = [OCMockObject partialMockForObject:foo];
    [[[mock stub] andCall:@selector(differentMethodInDifferentClass) onObject:self] method1];
    XCTAssertEqualObjects(@"swizzled!", [foo method1], @"Should have returned value from different method");
}


- (void)aMethodWithVoidReturn
{
}

- (void)testMethodSwizzlingWorksForVoidReturns
{
    TestClassThatCallsSelf *foo = [[TestClassThatCallsSelf alloc] init];
    id mock = [OCMockObject partialMockForObject:foo];
    [[[mock stub] andCall:@selector(aMethodWithVoidReturn) onObject:self] methodVoid];
    XCTAssertNoThrow([foo method1], @"Should have worked.");
}


#pragma mark Tests for exception messages

- (void)testVerifyFailureIncludesHintForPartialMockMethodsThatDontGetForwarderInstalled
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    [realObject categoryMethod];
    @try
    {
        [[mock verify] categoryMethod];
        XCTFail(@"An exception should have been thrown.");
    }
    @catch(NSException *e)
    {
        XCTAssertTrue([[e reason] containsString:@"Adding a stub"]);
    }
}

- (void)testDoesNotIncludeHintWhenMockIsNotPartialMock
{
    id mock = [OCMockObject niceMockForClass:[TestClassThatCallsSelf class]];
    @try
    {
        [[mock verify] categoryMethod];
        XCTFail(@"An exception should have been thrown.");
    }
    @catch(NSException *e)
    {
        XCTAssertFalse([[e reason] containsString:@"Adding a stub"]);
    }
}

- (void)testDoesNotIncludeHintWhenStubbingIsNotGoingToHelp
{
    TestClassThatCallsSelf *realObject = [[TestClassThatCallsSelf alloc] init];
    id mock = [OCMockObject partialMockForObject:realObject];
    @try
    {
        [[mock verify] method2];
        XCTFail(@"An exception should have been thrown.");
    }
    @catch(NSException *e)
    {
        XCTAssertFalse([[e reason] containsString:@"Adding a stub"]);
    }
}

- (void)testThrowsExceptionWhenAttemptingToTearDownWrongClass
{
    TestClassWithSimpleMethod *realObject = [[TestClassWithSimpleMethod alloc] init];
    TestClassThatObservesFoo *observer = [[TestClassThatObservesFoo alloc] initWithObject:realObject];
    id mock = [OCMockObject partialMockForObject:realObject];
    [observer startObserving];

    // If we invoked stopObserving here, then stopMocking would work; but we want to test the error case.
    XCTAssertThrowsSpecificNamed([mock stopMocking], NSException, NSInvalidArgumentException);

    // Must reset the object here to avoid any attempt to remove the observer, which would fail.
    observer->observedObject = nil;
}

@end
