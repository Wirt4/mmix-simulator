class Executable < ApplicationRecord
  has_many :outputs

  validates :body, presence: true
end
