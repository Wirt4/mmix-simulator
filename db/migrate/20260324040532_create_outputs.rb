class CreateOutputs < ActiveRecord::Migration[8.1]
  def change
    create_table :outputs do |t|
      t.text :console_output
      t.references :executable, null: false, foreign_key: true

      t.timestamps
    end
  end
end
