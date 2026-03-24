# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_24_043138) do
  create_table "executables", force: :cascade do |t|
    t.binary "bin"
    t.datetime "created_at", null: false
    t.integer "program_id", null: false
    t.datetime "updated_at", null: false
    t.index ["program_id"], name: "index_executables_on_program_id"
  end

  create_table "outputs", force: :cascade do |t|
    t.text "console_output"
    t.datetime "created_at", null: false
    t.integer "executable_id", null: false
    t.integer "exit_value"
    t.string "flags"
    t.text "trace_output"
    t.datetime "updated_at", null: false
    t.index ["executable_id"], name: "index_outputs_on_executable_id"
  end

  create_table "programs", force: :cascade do |t|
    t.text "body"
    t.datetime "created_at", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_programs_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "sources", force: :cascade do |t|
    t.text "body"
    t.datetime "created_at", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sources_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email_address"
    t.string "password_digest"
    t.integer "role", default: 1, null: false
    t.datetime "updated_at", null: false
    t.string "user_name"
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
    t.index ["user_name"], name: "index_users_on_user_name", unique: true
  end

  add_foreign_key "executables", "programs"
  add_foreign_key "outputs", "executables"
  add_foreign_key "programs", "users"
  add_foreign_key "sessions", "users"
  add_foreign_key "sources", "users"
end
