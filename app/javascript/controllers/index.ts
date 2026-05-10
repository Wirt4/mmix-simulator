import { application } from "./application"
import IDEFacadeController from "./ide_facade_controller"
import InlineEditController from "./inline_edit_controller"
import ListingPanelController from "./listing_panel_controller"
import TextFormatController from "./text_format_controller"
application.register("ide-facade", IDEFacadeController)
application.register("inline-edit", InlineEditController)
application.register("listing-panel", ListingPanelController)
application.register("text-format", TextFormatController)
