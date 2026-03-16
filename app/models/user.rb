# Public: A registered user who can authenticate and maintain sessions.
#
# Uses has_secure_password for bcrypt-based authentication and normalizes
# email addresses and user names to a canonical lowercase, trimmed form.
#
# Roles are stored as integers in the database:
#   user:  1 (default) — can use the console; future: save/load programs
#   admin: 2           — can manage users via UsersController
#
# There is no role value of 0. The enum starts at 1 because "guest" is not
# a database concept — an unauthenticated visitor is simply Current.user.nil?.
class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  enum :role, { user: 1, admin: 2 }, default: :user, validate: true

  validates :email_address, presence: true, uniqueness: true
  validates :user_name, presence: true, uniqueness: true

  # Internal: Normalize email_address by stripping whitespace and
  # downcasing before storage.
  normalizes :email_address, with: ->(e) { e.strip.downcase }

  # Internal: Normalize user_name by stripping whitespace and downcasing
  # before storage, matching the email_address normalization pattern.
  normalizes :user_name, with: ->(n) { n.strip.downcase }
end
