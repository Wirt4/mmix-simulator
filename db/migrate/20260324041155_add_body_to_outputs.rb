class AddBodyToOutputs < ActiveRecord::Migration[8.1]
  def change
    add_column :outputs, :body, :text
  end
end
