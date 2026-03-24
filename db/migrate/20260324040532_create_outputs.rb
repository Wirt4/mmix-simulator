class CreateOutputs < ActiveRecord::Migration[8.1]
  def change
    create_table :outputs do |t|
      t.text :console_output
      t.text :trace_output
      t.integer :exit_value
      t.references :executable, null: false, foreign_key: true

      t.timestamps
    end
  end
end
