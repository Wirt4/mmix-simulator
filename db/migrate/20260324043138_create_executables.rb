class CreateExecutables < ActiveRecord::Migration[8.1]
  def change
    create_table :executables do |t|
      t.references :program, null: false, foreign_key: true

      t.timestamps
    end
  end
end
