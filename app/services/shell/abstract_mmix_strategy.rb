# defines the interface for mmix operation strategies
module Shell
  class AbstractMmixStrategy
    def write(dir, content)
      raise "abstract method"
    end
    def run(dir, timeout)
      raise "abstract method"
    end
  end
end
