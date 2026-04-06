class MMIXSimulateJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  # Internal: run the executable's binary in MMIX and write output to db
  #
  # program - MMIXALProgram
  # output     - Output
  # config     - SimulatorConfig
  #
  #   Example:
  #      MMIXSimulateJob.perform_later(program, output)
  #      MMIXSimulateJob.perform_later(program, output, config)
  #
  #    Returns nothing
  def perform(mmixal_program, output, config = nil)
    title = mmixal_program.title
    bin = mmixal_program.binary

    run_simulation(title, bin)
    return if config.nil?

    result = run_simulation(title, bin, config)
    output.update(trace_output: result)
  end

  private

  def run_simulation(title, bin, config = nil)
    strategy = config.nil? ? Shell::MMIXStrategySimulator.new : Shell::MMIXStrategySimulator.new(config)
    Shell::ShellOperations.shell_out(title, strategy, bin)
  rescue StandardError => e
    e.message
  end
end
