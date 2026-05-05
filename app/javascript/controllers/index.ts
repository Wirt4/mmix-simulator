import { application } from "./application"
import IDEFacadeController from "./ide_facade_controller"
import LineNumbersController from "./line_numbers_controller"
import TextFormatController from "./text_format_controller"
application.register("ide-facade", IDEFacadeController)
application.register("text-format", TextFormatController)
