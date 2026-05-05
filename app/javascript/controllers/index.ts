import { application } from "./application"
import IDEFacadeController from "./ide_facade_controller"
import ResizablePanelsController from "./resizable_panels_controller"
import ResizableOutputPanelController from "./resizable_output_panel_controller"

application.register("ide-facade", IDEFacadeController)
application.register("resizable-panels", ResizablePanelsController)
application.register("resizable-output-panel", ResizableOutputPanelController)
