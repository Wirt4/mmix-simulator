class AddExecutableToOutputs < ActiveRecord::Migration[8.1]
  def change
    add_reference :outputs, :executable, null: false, foreign_key: true
  end
end
