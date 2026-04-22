import { Application } from "@hotwired/stimulus"
import "./application.interface"

const application = Application.start()

application.debug = false
window.Stimulus = application

export { application }
