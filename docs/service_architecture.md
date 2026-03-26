# Problem Description
Write the "shell out" process as descripbed in the regular editor spec https://docs.google.com/document/d/1PNHxnBLhObSi46REyH8BPGTt0kutnUpz58SbhLlRYkw/edit?tab=t.0. Would like to respect the workflow of the `mmix` and `mmixsimulator` command-line utitilities as much as possible as well as implement with an understandable design

## Goals
Convert MIXAL programs to binaries
convert binaries and configuration to the text seen on 'stdout'
Execercise appropriate caution with timeouts

## Non-Goals
Writing to Database models
Using in Controllers
Queued or background jobs

# Solution
Have a module of shell operations that includes a "shellout" method that takes a strategy object and text/binary as input and returns text/binary as output. The strategy interface is one of `read`, `write(content)` and `run(wrapperCommands)`. The Strategies themselves may be included in the module. 
## Pros
- strategy as parameter makes for easy mocking for tests
- run method hides the invocation of the mmix tool, and can be prepened with the appropriate containerization invocation
- if helper methods are required, they can likewise be put in the shell operations module
- Configurable SimulatorStrategy makes for an expected use case of "two runs" for separating the datasets for the clean console output and the debuggy trace runs: `shellOut(strategyWithQuietConfigs, input)` and `shellOut(strategyWithTraceConfics, input)`
## Cons
- Lots of encapsulation on text strings especially when the diffence is as trivial as ".mmo" extension vs ".mms"
- Enforcing an interface contract by abstract class is clunky

## Alternatives
1. pass bare strings to cover the missing parts `binary <- commandLineExecute("mmix", program, ".mms")` and `output <- commandLineExecute("mmixsimulator", binary, ".mmo)`
  Why it won't work
   -  the parameters will keep on growing... the simulator's config (extensive flags) aren't in there
   -  too much exposed information
  Why this way is better
   - Better information hiding
   - Trading off more methods for fewer parameters
2. One simple endpoint `/run' do it all in one controller and return the generated output. Fewer files
  Why it won't work
     - A large file size will make error tracing hard since there's so many different ways to throw.
  Why this way is better
     - An anticipated use case is to run the simulator twice: once for a standard output run and once with all the trace options the caller configured, composition makes developer intent much clearer from the calling structure
3. Command Pattern: all inheritance AbstractShell <|-- SimulatorShell, AbstractShell <|-- AssemblerShell, AbstractCommand <|--SimulatorCommand, AbstractCommand <|-- Assembler Command. Fewer classes.
  Why it won't work
    It's simple here, but inheritance can quickly get abused, especially in a duck typed way.
  Why this way is better
   Only uses a parent classe to define an interface, and at this point it's more for self-documenting code than anything else.

##  Diagram
```mermaid
classDiagram
direction TB
class Shell ["Shell Operations Module"]{
   shellOut(strategy, input, timeout : integer): binary | Text
}
	class AbstractStrategy{
		+ read() : binary | Text
        + write (content)
        + run (wrapperCommands: String[])
	}
class AssemblerStrategy{
		+ read() : binary
        + write (text)
        + run (wrapperCommands)
	}
class SimulatorStrategy{
		+ read() : text
        + write (binary)
        + run (wrapperCommands)
	}
 AbstractStrategy <|-- AssemblerStrategy
AbstractStrategy <|-- SimulatorStrategy
	
```
