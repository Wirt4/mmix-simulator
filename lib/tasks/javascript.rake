namespace :javascript do
  desc "Run JavaScript tests with Vitest"
  task :test do
    js_success = system("npx vitest run")
    unless js_success
      $stderr.puts "\n*** JavaScript tests failed! ***\n"
      @javascript_failed = true
    end
  end

  desc "Type-check TypeScript"
  task :typecheck do
    tc_success = system("npx tsc --noEmit")
    unless tc_success
      $stderr.puts "\n*** TypeScript type checking failed! ***\n"
      @typescript_failed = true
    end
  end
end

Rake::Task["test"].enhance([ "javascript:test", "javascript:typecheck" ]) do
  exit 1 if @javascript_failed || @typescript_failed
end
