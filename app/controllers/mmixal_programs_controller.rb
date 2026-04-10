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
    @mmixal_program = MMIXALProgram.find(params[:token])
  end

  def destroy
    Current.user.mmixal_programs.find(params[:token]).destroy
    redirect_to mmixal_programs_url, status: :see_other
  end
end
