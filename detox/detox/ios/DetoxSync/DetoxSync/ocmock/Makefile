# This makefile has the following top-level targets:
#   - ci    used by Travis for continuous integration
#   - dist  used to build the binary distribution
#
# Note that the dist target uses git checkout to copy the source into the
# product directory. This means you should make sure that you don't have
# uncommited local changes when building a distribution.

BUILD_DIR   = $(CURDIR)/Build
ARCHIVE_DIR = $(BUILD_DIR)/Archives
PRODUCT_DIR = $(BUILD_DIR)/Product
SOURCE_DIR  = $(CURDIR)/Source
FWK_PATH 	= /Products/Library/Frameworks/OCMock.framework
XCODECI     = xcodebuild -project "$(SOURCE_DIR)/OCMock.xcodeproj" -xcconfig "$(SOURCE_DIR)/OCMockCI.xcconfig" -destination-timeout 600
XCODEDIST   = xcodebuild -project "$(SOURCE_DIR)/OCMock.xcodeproj" -xcconfig "$(SOURCE_DIR)/OCMockDist.xcconfig"
XCODEXCF	= xcodebuild
SHELL       = /bin/bash -e -o pipefail

.PHONY: macos ioslib ios tvos watchos buildcheck archives xcframework sourcecode ci-swiftpm carthage


clean:
	rm -rf "$(BUILD_DIR)"
	rm -rf "$(SOURCE_DIR)/Carthage"


ci: ci-macos ci-ios ci-swiftpm

ci-macos:
	@echo "Building macOS framework and running tests..."
	$(XCODECI) -scheme OCMock -destination 'platform=macOS' test | xcpretty -c

ci-ios:
	@echo "Building iOS library and running tests..."
	$(XCODECI) -scheme OCMockLib -destination 'platform=iOS Simulator,OS=latest,name=iPhone 11' test | xcpretty -c


dist: archives xcframework sourcecode dmg

macos:
	@echo "** Building macOS framework..."
	$(XCODEDIST) archive -scheme OCMock -destination 'generic/platform=macOS' -archivePath $(ARCHIVE_DIR)/OCMock-macOS | xcpretty -c

ioslib:
	@echo "** Building iOS libraries..."
	$(XCODEDIST) archive -scheme OCMockLib -destination 'generic/platform=iOS' -archivePath $(ARCHIVE_DIR)/OCMock-iOS-lib | xcpretty -c
	$(XCODEDIST) archive -scheme OCMockLib -destination 'generic/platform=iOS Simulator' -archivePath $(ARCHIVE_DIR)/OCMock-iOS-lib-sim | xcpretty -c

ios:
	@echo "** Building iOS frameworks..."
	$(XCODEDIST) archive -scheme "OCMock iOS" -destination 'generic/platform=iOS' -archivePath $(ARCHIVE_DIR)/OCMock-iOS | xcpretty -c
	$(XCODEDIST) archive -scheme "OCMock iOS" -destination 'generic/platform=iOS Simulator' -archivePath $(ARCHIVE_DIR)/OCMock-iOS-sim | xcpretty -c

tvos:
	@echo "** Building tvOS frameworks..."
	$(XCODEDIST) archive -scheme "OCMock tvOS" -destination 'generic/platform=tvOS' -archivePath $(ARCHIVE_DIR)/OCMock-tvOS | xcpretty -c
	$(XCODEDIST) archive -scheme "OCMock tvOS" -destination 'generic/platform=tvOS Simulator' -archivePath $(ARCHIVE_DIR)/OCMock-tvOS-sim | xcpretty -c

watchos:
	@echo "** Building watchOS frameworks..."
	$(XCODEDIST) archive -scheme "OCMock watchOS" -destination 'generic/platform=watchOS' -archivePath $(ARCHIVE_DIR)/OCMock-watchOS | xcpretty -c
	$(XCODEDIST) archive -scheme "OCMock watchOS" -destination 'generic/platform=watchOS Simulator' -archivePath $(ARCHIVE_DIR)/OCMock-watchOS-sim | xcpretty -c

buildcheck:
	@echo "** Verifying archives..."
	Tools/buildcheck.rb $(ARCHIVE_DIR)

archives: macos ioslib ios tvos watchos buildcheck

xcframework:
	@echo "** Creating XCFrameworks..."
	rm -rf $(PRODUCT_DIR)/OCMock.xcframework
	$(XCODEXCF) -create-xcframework -output $(PRODUCT_DIR)/OCMock.xcframework \
		-framework $(ARCHIVE_DIR)/OCMock-macOS.xcarchive$(FWK_PATH) \
		-framework $(ARCHIVE_DIR)/OCMock-iOS.xcarchive$(FWK_PATH) \
		-framework $(ARCHIVE_DIR)/OCMock-iOS-sim.xcarchive$(FWK_PATH) \
		-framework $(ARCHIVE_DIR)/OCMock-tvOS.xcarchive$(FWK_PATH) \
		-framework $(ARCHIVE_DIR)/OCMock-tvOS-sim.xcarchive$(FWK_PATH) \
		-framework $(ARCHIVE_DIR)/OCMock-watchOS.xcarchive$(FWK_PATH) \
		-framework $(ARCHIVE_DIR)/OCMock-watchOS-sim.xcarchive$(FWK_PATH)
	rm -rf $(PRODUCT_DIR)/libOCMock.xcframework
	$(XCODEXCF) -create-xcframework -output $(PRODUCT_DIR)/libOCMock.xcframework \
		-library $(ARCHIVE_DIR)/OCMock-iOS-lib.xcarchive/Products/usr/local/lib/libOCMock.a -headers $(ARCHIVE_DIR)/OCMock-iOS-lib.xcarchive/Products/usr/local/lib/OCMock \
		-library $(ARCHIVE_DIR)/OCMock-iOS-lib-sim.xcarchive/Products/usr/local/lib/libOCMock.a -headers $(ARCHIVE_DIR)/OCMock-iOS-lib-sim.xcarchive/Products/usr/local/lib/OCMock


sourcecode:
	@echo "** Checking out source code..."
	mkdir -p "$(PRODUCT_DIR)"
	git archive master | tar -x -C "$(PRODUCT_DIR)" Source

dmg:
	@echo "** Creating disk image..."
	Tools/makedmg.rb $(PRODUCT_DIR) $(BUILD_DIR)


ci-swiftpm:
	@echo "** Testing Swift Package Manager Distribution"
	rm -rf $(SOURCE_DIR)/Carthage
	swift build
	swift test


carthage:
	carthage build --project-directory "$(SOURCE_DIR)" --no-skip-current --use-xcframeworks
