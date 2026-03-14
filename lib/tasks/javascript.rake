namespace :javascript do
  desc "Run JavaScript tests with Vitest"
  task :test do
    js_success = system("npx vitest run")
    unless js_success
      $stderr.puts "\n*** JavaScript tests failed! ***\n"
      @javascript_failed = true
    end
  end
end

Rake::Task["test"].enhance(["javascript:test"]) do
  exit 1 if @javascript_failed
end
