#!/usr/bin/env ruby

require 'pathname'

#Setup require path to include local Xcodeproj and Nanaimo submodules
$LOAD_PATH.unshift(__dir__ + "Xcodeproj/lib")
$LOAD_PATH.unshift(__dir__ + "Nanaimo/lib")

require 'xcodeproj'

def usage()
    puts "Usage: cleanup_4.0.rb <path_to.xcodeproj>"
end

if ARGV.count != 1 then
    usage
    exit
end

project_path_str = ARGV[0].end_with?(".xcodeproj/") ? ARGV[0].chomp('/') : ARGV[0].end_with?(".xcodeproj") ? ARGV[0] : ARGV[0] + ".xcodeproj"
project_path = Pathname.new(project_path_str).expand_path
raise "Cannot find Xcode project" unless project_path.exist?

project_path_dir = project_path.dirname

puts "", "########################################", "Cleaning Project", "########################################", ""

project = Xcodeproj::Project.open(project_path)

configs_to_remove = project.build_configuration_list.build_configurations.select { |config| config.name.end_with?('_Detox') }
project.build_configuration_list.build_configurations.delete(configs_to_remove)

project.targets.each { |target| 
    configs_to_remove = target.build_configuration_list.build_configurations.select { |config| config.name.end_with?('_Detox') }
    target.build_configuration_list.build_configurations.delete(configs_to_remove)

    shell_scripts_to_remove = target.shell_script_build_phases.select { |script| script.name.nil? == false and script.name.eql?("Copy Detox Framework") }
    target.shell_script_build_phases.delete(shell_scripts_to_remove)
}

raise "Error: Unable to save Xcode project" unless project.save()

scheme_names = Xcodeproj::Project.schemes(project_path)

scheme_names.each do |scheme_name|
    next unless scheme_name.include?('_Detox')
    
    FileUtils.rm_r(Xcodeproj::XCScheme.shared_data_dir(project_path) + "#{scheme_name}.xcscheme")
end

puts "", "########################################", "Done", "########################################", ""
