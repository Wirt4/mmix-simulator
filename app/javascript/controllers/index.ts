import { application } from "./application"
import IDEFacadeController from "./ide_facade_controller"
import InlineEditController from "./inline_edit_controller"
application.register("ide-facade", IDEFacadeController)
application.register("inline-edit", InlineEditController)
