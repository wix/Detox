// swift-tools-version:5.3
// The swift-tools-version declares the minimum version of Swift required to build this package.
import PackageDescription

let package = Package(
    name: "OCMock",
    defaultLocalization: "en",
    products: [
        .library(
            name: "OCMock",
            targets: ["OCMock"]
        )
    ],
    targets: [
        .target(name: "OCMock",
            dependencies: [],
            path: "Source",
            exclude: [
                "Changes.txt",
                "OCMock/OCMock-Info.plist",
                "OCMock/OCMock-Prefix.pch",
                "OCMockTests/",
                "Cartfile",
                "OCMockLibTests/OCMockLibTests-Info.plist",
                "OCMockLib/OCMockLib-Prefix.pch",
                "OCMockLibTests/OCMockLibTests-Prefix.pch",
                "OCMockDist.xcconfig",
                "OCMockCI.xcconfig",
            ],
            publicHeadersPath: ".",
            cSettings: [
                .headerSearchPath("./"),
                .unsafeFlags(["-fno-objc-arc"])
            ],
            cxxSettings: nil,
            swiftSettings: nil,
            linkerSettings: nil
        ),
        .testTarget(
            name: "swift-test",
            dependencies: [
                "OCMock",
            ],
            path: "SwiftPMTests/swift",
                cSettings: [
                .headerSearchPath("../"),
            ]
        ),
        .testTarget(
            name: "objc-test",
            dependencies: [
             "OCMock",
            ],
            path: "SwiftPMTests/objc",
            cSettings: [
              .headerSearchPath("../"),
            ]
        )
    ]
)
