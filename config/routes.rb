Rails.application.routes.draw do
  resource :session, only: [ :new, :create, :destroy ]
  get "session/logout", to: "sessions#destroy", as: :logout

  resource :registration, only: [ :new, :create ]
  resources :passwords, param: :token

  get "up" => "rails/health#show", as: :rails_health_check
  resources :users, only: [ :index, :edit, :update, :destroy ]

  root "console#index"
end
