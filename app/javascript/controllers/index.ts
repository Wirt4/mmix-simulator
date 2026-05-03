import { application } from "./application"
import IDEFacadeController from "./ide_facade_controller"
import ResizablePanelsController from "./resizable_panels_controller"

application.register("ide-facade", IDEFacadeController)
application.register("resizable-panels", ResizablePanelsController)
