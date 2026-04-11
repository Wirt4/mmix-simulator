namespace :typescript do
  desc "Run Typescript tests"
  task :test do
    js_success = system("npm run test")
    unless js_success
      $stderr.puts "\n*** Typescript tests failed! ***\n"
      @javascript_failed = true
    end
  end

  desc "Type-check TypeScript"
  task :typecheck do
    tc_success = system("npm run typecheck")
    unless tc_success
      $stderr.puts "\n*** TypeScript type checking failed! ***\n"
      @typescript_failed = true
    end
  end
end

Rake::Task["test"].enhance([ "typescript:typecheck", "typescript:test" ]) do
  exit 1 if @typescript_failed
end
