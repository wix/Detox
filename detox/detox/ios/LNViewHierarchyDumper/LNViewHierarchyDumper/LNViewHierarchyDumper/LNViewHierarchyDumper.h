//
//  LNViewHierarchyDumper.h
//  LNViewHierarchyDumper
//
//  Created by Leo Natan (Wix) on 7/3/20.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface LNViewHierarchyDumper : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;


/// Shared dumper instance, to be used for view hierarchy dumping.
@property (nonatomic, readonly, class, strong) LNViewHierarchyDumper* sharedDumper NS_SWIFT_NAME(shared);

/// Dumps the current view hierarchy to an Xcode 12 and above compatible view hierarchy file archive.
/// @param URL The file URL at which to create the view hierarchy file archive. The last path component should either have a “.viewhierarchy” extension, or point to a directory and a default name will be chosen by the system.
/// @param error On input, a pointer to an error object. If an error occurs, this pointer is set to an actual error object containing the error information. You may specify NULL for this parameter if you do not want the error information.
- (BOOL)dumpViewHierarchyToURL:(NSURL*)URL error:(NSError**)error;

@end

NS_ASSUME_NONNULL_END
