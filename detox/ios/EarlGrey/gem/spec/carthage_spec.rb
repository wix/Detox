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

require_relative 'spec_helper'

describe 'carthage' do
  NIL_YAML = "--- \n...\n".freeze

  it 'successfully modifies the xcode project' do
    xcodeproj_2 = File.join(carthage_after, 'Example.xcodeproj')

    Dir.mktmpdir do |tmp_dir|
      FileUtils.cp_r carthage_before, tmp_dir

      Dir.chdir tmp_dir do
        # carthage modification of xcodeproj is non-deterministic so we can't rely on
        # comparing git diffs because the diffs are always unique... even after
        # normalizing the xcode ids.
        #
        # instead use project-diff which compares a tree hash of the project.

        # must use .start to activate the default value logic in thor.
        EarlGrey::CLI.start(%w[install -t AutoEarlGrey])

        xcodeproj_1 = File.join(tmp_dir, 'Example.xcodeproj')

        diff = ProjectDiff.run xcodeproj_1, xcodeproj_2

        if diff != NIL_YAML
          puts diff
          raise 'difference detected'
        end
      end
    end
  end
end
