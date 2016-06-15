#!/usr/bin/env ruby
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

require 'xcodeproj'
EARLGREY_TARGET_NAME = 'EarlGrey'

def configure_for_earlgrey(installer, project_name, test_target, scheme_file)
  puts ("Checking and Updating " + project_name + " for EarlGrey.").blue
  pods_project = installer.pods_project

  if (pods_project.nil? || !File.exist?(project_name + '.xcodeproj'))
    raise "The target's xcodeproj file could not be found. Please check if "\
      "the correct PROJECT_NAME is being passed in the Podfile. Current "\
      "PROJECT_NAME is: " + project_name
  end

  user_project = Xcodeproj::Project.open(project_name + '.xcodeproj')

  # Add a Test Action to the User Project Scheme.
  scheme = modify_scheme_for_actions(project_name, user_project, scheme_file)

  # Add a Copy Files Build Phase for EarlGrey.framework to embed it into the app under test.
  add_earlgrey_copy_files_script(user_project, test_target)

  if not scheme.nil?
    save_earlgrey_scheme_changes(scheme)
  end
  puts ("EarlGrey setup complete. You can use the Test Target : " + test_target +
      " for EarlGrey testing.").blue
end

# Scheme changes to ensure that EarlGrey is correctly loaded before main() is called.
def modify_scheme_for_actions(project_name, user_project, scheme_filename)
  # If you do not pass on a scheme name, we set it to the project name itself.
  if scheme_filename.to_s == ''
    scheme_filename = project_name
  end

  xcdata_dir = Xcodeproj::XCScheme.user_data_dir(user_project.path)
  if not File.exist?(File.join(xcdata_dir, scheme_filename).to_s)
    xcdata_dir = Xcodeproj::XCScheme.shared_data_dir(user_project.path)
  end

  if not File.exist?(File.join(xcdata_dir, scheme_filename).to_s)
    raise "The required scheme \"" + scheme_filename +"\" could not be found."
      " Please ensure that the required scheme file exists within your"\
      " project directory."
  end
  scheme = Xcodeproj::XCScheme.new File.join(xcdata_dir, scheme_filename)
  test_action_key = 'DYLD_INSERT_LIBRARIES'
  test_action_value = '@executable_path/EarlGrey.framework/EarlGrey'
  if not scheme.test_action.xml_element.to_s.include? test_action_value
    scheme =
        add_environment_variables_to_test_action_scheme(scheme_filename,
                                                        scheme,
                                                        test_action_key, 
                                                        test_action_value)
  end

  return scheme
end

# Load the EarlGrey framework when the app binary is loaded by
# the dynamic loader, before the main() method is called.
def add_environment_variables_to_test_action_scheme(scheme_filename,
                                                    scheme,
                                                    test_action_key,
                                                    test_action_value)
  test_action = scheme.test_action
  if (scheme.test_action.xml_element.to_s.include? test_action_key) ||
    (scheme.launch_action.xml_element.to_s.include? test_action_key)
    puts ("\n//////////////////// EARLGREY SCHEME ISSUE ////////////////////\n"\
      "EarlGrey failed to modify the Test Action part of the scheme: " + scheme_filename + "\n"\
      + "for one of following reasons:\n\n"\
      "1) DYLD_INSERT_LIBRARIES is already defined under Environment Variables of\n"\
      "the Test Action.\n"\
      "2) Run Action's environment variables are used for Test Action.\n\n"\
      "To ensure correct functioning of EarlGrey, please manually add the\n"\
      "following under Test Action's Environment Variables of the scheme:"  + scheme_filename +  "\n"\
      "Environment Variables or EarlGrey's location will not be found.\n"\
      "Name: DYLD_INSERT_LIBRARIES\n"\
      "Value: @executable_path/EarlGrey.framework/EarlGrey\n"\
      "///////////////////////////////////////////////////////////////\n\n").yellow
    return
  end
  puts "Adding EarlGrey Framework Location as an Environment Variable "
    "in the App Project's Test Target's Scheme Test Action."

  # Check if the test action uses the run action's environment variables and arguments.
  launch_action_env_args_present = false
  if (scheme.test_action.xml_element.to_s.include? 'shouldUseLaunchSchemeArgsEnv') &&
      ((scheme.launch_action.xml_element.to_s.include? '<EnvironmentVariables>') ||
      (scheme.launch_action.xml_element.to_s.include? '<CommandLineArguments>'))
    launch_action_env_args_present = true
  end

  test_action_isEnabled = 'YES'
  test_action.should_use_launch_scheme_args_env = false

  # If no environment variables are set, then create the element itself.
  if not (scheme.test_action.xml_element.to_s.include? '<EnvironmentVariables>')
    scheme.test_action.xml_element.add_element('EnvironmentVariables')
  end

  # If Launch Action Arguments are present and none are present in the test
  # action, then please add them in.
  if (scheme.launch_action.xml_element.to_s.include? '<CommandLineArguments>') &&
      !(scheme.test_action.xml_element.to_s.include? '<CommandLineArguments>')
    scheme.test_action.xml_element.add_element('CommandLineArguments')
  end

  # Create a new environment variable and add it to the Environment Variables.
  test_action_env_vars = scheme.test_action.xml_element.elements['EnvironmentVariables']
  test_action_args = scheme.test_action.xml_element.elements['CommandLineArguments']

  earl_grey_environment_variable = REXML::Element.new "EnvironmentVariable"
  earl_grey_environment_variable.attributes['key'] = test_action_key
  earl_grey_environment_variable.attributes['value'] = test_action_value
  earl_grey_environment_variable.attributes['isEnabled'] = test_action_isEnabled
  test_action_env_vars.add_element(earl_grey_environment_variable)

  # If any environment variables or arguments were being used in the test action by
  # being copied from the launch (run) action then copy them over to the test action
  # along with the EarlGrey environment variable.
  if (launch_action_env_args_present)
    launch_action_env_vars = scheme.launch_action.xml_element.elements['EnvironmentVariables']
    launch_action_args = scheme.launch_action.xml_element.elements['CommandLineArguments']

    # Add in the Environment Variables
    launch_action_env_vars.elements.each('EnvironmentVariable') do |launch_action_env_var|
      environment_variable = REXML::Element.new 'EnvironmentVariable'
      environment_variable.attributes['key'] = launch_action_env_var.attributes['key']
      environment_variable.attributes['value'] = launch_action_env_var.attributes['value']
      environment_variable.attributes['isEnabled'] = launch_action_env_var.attributes['isEnabled']
      test_action_env_vars.add_element(environment_variable)
    end

    #Add in the Arguments
    launch_action_args.elements.each('CommandLineArgument') do |launch_action_arg|
      argument = REXML::Element.new 'CommandLineArgument'
      argument.attributes['argument'] = launch_action_arg.attributes['argument']
      argument.attributes['isEnabled'] = launch_action_arg.attributes['isEnabled']
      test_action_args.add_element(argument)
    end

  end
  scheme.test_action = test_action
  return scheme
end

# Generates a copy files build phase to embed the EarlGrey framework into
# the app under test.
def add_earlgrey_copy_files_script(user_project, test_target)
  user_project.targets.each do |target|
    earlgrey_copy_files_phase_name = 'EarlGrey Copy Files'
    if target.name == test_target
      earlgrey_copy_files_exists = false
      target.copy_files_build_phases.each do |copy_files_phase|
        if copy_files_phase.name = earlgrey_copy_files_phase_name
          earlgrey_copy_files_exists = true
        end
      end

      if earlgrey_copy_files_exists == false
        new_copy_files_phase = target.new_copy_files_build_phase(earlgrey_copy_files_phase_name)
        new_copy_files_phase.dst_path = '$(TEST_HOST)/../'
        new_copy_files_phase.dst_subfolder_spec = '0'
        file_ref =
            user_project.products_group.new_file('${SRCROOT}/Pods/EarlGrey/EarlGrey-1.0.0/EarlGrey.framework')
        file_ref.source_tree = 'SRCROOT'
        build_file = new_copy_files_phase.add_file_reference(file_ref, true)
        build_file.settings = { 'ATTRIBUTES' => ['CodeSignOnCopy'] }
        user_project.save()
      end
    end
  end
end

# Save the scheme changes. This is done here to prevent any irreversible changes in case
# of an exception being thrown.
def save_earlgrey_scheme_changes(scheme)
  scheme.save!
end
