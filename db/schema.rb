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

ActiveRecord::Schema[8.1].define(version: 2026_04_02_144212) do
  create_table "mmixal_programs", force: :cascade do |t|
    t.binary "binary"
    t.text "body"
    t.datetime "created_at", null: false
    t.boolean "successfully_assembled"
    t.string "title"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_mmixal_programs_on_user_id"
  end

  create_table "outputs", force: :cascade do |t|
    t.text "console_output"
    t.datetime "created_at", null: false
    t.integer "exit_value"
    t.string "flags"
    t.integer "mmixal_program_id", null: false
    t.text "trace_output"
    t.datetime "updated_at", null: false
    t.index ["mmixal_program_id"], name: "index_outputs_on_mmixal_program_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
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

  add_foreign_key "mmixal_programs", "users"
  add_foreign_key "outputs", "mmixal_programs"
  add_foreign_key "sessions", "users"
end
