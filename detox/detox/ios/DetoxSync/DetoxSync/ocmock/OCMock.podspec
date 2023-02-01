Pod::Spec.new do |s|
  s.name                      = "OCMock"
  s.version                   = "3.9.1"

  s.summary                   = "Mock objects for Objective-C"
  s.description               = <<-DESC
                        OCMock is an Objective-C implementation of mock objects. It provides
                        stubs that return pre-determined values for specific method invocations,
                        dynamic mocks that can be used to verify interaction patterns, and
                        partial mocks to overwrite selected methods of existing objects.
                        DESC

  s.homepage                  = "http://ocmock.org"
  s.documentation_url         = "http://ocmock.org/reference/"
  s.license                   = { :type => "Apache 2.0", :file => "License.txt" }

  s.author                    = { "Erik Doernenburg" => "erik@doernenburg.com" }
  s.social_media_url          = "https://twitter.com/erikdoe"

  s.source                    = { :git => "https://github.com/erikdoe/ocmock.git", :tag => "v3.9.1" }
  s.source_files              = "Source/OCMock/*.{h,m}"

  s.requires_arc              = false
  s.osx.deployment_target     = '10.10'
  s.ios.deployment_target     = '9.0'
  s.tvos.deployment_target    = '9.0'
  s.watchos.deployment_target = '4.0'
  s.osx.framework             = 'XCTest'
  s.ios.framework             = 'XCTest'
  s.tvos.framework            = 'XCTest'
  s.watchos.framework         = 'XCTest'

  s.pod_target_xcconfig       = { 'ENABLE_BITCODE' => 'NO' }

  s.public_header_files       = ["OCMock.h", "OCMockObject.h", "OCMArg.h", "OCMConstraint.h",
                                 "OCMLocation.h", "OCMMacroState.h", "OCMRecorder.h",
                                 "OCMStubRecorder.h", "NSNotificationCenter+OCMAdditions.h",
                                 "OCMFunctions.h", "OCMVerifier.h", "OCMQuantifier.h",
                                 "OCMockMacros.h"
                                ]
                                .map { |file| "Source/OCMock/" + file }
end
