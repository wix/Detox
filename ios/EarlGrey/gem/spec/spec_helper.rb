#
#  Copyright 2016 Google Inc.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

require_relative '../lib/earlgrey'
require 'rspec'
require 'tmpdir'
require 'pry' # enables binding.pry
require_relative 'project_diff'

module SpecHelper
  def fixture_path(name)
    path = File.join(File.expand_path(File.join(__dir__, 'fixtures', name)), '.')
    raise "Path doesn't exist: #{path}" unless File.exist?(path)
    path
  end

  def carthage_before
    # ensure ends with /. for FileUtils.cp_r
    @carthage_before ||= begin
      fixture_path 'carthage_before'
    end
  end

  def carthage_after
    # ensure ends with /. for FileUtils.cp_r
    @carthage_after ||= begin
      fixture_path 'carthage_after'
    end
  end
end

RSpec.configure do |config|
  config.include SpecHelper
end
