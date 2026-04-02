# Public: Base mailer class. Sets default sender and layout for all mailers.
class ApplicationMailer < ActionMailer::Base
  default from: "from@example.com"
  layout "mailer"
end
