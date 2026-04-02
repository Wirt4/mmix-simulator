require "test_helper"

class LandrunWrapperTest < SandboxIntegrationTest
  WRAPPER = Rails.root.join("script", "landrun_wrapper.rb").to_s

  private

  def landrun_wrap(*args, command)
    out, err, status = Open3.capture3("ruby", WRAPPER, *args, *command)
    { stdout: out, stderr: err, status: status }
  end

  # ── --ro (read-only access) ────────────────────────────────────────

  public

  test "--ro grants read access to the specified path" do
    Dir.mktmpdir do |dir|
      File.write(File.join(dir, "hello.txt"), "hello")
      result = landrun_wrap("--rox", "/usr", "--ro", dir, [ "cat", File.join(dir, "hello.txt") ])
      assert result[:status].success?, "Expected read to succeed under --ro, got: #{result[:stderr]}"
    end
  end

  test "--ro denies write access to the specified path" do
    Dir.mktmpdir do |dir|
      target = File.join(dir, "nope.txt")
      result = landrun_wrap("--rox", "/usr", "--ro", dir, [ "sh", "-c", "echo pwned > #{target}" ])
      refute result[:status].success?, "Expected write to fail under --ro"
    end
  end

  test "--ro denies execution of binaries on the specified path" do
    Dir.mktmpdir do |dir|
      script = File.join(dir, "run.sh")
      File.write(script, "#!/bin/sh\necho executed")
      File.chmod(0o755, script)
      result = landrun_wrap("--rox", "/usr", "--ro", dir, [ script ])
      refute result[:status].success?, "Expected execution to fail under --ro"
    end
  end

  # # ── --rox (read-only + execute) ────────────────────────────────────

  test "--rox grants read access to the specified path" do
    Dir.mktmpdir do |dir|
      File.write(File.join(dir, "data.txt"), "readable")
      result = landrun_wrap("--rox", "/usr", "--rox", dir, [ "cat", File.join(dir, "data.txt") ])
      assert result[:status].success?, "Expected read to succeed under --rox, got: #{result[:stderr]}"
      assert_equal "readable", result[:stdout]
    end
  end

  test "--rox grants execute access to binaries on the specified path" do
    Dir.mktmpdir do |dir|
      script = File.join(dir, "run.sh")
      File.write(script, "#!/bin/sh\necho executed")
      File.chmod(0o755, script)
      result = landrun_wrap("--rox", "/usr", "--rox", dir, [ script ])
      assert result[:status].success?, "Expected execution to succeed under --rox, got: #{result[:stderr]}"
      assert_includes result[:stdout], "executed"
    end
  end

  test "--rox denies write access to the specified path" do
    Dir.mktmpdir do |dir|
      target = File.join(dir, "nope.txt")
      result = landrun_wrap("--rox", "/usr", "--rox", dir, [ "sh", "-c", "echo pwned > #{target}" ])
      refute result[:status].success?, "Expected write to fail under --rox"
    end
  end

  # # ── --rw (read-write access) ───────────────────────────────────────

  test "--rw grants read access to the specified path" do
    Dir.mktmpdir do |dir|
      File.write(File.join(dir, "data.txt"), "readable")
      result = landrun_wrap("--rox", "/usr", "--rw", dir, [ "cat", File.join(dir, "data.txt") ])
      assert result[:status].success?, "Expected read to succeed under --rw, got: #{result[:stderr]}"
      assert_equal "readable", result[:stdout]
    end
  end

  test "--rw grants write access to the specified path" do
    Dir.mktmpdir do |dir|
      target = File.join(dir, "output.txt")
      result = landrun_wrap("--rox", "/usr", "--rw", dir, [ "sh", "-c", "echo written > #{target}" ])
      assert result[:status].success?, "Expected write to succeed under --rw, got: #{result[:stderr]}"
      assert_equal "written\n", File.read(target)
    end
  end

  test "--rw denies execution of binaries on the specified path" do
    Dir.mktmpdir do |dir|
      script = File.join(dir, "run.sh")
      File.write(script, "#!/bin/sh\necho executed")
      File.chmod(0o755, script)
      result = landrun_wrap("--rox", "/usr", "--rw", dir, [ script ])
      refute result[:status].success?, "Expected execution to fail under --rw"
    end
  end

  # ── --rwx (read-write-execute access) ──────────────────────────────

  test "--rwx grants read access to the specified path" do
    Dir.mktmpdir do |dir|
      File.write(File.join(dir, "data.txt"), "readable")
      result = landrun_wrap("--rox", "/usr", "--rwx", dir, [ "cat", File.join(dir, "data.txt") ])
      assert result[:status].success?, "Expected read to succeed under --rwx, got: #{result[:stderr]}"
      assert_equal "readable", result[:stdout]
    end
  end

  test "--rwx grants write access to the specified path" do
    Dir.mktmpdir do |dir|
      target = File.join(dir, "output.txt")
      result = landrun_wrap("--rox", "/usr", "--rwx", dir, [ "sh", "-c", "echo written > #{target}" ])
      assert result[:status].success?, "Expected write to succeed under --rwx, got: #{result[:stderr]}"
      assert_equal "written\n", File.read(target)
    end
  end

  test "--rwx grants execute access to binaries on the specified path" do
    Dir.mktmpdir do |dir|
      script = File.join(dir, "run.sh")
      File.write(script, "#!/bin/sh\necho executed")
      File.chmod(0o755, script)
      result = landrun_wrap("--rox", "/usr", "--rwx", dir, [ script ])
      assert result[:status].success?, "Expected execution to succeed under --rwx, got: #{result[:stderr]}"
      assert_includes result[:stdout], "executed"
    end
  end

  # # ── --bind-tcp (allow binding to TCP ports) ────────────────────────

  test "--bind-tcp allows binding to the specified port" do
    Dir.mktmpdir do |dir|
      listener = 'ruby -e "require \"socket\"; s = TCPServer.new(\"127.0.0.1\", 9999); puts \"bound\"; s.close"'
      result = landrun_wrap("--rox", "/usr", "--bind-tcp", "9999", [ "sh", "-c", listener ])
      assert result[:status].success?, "Expected bind to port 9999 to succeed, got: #{result[:stderr]}"
      assert_includes result[:stdout], "bound"
    end
  end

  test "binding to a TCP port is denied without --bind-tcp" do
    Dir.mktmpdir do |dir|
      listener = 'ruby -e "require \"socket\"; s = TCPServer.new(\"127.0.0.1\", 9999); puts \"bound\"; s.close"'
      result = landrun_wrap("--rox", "/usr", [ "sh", "-c", listener ])
      refute result[:status].success?, "Expected bind to fail without --bind-tcp"
    end
  end

  # ── --connect-tcp (allow connecting to TCP ports) ──────────────────

  test "--connect-tcp allows connecting to the specified port" do
    Dir.mktmpdir do |dir|
      connector = 'ruby -e "require \"socket\"; TCPSocket.new(\"127.0.0.1\", 80) rescue nil; puts \"attempted\""'
      result = landrun_wrap("--rox", "/usr", "--connect-tcp", "80", [ "sh", "-c", connector ])
      assert result[:status].success?, "Expected connect attempt to succeed, got: #{result[:stderr]}"
      assert_includes result[:stdout], "attempted"
    end
  end

  test "connecting to a TCP port is denied without --connect-tcp" do
    Dir.mktmpdir do |dir|
      connector = 'ruby -e "require \"socket\"; TCPSocket.new(\"127.0.0.1\", 80); puts \"connected\""'
      result = landrun_wrap("--rox", "/usr", [ "sh", "-c", connector ])
      refute result[:status].success?, "Expected connect to fail without --connect-tcp"
    end
  end

  # # ── --unrestricted-network ─────────────────────────────────────────

  test "--unrestricted-network allows all network operations" do
    Dir.mktmpdir do |dir|
      listener = 'ruby -e "require \"socket\"; s = TCPServer.new(\"127.0.0.1\", 8888); puts \"bound\"; s.close"'
      result = landrun_wrap("--rox", "/usr", "--unrestricted-network", [ "sh", "-c", listener ])
      assert result[:status].success?, "Expected unrestricted network to allow binding, got: #{result[:stderr]}"
      assert_includes result[:stdout], "bound"
    end
  end

  # ── --env (pass environment variables) ─────────────────────────────

  test "--env passes a KEY=VALUE environment variable to the sandboxed process" do
    result = landrun_wrap("--rox", "/usr", "--env", "MY_VAR=hello", [ "sh", "-c", "echo $MY_VAR" ])
    assert result[:status].success?, "Expected command to succeed, got: #{result[:stderr]}"
    assert_equal "hello\n", result[:stdout]
  ensure
    ENV.delete("MY_VAR")
  end

  test "--env with bare KEY passes the current environment variable value" do
    ENV["LANDRUN_TEST_VAR"] = "from_parent"
    result = landrun_wrap("--rox", "/usr", "--env", "LANDRUN_TEST_VAR", [ "sh", "-c", "echo $LANDRUN_TEST_VAR" ])
    assert result[:status].success?, "Expected command to succeed, got: #{result[:stderr]}"
    assert_equal "from_parent\n", result[:stdout]
  ensure
    ENV.delete("LANDRUN_TEST_VAR")
  end

  #  ── --best-effort (graceful degradation) ───────────────────────────

  test "--best-effort does not cause an error on the current kernel" do
    result = landrun_wrap("--best-effort", "--rox", "/usr", [ "echo", "ok" ])
    assert result[:status].success?, "Expected --best-effort to succeed, got: #{result[:stderr]}"
    assert_equal "ok\n", result[:stdout]
  end

  # # ── --unrestricted-filesystem ──────────────────────────────────────

  test "--unrestricted-filesystem allows access to all paths" do
    Dir.mktmpdir do |dir|
      File.write(File.join(dir, "secret.txt"), "visible")
      result = landrun_wrap("--unrestricted-filesystem", [ "cat", File.join(dir, "secret.txt") ])
      assert result[:status].success?, "Expected unrestricted filesystem to allow reads, got: #{result[:stderr]}"
      assert_equal "visible", result[:stdout]
    end
  end

  # ── --log-level ────────────────────────────────────────────────────

  test "--log-level debug produces debug output on stderr" do
    result = landrun_wrap("--log-level", "debug", "--rox", "/usr", [ "echo", "ok" ])
    assert result[:status].success?, "Expected command to succeed, got: #{result[:stderr]}"
    refute_empty result[:stderr], "Expected debug output on stderr"
  end

  # ── Default behavior (no filesystem flags → deny all) ──────────────

  test "without filesystem flags, file access is denied" do
    Dir.mktmpdir do |dir|
      File.write(File.join(dir, "data.txt"), "hidden")
      result = landrun_wrap([ "cat", File.join(dir, "data.txt") ])
      refute result[:status].success?, "Expected file access to be denied without any filesystem flags"
    end
  end

  # # ── Multiple paths with the same flag ──────────────────────────────

  test "--ro accepts multiple comma-separated paths" do
    Dir.mktmpdir do |dir_a|
      Dir.mktmpdir do |dir_b|
        File.write(File.join(dir_a, "a.txt"), "aaa")
        File.write(File.join(dir_b, "b.txt"), "bbb")
        result = landrun_wrap("--rox", "/usr", "--ro", "#{dir_a},#{dir_b}", [ "sh", "-c", "cat #{File.join(dir_a, 'a.txt')} && cat #{File.join(dir_b, 'b.txt')}" ])
        assert result[:status].success?, "Expected reading from both paths to succeed, got: #{result[:stderr]}"
        assert_equal "aaabbb", result[:stdout]
      end
    end
  end

  # ── --rlimit-as (address-space limit via prlimit) ─────────────────

  test "--rlimit-as enforces a virtual memory ceiling on the sandboxed process" do
    # Allocate ~2 MB inside a 1 MB address-space limit — should be killed.
    alloc = 'ruby -e "a = \"x\" * (2 * 1024 * 1024)"'
    result = landrun_wrap("--rox", "/usr", "--rox", "/lib", "--ro", "/etc",
                          "--rlimit-as", "#{1_048_576}", [ "sh", "-c", alloc ])
    refute result[:status].success?, "Expected process to be killed by RLIMIT_AS"
  end

  test "--rlimit-as allows processes that stay within the limit" do
    result = landrun_wrap("--rox", "/usr", "--rox", "/lib", "--ro", "/etc",
                          "--rlimit-as", "#{512 * 1024 * 1024}", [ "echo", "ok" ])
    assert result[:status].success?, "Expected process within limit to succeed, got: #{result[:stderr]}"
    assert_equal "ok\n", result[:stdout]
  end

  # ── --rlimit-fsize (file-size limit via prlimit) ────────────────

  test "--rlimit-fsize enforces a file size ceiling on the sandboxed process" do
    Dir.mktmpdir do |dir|
      write_cmd = "dd if=/dev/zero of=#{dir}/big.bin bs=1024 count=200 2>&1"
      result = landrun_wrap("--rox", "/usr", "--rox", "/lib", "--ro", "/etc",
                            "--rw", dir, "--rlimit-fsize", "#{1024}", [ "sh", "-c", write_cmd ])
      refute result[:status].success?, "Expected process to be killed by RLIMIT_FSIZE"
    end
  end

  test "--rlimit-fsize allows writes that stay within the limit" do
    Dir.mktmpdir do |dir|
      target = File.join(dir, "small.txt")
      result = landrun_wrap("--rox", "/usr", "--rox", "/lib", "--ro", "/etc",
                            "--rw", dir, "--rlimit-fsize", "#{1_048_576}",
                            [ "sh", "-c", "echo ok > #{target}" ])
      assert result[:status].success?, "Expected write within limit to succeed, got: #{result[:stderr]}"
      assert_equal "ok\n", File.read(target)
    end
  end

  #  ── Wrapper script existence ───────────────────────────────────────

  test "landrun_wrapper.rb script exists" do
    assert File.exist?(WRAPPER), "Expected #{WRAPPER} to exist"
  end
end
