# Public: A registered user who can authenticate and maintain sessions.
#
# Uses has_secure_password for bcrypt-based authentication and normalizes
# email addresses to a canonical lowercase, trimmed form.
class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  enum :role, { admin: 0, user: 1 }

  validates :email_address, presence: true
  validates :user_name, presence: true

  # Internal: Normalize email_address by stripping whitespace and downcasing before storage.
  normalizes :email_address, with: ->(e) { e.strip.downcase }
end
