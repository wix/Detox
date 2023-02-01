#!/usr/bin/env ruby

def run(cmd, &block)
  puts "> #{cmd}"
  if block == nil
    abort "** command failed with error" if !system(cmd)
  else
    IO.popen(cmd, &block)
  end
end

def checkArchs(path, expected)
  archs = nil
  run("lipo -info \"#{path}\"") { |lipo| archs = /re: (.*)/.match(lipo.readline)[1].strip() }
  if (expected.split(" ") - archs.split(" ")).count > 0
    puts "Warning: missing architecture; expected \"#{expected}\", found \"#{archs}\""
  end
  if (archs.split(" ") - expected.split(" ")).count > 0
    puts "Warning: unexpected architecture; expected \"#{expected}\", found \"#{archs}\""
  end
end

def checkAuthority(path, expected)
  authorities = []
  run("codesign -dvv #{path} 2>&1") { |codesign| codesign.readlines
      .map { |line| /Authority=(.*)/.match(line) }
      .select { |match| match != nil }
      .each { |match| authorities.push(match[1])}
  }
  if ! authorities.include? expected
    puts "Warning: missing signing authority; expected \"#{expected}\", found #{authorities}"
  end
end

productdir = ARGV[0]
abort "Error: no product directory specified" if productdir == nil

checkArchs "#{productdir}/OCMock-macOS.xcarchive/Products/Library/Frameworks/OCMock.framework/OCMock", "x86_64 arm64"
checkArchs "#{productdir}/OCMock-iOS-lib.xcarchive/Products/usr/local/lib/libOCMock.a", "armv7 arm64"
checkArchs "#{productdir}/OCMock-iOS-lib-sim.xcarchive/Products/usr/local/lib/libOCMock.a", "i386 x86_64 arm64"
checkArchs "#{productdir}/OCMock-iOS.xcarchive/Products/Library/Frameworks/OCMock.framework/OCMock", "armv7 arm64"
checkArchs "#{productdir}/OCMock-iOS-sim.xcarchive/Products/Library/Frameworks/OCMock.framework/OCMock", "i386 x86_64 arm64"
checkArchs "#{productdir}/OCMock-tvOS.xcarchive/Products/Library/Frameworks/OCMock.framework/OCMock", "arm64"
checkArchs "#{productdir}/OCMock-tvOS-sim.xcarchive/Products/Library/Frameworks/OCMock.framework/OCMock", "x86_64 arm64"
checkArchs "#{productdir}/OCMock-watchOS.xcarchive/Products/Library/Frameworks/OCMock.framework/OCMock", "armv7k arm64_32"
checkArchs "#{productdir}/OCMock-watchOS-sim.xcarchive/Products/Library/Frameworks/OCMock.framework/OCMock", "i386 x86_64 arm64"

authority = "Apple Development: erik@doernenburg.com (FJTF47J852)"

checkAuthority "#{productdir}/OCMock-macOS.xcarchive/Products/Library/Frameworks/OCMock.framework", authority
