class RemoveExecutableFromOutput < ActiveRecord::Migration[8.1]
  def change
    remove_reference :output, :executable, foreign_key: true
  end
end
