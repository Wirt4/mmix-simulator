# Public: An MMIX program belonging to a user.
#
# title  - The String title of the program.
# source - The String MMIX source code.

class MMIXALProgram < ApplicationRecord
  belongs_to :user
  has_one :output, dependent: :destroy
  validates :title, presence: true, uniqueness: { scope: :user_id }

  attribute :source, :string, default: "% write your MMIXAL code here"

  # a user can't have more than one project named "untitled"
  # This gets tricky when the default title is "untitled", so add a simple numbering scheme
  def self.default_title_for(user)
    base = "Untitled"
    return base unless user.mmixal_programs.exists?(title: base)

    n = 2
    n += 1 while user.mmixal_programs.exists?(title: "#{base} (#{n})")
    "#{base} (#{n})"
  end
end
