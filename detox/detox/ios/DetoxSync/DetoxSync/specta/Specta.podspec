Pod::Spec.new do |s|
  s.name     = 'Specta'
  s.version  = '2.0.0'
  s.license  = 'MIT'
  s.summary  = 'A light-weight TDD / BDD framework.'
  s.homepage = 'http://github.com/specta/specta'
  s.author   = { 'Peter Jihoon Kim' => 'raingrove@gmail.com' }
  s.source   = { :git => 'https://github.com/specta/specta.git', :tag => "v#{s.version.to_s}" }

  s.description = 'Specta is a light-weight testing framework that adds RSpec-like DSL to XCTest.'
  s.source_files = 'Specta/Specta/**/*.{h,m}'

  s.frameworks = 'Foundation', 'XCTest'

  s.ios.deployment_target = '6.0'
  s.osx.deployment_target = '10.8'
  s.tvos.deployment_target = '9.0'

  s.pod_target_xcconfig = { 'ENABLE_BITCODE' => 'NO' }
  s.user_target_xcconfig = { 'FRAMEWORK_SEARCH_PATHS' => '$(PLATFORM_DIR)/Developer/Library/Frameworks' }
end
