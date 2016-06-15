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

require 'yaml'

# Define a custom project diff to avoid path names from showing up in the report.
# The tests use a temporary directory and the path to that will always be different
# from the path to the fixtures dir.
class ProjectDiff
  class << self
    def tree(path)
      raise "Path doesn't exist: #{path}" unless File.exist? path
      Xcodeproj::Project.open(path).to_tree_hash.dup
    end

    # Based on code from:
    # https://github.com/CocoaPods/Xcodeproj/blob/480e2f99e5e9315b8032854a9530aa500761e138/lib/xcodeproj/command/project_diff.rb
    def run(path_1, path_2)
      Xcodeproj::Differ.project_diff(tree(path_1), tree(path_2)).to_yaml
    end
  end
end
