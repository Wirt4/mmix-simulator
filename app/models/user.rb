# Public: A registered user who can authenticate and maintain sessions.
#
# Uses has_secure_password for bcrypt-based authentication and normalizes
# email addresses to a canonical lowercase, trimmed form.
class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  enum :role, { admin: 0, user: 1 }

  validates :email_address, presence: true, uniqueness: true
  validates :user_name, presence: true, uniqueness: true

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  normalizes :user_name, with: ->(e) { e.strip.downcase }
end
