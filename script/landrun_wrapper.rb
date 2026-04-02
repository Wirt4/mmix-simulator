#!/usr/bin/env ruby
# frozen_string_literal: true

# Thin wrapper around the `landrun` Landlock sandbox CLI.
# Usage: ruby landrun_wrapper.rb [OPTIONS] -- COMMAND [ARGS...]

separator = ARGV.index("--")
abort "Usage: landrun_wrapper.rb [OPTIONS] -- COMMAND [ARGS...]" unless separator

wrapper_args = ARGV[0...separator]
command      = ARGV[(separator + 1)..]

landrun_flags = []
# flags mirror that of landrun exactly
flags_with_args = %w[--ro --rox --rw --rwx --bind-tcp --connect-tcp --env --log-level].freeze
boolean_flags   = %w[--unrestricted-network --best-effort --unrestricted-filesystem].freeze
i = 0

while i < wrapper_args.length
  flag = wrapper_args[i]
  if boolean_flags.include?(flag)
    landrun_flags.push(flag)
    i += 1
  elsif flags_with_args.include?(flag)
    path = wrapper_args[i + 1]
    abort "Missing path argument for #{flag}" unless path
    landrun_flags.push(flag, path)
    i += 2
  else
    abort "Unknown flag: #{flag}"
  end
end

exec("landrun", *landrun_flags, *command)
