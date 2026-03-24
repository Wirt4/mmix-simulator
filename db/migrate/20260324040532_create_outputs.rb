class CreateOutputs < ActiveRecord::Migration[8.1]
  def change
    create_table :outputs do |t|
      t.timestamps
    end
  end
end
