class MMIXSimulateJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  # Internal: run the executable's binary in MMIX and write output to db
  #
  # executable - Executable
  # output     - Output
  # config     - SimulatorConfig
  #
  #   Example:
  #      MMIXSimulateJob.perform_later(executable, output)
  #      MMIXSimulateJob.perform_later(executable, output, config)
  #
  #    Returns nothing
  def perform(executable, output, config = nil)
    if output.executable != executable
      raise ArgumentError
    end
    std_output = get_output(executable.program.title, executable.bin)

  if std_output[:success] && config != nil
    trace_output = get_output(executable.program.title, executable.bin, config)
    output.update(trace_output: trace_output[:result])
  end
  end

  private
  def get_output(title, bin, config = nil)
    strategy = config == nil ? Shell::MMIXStrategySimulator.new : Shell::MMIXStrategySimulator.new(config)
    success = true
    begin
      result = Shell::ShellOperations.shell_out(title, strategy, bin)
    rescue StandardError => e
      success = false
      result = e.message
    end
    { result: result, success: success }
  end
end
