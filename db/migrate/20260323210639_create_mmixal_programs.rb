class CreateMmixalPrograms < ActiveRecord::Migration[8.1]
  def change
    create_table :mmixal_programs do |t|
      t.string :title
      t.text :source
      t.binary :binary
      t.boolean :successfully_assembled
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
