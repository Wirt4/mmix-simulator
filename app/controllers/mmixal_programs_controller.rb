class MMIXALProgramsController < ApplicationController
  def index
    @mmixal_programs = Current.user.mmixal_programs
  end

  def create
    title = MMIXALProgram.default_title_for(Current.user)
    program = Current.user.mmixal_programs.create!(title: title)
    redirect_to program
  end

  def show
    @mmixal_program = MMIXALProgram.find(params[:id])
  end

  def update
      @mmixal_program = MMIXALProgram.find params[:id]
      @mmixal_program.update(params.expect(mmixal_program: [ :title, :source ]))
      @mmixal_program.save!
  end


  def destroy
    Current.user.mmixal_programs.find(params[:id]).destroy
    redirect_to mmixal_programs_url, status: :see_other
  end
end
