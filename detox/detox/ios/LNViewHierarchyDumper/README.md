# LNViewHierarchyDumper

A framework for programmatically dumping the view hierarchy of your app into an Xcode 12-compatible view hierarchy file archive.

![](Screenshot.png)

**This framework uses the internal Xcode DebugHierarchyFoundation framework, and is not safe for AppStore**, thus the framework only functions when targeting iOS, tvOS and watchOS simulators, or macOS and Catalyst (with Xcode installed). Under unsupported targets, the frameworks includes no functionality and fails silently.

Using the framework is very easy:

```swift
import LNViewHierarchyDumper

//...

let url = //URL to a directory
try LNViewHierarchyDumper.shared.dumpViewHierarchy(to: url)
```

