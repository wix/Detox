#!/usr/bin/env ruby

def update_directory(directory)
  Dir.entries(directory).each do | file |
    path = "#{directory}/#{file}"
    if File.directory?(path)
      update_directory(path) unless (file =~ /^[.]+$/)
    else 
      update_file(path) if file =~ /\.(h|m|mm)$/
    end
  end
end

def update_file(filename)
  tmpname = "#{filename}.orig"
  `mv #{filename} #{tmpname}`
  infile = File.open("#{tmpname}", "r")
  outfile = File.open("#{filename}", "w")
  replace_banner(infile, outfile)
  `rm #{tmpname}`
end

def replace_banner(infile, outfile)
  in_banner = true
  year = nil
  infile.each_line do | line |
    if in_banner
      copyright_match = /Copyright \(c\) ([0-9]{4})/.match(line)
      if copyright_match
        year = copyright_match[1]
      end
      if !(line =~ /^\/\//) && !(line =~ /^[\/ ]\*/)
        write_banner(outfile, year)
        in_banner = false
      end
    end
    if !in_banner
      outfile.puts line
    end
  end  
end

def write_banner(outfile, year)
  banner = <<-EOS
/*
 *  Copyright (c) %YEARS% Erik Doernenburg and contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may
 *  not use these files except in compliance with the License. You may obtain
 *  a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */
  EOS
  years = (year != "2021") ? "#{year}-2021" : year
  banner.gsub!(/%YEARS%/, years)
  outfile.write(banner)
end

update_directory(ARGV[0])
