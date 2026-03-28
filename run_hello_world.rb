require_relative "app/services/shell/shell_operations"
require_relative "app/services/shell/abstract_mmix_strategy"
require_relative "app/services/shell/mmix_strategy_assembler"

# string below, the syntax is heredoc
hello_world = <<~MMIX
  LOC	Data_Segment
  GREG	@
  Text	BYTE	"Hello world!",10,0

  LOC	#100

  Main	LDA	$255,Text
  TRAP	0,Fputs,StdOut
  TRAP	0,Halt,0
MMIX

strategy = Shell::MmixStrategyAssembler.new
output = Shell::ShellOperations.shellOut(strategy, hello_world)

format = ARGV[0] || "hex"
case format
when "hex"
  output.bytes.each_slice(4) do |word|
    puts word.map { |b| b.to_s(16).rjust(2, "0") }.join(" ")
  end
when "binary"
  output.bytes.each_slice(4) do |word|
    puts word.map { |b| b.to_s(2).rjust(8, "0") }.join(" ")
  end
else
  puts "Unknown format: #{format}. Use 'hex' or 'binary'."
end
