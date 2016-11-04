#!/usr/bin/env ruby

require 'pathname'

#Setup require path to include local Xcodeproj and Nanaimo submodules 
$LOAD_PATH.unshift(Pathname.new(__FILE__).dirname + "Xcodeproj/lib")
$LOAD_PATH.unshift(Pathname.new(__FILE__).dirname + "Nanaimo/lib")

require 'xcodeproj'

def usage()
	puts "Usage: deploy_detox.rb <path_to.xcodeproj>"
end

if ARGV.count != 1 then
  usage
  exit
end

project_path = Pathname.new(ARGV[0]).expand_path
project_path += ".xcodeproj" unless project_path.exist? 
raise "Cannot find Xcode project" unless project_path.exist?

project_path_dir = project_path.dirname

puts "", "########################################", "Building Detox Framework", "########################################", ""

# raise "Detox framework build failed" unless system("xcodebuild build -project #{project_path_dir}/node_modules/detox/ios/Detox.xcodeproj -scheme DetoxFramework -configuration Release -derivedDataPath #{project_path_dir}/DetoxBuild", :out=>"/dev/null")

puts "", "########################################", "Integrating Detox Framework with Project", "########################################", ""

project = Xcodeproj::Project.open(project_path)

added_configs = []

project.build_configuration_list.build_configurations.each do |config|
	next if config.name.include?('_Detox')

	should_add = false
	unless build_conf = project.build_configuration_list[config.name + '_Detox']
		build_conf = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
		should_add = true
	end

	build_conf.name = config.name + '_Detox'
	build_conf.base_configuration_reference = config.base_configuration_reference.dup if config.base_configuration_reference
	build_conf.build_settings = config.build_settings.dup if config.build_settings

	added_configs << build_conf if should_add
end

added_configs.each { |config| project.build_configuration_list.build_configurations << config }

project.targets.each do |target|
	if target.product_type == "com.apple.product-type.application" and target.platform_name == :ios and target.shell_script_build_phases.find { |script| script.name.nil? == false and script.name.include?("Detox") }.nil? then
		script = target.new_shell_script_build_phase('Copy Detox Framework')
		script.shell_path = '/bin/bash'
		script.shell_script = "if [ -n \"$DEPLOY_DETOX_FRAMEWORK\" ]; then\nmkdir -p \"${BUILT_PRODUCTS_DIR}\"/\"${FRAMEWORKS_FOLDER_PATH}\"\ncp -r \"${PROJECT_DIR}\"/DetoxBuild/Build/Products/Release-universal/Detox.framework \"${BUILT_PRODUCTS_DIR}\"/\"${FRAMEWORKS_FOLDER_PATH}\"\nfi"
	end

	added_configs = []

	target.build_configuration_list.build_configurations.each do |config|	
		next if config.name.include?('_Detox')

		should_add = false
		unless build_conf = target.build_configuration_list[config.name + '_Detox']
			build_conf = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
			should_add = true
		end
		
		build_conf.name = config.name + '_Detox'
		build_conf.base_configuration_reference = config.base_configuration_reference.dup if config.base_configuration_reference
		build_conf.build_settings = config.build_settings.dup if config.build_settings

		if target.product_type == "com.apple.product-type.application" and target.platform_name == :ios then
			search_paths = config.build_settings['FRAMEWORK_SEARCH_PATHS'].nil? ? ['$(inherited)'] : config.build_settings['FRAMEWORK_SEARCH_PATHS'].dup
			unless search_paths.kind_of?(Array)
				search_paths = [search_paths]
			end
			search_paths << '$(PROJECT_DIR)/DetoxBuild/Build/Products/Release-universal'
			build_conf.build_settings['FRAMEWORK_SEARCH_PATHS'] = search_paths

			other_linker_flags = config.build_settings['OTHER_LDFLAGS'].nil? ? ['$(inherited)'] : config.build_settings['OTHER_LDFLAGS'].dup if 
			unless other_linker_flags.kind_of?(Array)
				other_linker_flags = [other_linker_flags]
			end
			other_linker_flags << '-framework'
			other_linker_flags << 'Detox'
			build_conf.build_settings['OTHER_LDFLAGS'] = other_linker_flags

			build_conf.build_settings['COPY_DETOX_FRAMEWORK'] = 'YES'
		end

		added_configs << build_conf if should_add
	end

	added_configs.each { |config| target.build_configuration_list.build_configurations << config }
end

scheme_names = Xcodeproj::Project.schemes(project_path)
saved_schemes = 0

scheme_names.each do |scheme_name|
	next if scheme_name.include?('_Detox')

	#Try to open an existing shared scheme. If it failes, create a new scheme.
	begin 
		scheme = Xcodeproj::XCScheme.new(Xcodeproj::XCScheme.shared_data_dir(project_path) + "#{scheme_name}.xcscheme")
		#Ignore schemes for extensions
		next unless scheme.launch_action.xml_element.attributes['launchAutomaticallySubstyle'].nil?
		scheme.launch_action.build_configuration += '_Detox'
		scheme.save_as(project_path, scheme_name + '_Detox', true)
		saved_schemes += 1	
	rescue => exception
	end
end

puts 'Error: No shared schemes found. Set at least one scheme as shared.' if saved_schemes == 0

project.save()

puts "", "########################################", "Done", "########################################", ""
