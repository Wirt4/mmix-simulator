class MMIXSimulateJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  # Internal: run the executable's binary in MMIX and write output to db
  #
  # executable - Executable
  # output     - Output
  # config     - Hash options used to define trace state
  #   :t - The Integer to trace each instruction the first n times it is executed.
  #   :e - The Hexidecicmal number representing a bit pattern to each instruction that raises an arithmetic exception belonging to the bit pattern DVWIOUZX. :e defaults to #FF
  #   :r - The boolean describing whether to trace details of the register stack. This option shows all the “hidden” loads and stores that occur when octabytes are written from the ring of local registers into memory, or read from memory into that ring. It also shows the full details of SAVE and UNSAVE operations. •
  #   :l - The Integer to list the source line corresponding to each traced instruction, filling gaps of length :l or less.
  #   :s - The Boolean to show statistics of running time with each traced instruction.
  #   :P - The Boolean to show the program profile (that is, the frequency counts of each instruction that was executed) when the simulation ends.
  #   :L - The Integer to list the source lines corresponding to each instruction that appears in the program profile, filling gaps of length n or less. This option implies −P.
  #   :v - The boolean signaling to be verbose:Turn on all options. (More precisely, the −v option is shorthand for −t9999999999 −e −r −s −l10 −L10.)
  #   :q - The boolean signaling to be quiet: Cancel all previously specified options.
  #   :c - The integer to set the capacity of the local register ring to max(256,n); this number must be a power of 2.
  #   :f - The String filename to use for standard input to the simulated program. This option should be used whenever the simulator is not being used interactively, because the simulator will not recognize end of f ile when standard input has been defined in any other way.
  #   :D - The String filename to Prepare the named file for use by other simulators, instead of actually doing a simulation.
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
