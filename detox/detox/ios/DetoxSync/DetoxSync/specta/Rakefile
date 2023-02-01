require 'tmpdir'
require 'pathname'

WORKSPACE = 'Specta.xcworkspace'
CONFIGURATION = 'Release'

NO_COLOR= "\033[0m"
GREEN_COLOR = "\033[32;01m"

def code_sign_identity
  ENV['CODE_SIGN_IDENTITY'] ||
    # Legacy support.
    ENV["SPT_CODE_SIGNING_IDENTITY"] ||
   'iPhone Developer'
end

def execute(command, stdout=nil)
  puts "Running #{command}..."
  command += " > #{stdout}" if stdout
  system(command) or raise "** BUILD FAILED **"
end

def test(scheme, sdk)
  execute "xcrun xcodebuild -sdk #{sdk} -workspace #{WORKSPACE} -scheme #{scheme} -configuration #{CONFIGURATION} test SYMROOT=build GCC_INSTRUMENT_PROGRAM_FLOW_ARCS=YES GCC_GENERATE_TEST_COVERAGE_FILES=YES | xcpretty -c && exit ${PIPESTATUS[0]}"
end

def build(scheme, sdk, product)
  # iphonesimulator and iphoneos have the same architectures (arm64) and can't be in the same fat output file
  # ref: https://github.com/CocoaPods/cocoapods-packager/issues/259#issuecomment-765108928
  excluded_archs = ""
  if sdk == 'iphonesimulator'
    excluded_archs = "arm64"
  end

  execute "xcrun xcodebuild -workspace #{WORKSPACE} -scheme #{scheme} -sdk #{sdk} -configuration #{CONFIGURATION} SYMROOT=build EXCLUDED_ARCHS=\"#{excluded_archs}\""
  build_dir = "#{CONFIGURATION}#{sdk == 'macosx' ? '' : "-#{sdk}"}"
  "Specta/build/#{build_dir}/#{product}"
end

def build_framework(scheme, sdk)
  build(scheme, sdk, 'Specta.framework')
end

def build_static_lib(scheme, sdk)
  build(scheme, sdk, 'libSpecta.a')
end

def lipo(bin1, bin2, output)
  execute "xcrun lipo -create '#{bin1}' '#{bin2}' -output '#{output}'"
end

def clean(scheme)
  execute "xcrun xcodebuild -workspace #{WORKSPACE} -scheme #{scheme} clean"
end

def puts_green(str)
  puts "#{GREEN_COLOR}#{str}#{NO_COLOR}"
end

desc 'Run tests'
task :test do |t|
  execute "xcrun xcodebuild test -workspace Specta.xcworkspace -scheme Specta GCC_INSTRUMENT_PROGRAM_FLOW_ARCS=YES GCC_GENERATE_TEST_COVERAGE_FILES=YES"
end

desc 'clean'
task :clean do |t|
  puts_green '=== CLEAN ==='
  clean('Specta')
  clean('Specta-iOS')
end

desc 'build'
task :build => :clean do |t|
  puts_green "=== BUILD ==="

  osx_framework     = build_framework('Specta', 'macosx')
  ios_sim_framework = build_framework('Specta-iOS', 'iphonesimulator')
  ios_framework     = build_framework('Specta-iOS', 'iphoneos')

  osx_static_lib     = build_static_lib('libSpecta', 'macosx')
  ios_sim_static_lib = build_static_lib('libSpecta-iOS', 'iphonesimulator')
  ios_static_lib     = build_static_lib('libSpecta-iOS', 'iphoneos')

  osx_build_path = Pathname.new(osx_framework).parent.to_s
  ios_build_path = Pathname.new(ios_framework).parent.to_s
  ios_univ_build_path = "Specta/build/#{CONFIGURATION}-ios-universal"

  puts_green "\n=== GENERATE UNIVERSAL iOS BINARY (Device/Simulator) ==="
  execute "mkdir -p '#{ios_univ_build_path}'"
  execute "cp -a '#{ios_framework}' '#{ios_univ_build_path}'"
  execute "cp -a '#{ios_static_lib}' '#{ios_univ_build_path}'"

  ios_framework_name = Pathname.new(ios_framework).basename.to_s
  ios_static_lib_name = Pathname.new(ios_static_lib).basename.to_s

  ios_univ_framework  = File.join(ios_univ_build_path, ios_framework_name)
  ios_univ_static_lib = File.join(ios_univ_build_path, ios_static_lib_name)

  lipo("#{ios_framework}/Specta", "#{ios_sim_framework}/Specta", "#{ios_univ_framework}/Specta")
  lipo(ios_static_lib, ios_sim_static_lib, ios_univ_static_lib)

  puts_green "\n=== CODESIGN iOS FRAMEWORK ==="
  execute "xcrun codesign --force --sign \"#{code_sign_identity}\" '#{ios_univ_framework}'"

  puts_green "\n=== COPY PRODUCTS ==="
  execute "yes | rm -rf Products"
  execute "mkdir -p Products/ios"
  execute "mkdir -p Products/osx"
  execute "cp -a #{osx_framework} Products/osx"
  execute "cp -a #{osx_static_lib} Products/osx"
  execute "cp -a #{ios_univ_framework} Products/ios"
  execute "cp -a #{ios_univ_static_lib} Products/ios"
  execute "cp -a #{osx_build_path}/usr/local/include/* Products"
  puts "\n** BUILD SUCCEEDED **"
end

namespace 'templates' do
  install_directory = File.expand_path("~/Library/Developer/Xcode/Templates/File Templates/Specta")
  templates_directory = File.expand_path("../misc/Specta", __FILE__)

  desc "Uninstall Specta templates"
  task :uninstall do
    rm_rf install_directory
  end

  desc "Install Specta templates"
  task :install do
    if File.exists?(install_directory)
      puts "Templates already installed at #{install_directory}"
    else
      mkdir_p install_directory
      cp_r templates_directory, install_directory
    end
  end

  desc "Remove and re-install Specta templates"
  task :reinstall => [:uninstall, :install]
end

namespace 'specs' do
  task :ios => :clean do |t|
    test("Specta-iOS", "iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 12'")
  end

  task :osx => :clean do |t|
    test("Specta", "macosx")
  end
end

task :default => [:build]

