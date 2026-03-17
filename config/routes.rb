Rails.application.routes.draw do
  resource :session
  resource :registration, only: [ :new, :create ]
  resources :passwords, param: :token

  get "up" => "rails/health#show", as: :rails_health_check
  resources :users

  root "console#index"
end
