# Public: An MMIX program belonging to a user.
#
# title  - The String title of the program.
# source - The String MMIX source code.

class MMIXALProgram < ApplicationRecord
  belongs_to :user
  has_one :output, dependent: :destroy
  validates :title, presence: true, uniqueness: { scope: :user_id }

  attribute :source, :string, default: "% write your MMIXAL code here"

  def self.default_title_for(user)
    base = "Untitled"
    if not user.mmixal_programs.exists?(title: base)
      base
    else
      self.add_offset(base, user)
    end
  end

  def self.add_offset(title, user)
    n = 2
    while user.mmixal_programs.exists?(title: self.compound_title(title, n)) do
      n+=1
    end
    self.compound_title(title, n)
  end

  def self.compound_title(prefix, suffix)
    "#{prefix} (#{suffix})"
  end
end
