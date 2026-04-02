#!/usr/bin/env ruby
# frozen_string_literal: true

# Thin wrapper around the `landrun` Landlock sandbox CLI.
# Usage: ruby landrun_wrapper.rb [OPTIONS] -- COMMAND [ARGS...]

landrun_flags = []
rlimit_flags  = []
# flags mirror that of landrun exactly
flags_with_args = %w[--ro --rox --rw --rwx --bind-tcp --connect-tcp --env --log-level].freeze
boolean_flags   = %w[--unrestricted-network --best-effort --unrestricted-filesystem].freeze
rlimit_args     = %w[--rlimit-as --rlimit-fsize].freeze
i = 0

while i < ARGV.length
  arg = ARGV[i]
  if arg == "--"
    i += 1
    break
  elsif boolean_flags.include?(arg)
    landrun_flags.push(arg)
    i += 1
  elsif flags_with_args.include?(arg)
    value = ARGV[i + 1]
    abort "Missing argument for #{arg}" unless value
    landrun_flags.push(arg, value)
    i += 2
  elsif rlimit_args.include?(arg)
    value = ARGV[i + 1]
    abort "Missing argument for #{arg}" unless value
    prlimit_flag = arg.sub("--rlimit-", "--")
    rlimit_flags.push("#{prlimit_flag}=#{value}")
    i += 2
  else
    break
  end
end

command = ARGV[i..]
abort "Usage: landrun_wrapper.rb [OPTIONS] [--] COMMAND [ARGS...]" if command.empty?

if rlimit_flags.any?
  # Resolve the command to an absolute path before wrapping with prlimit,
  # because landrun strips PATH from the sandboxed environment.
  bin = command[0]
  resolved = if bin.include?("/")
               bin
  else
               ENV["PATH"].split(File::PATH_SEPARATOR)
                 .map { |d| File.join(d, bin) }
                 .find { |p| File.executable?(p) }
  end
  abort "Command not found: #{bin}" unless resolved
  command = [ "prlimit", *rlimit_flags, "--", resolved, *command[1..] ]
end

exec("landrun", *landrun_flags, *command)
