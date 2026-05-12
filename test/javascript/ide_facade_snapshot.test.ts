import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Application } from "@hotwired/stimulus"
import IDEFacadeController from "../../app/javascript/controllers/ide_facade_controller"
import { IModuleAdapter } from "../../app/javascript/moduleAdapter/module_adapter.interface"

vi.mock("../../app/javascript/moduleAdapter/factory", () => ({
  default: vi.fn(),
}))

import moduleAdapterFactory from "../../app/javascript/moduleAdapter/factory"
const mockedFactory = vi.mocked(moduleAdapterFactory)

function createMockAdapter(overrides: Partial<IModuleAdapter> = {}): IModuleAdapter {
  return {
    assembleMMIXAL: vi.fn().mockReturnValue(true),
    getStdOut: vi.fn().mockReturnValue(""),
    getStdErr: vi.fn().mockReturnValue(""),
    finalizeMMIX: vi.fn(),
    isHalted: vi.fn().mockReturnValue(true),
    initializeMMIX: vi.fn(),
    performInstructions: vi.fn(),
    getGeneralRegisterValue: vi.fn().mockReturnValue("0x0000000000000000"),
    getSpecialRegisterValue: vi.fn().mockReturnValue("0x0000000000000000"),
    generalRegisterCount: 256,
    getListing: vi.fn().mockReturnValue(""),
    ...overrides,
  }
}

/** Builds the DOM structure that matches _editor.html.erb + _registers.html.erb */
function buildIDEDOM(): HTMLElement {
  const root = document.createElement("div")
  root.setAttribute("data-controller", "ide-facade")
  root.innerHTML = `
    <div class="ide-content">
      <div class="ide-main">
        <div class="panel-header">
          <span class="panel-header-label">Source</span>
          <button type="button" class="listing-toggle" disabled data-ide-facade-target="listingToggle">listing</button>
        </div>
        <div class="editor-container" data-ide-facade-target="panel">
          <div class="editor-body">
            <div class="line-numbers"><span>1</span></div>
            <textarea class="editor-textarea"
              data-ide-facade-target="textarea"
              spellcheck="false"></textarea>
            <div class="listing-divider"></div>
            <div class="listing-pane">
              <div data-ide-facade-target="listing" class="listing-content"></div>
            </div>
          </div>
        </div>
        <div class="output-panel">
          <textarea class="output-textarea" readonly data-ide-facade-target="output"></textarea>
        </div>
      </div>
      <div class="register-panel">
        <div class="register-header">Registers</div>
        <div class="register-panel-scroll">
          <div class="register-subpanel">
            <div class="register-subpanel-header register-subpanel-header--toggle">
              <span class="spin-arrow">&#9656;</span>
              Special Purpose
            </div>
            <div class="register-subpanel-body register-subpanel-body--collapsed" data-ide-facade-target="specialBody">
              <div class="register-group-container" data-ide-facade-target="specialContainer"></div>
            </div>
          </div>
          <div class="register-subpanel">
            <div class="register-subpanel-header register-subpanel-header--toggle">
              <span class="spin-arrow">&#9656;</span>
              General Purpose
            </div>
            <div class="register-subpanel-body register-subpanel-body--collapsed" data-ide-facade-target="generalBody">
              <div class="register-group-controls">
                <select class="register-group-select" data-ide-facade-target="groupSelect"></select>
              </div>
              <div class="register-group-container" data-ide-facade-target="generalContainer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="editor-actions ide-layout-actions">
      <button type="button" class="btn--tactile" data-ide-facade-target="assembleButton" data-action="click->ide-facade#assembleUserProgram">Assemble</button>
      <button type="button" class="btn--tactile btn--tactile--alert" data-ide-facade-target="runButton" data-action="click->ide-facade#runUserProgram">Run</button>
      <input type="submit" class="btn--tactile" value="Save" data-action="click->ide-facade#beforeSave">
    </div>
  `
  return root
}

let _lastApp: Application | null = null

async function connectController(adapter: IModuleAdapter): Promise<{ root: HTMLElement; app: Application }> {
  mockedFactory.mockResolvedValue(adapter)

  const root = buildIDEDOM()
  document.body.innerHTML = ""
  document.body.appendChild(root)

  const app = Application.start()
  app.register("ide-facade", IDEFacadeController)
  _lastApp = app

  // Wait for the async connect (moduleAdapterFactory promise)
  await vi.waitFor(() => {
    const container = root.querySelector("[data-ide-facade-target='specialContainer']")!
    if (container.innerHTML === "") throw new Error("registers not rendered yet")
  })

  return { root, app }
}

function getTarget(root: HTMLElement, name: string): HTMLElement {
  return root.querySelector(`[data-ide-facade-target="${name}"]`)!
}

describe("IDE facade UI snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ""
  })

  afterEach(() => {
    _lastApp?.stop()
    _lastApp = null
  })

  it("initial state after connect", async () => {
    const adapter = createMockAdapter()
    const { root } = await connectController(adapter)

    expect(root.innerHTML).toMatchSnapshot()
  })

  it("special registers after connect", async () => {
    const adapter = createMockAdapter()
    const { root } = await connectController(adapter)

    const specialContainer = getTarget(root, "specialContainer")
    expect(specialContainer.innerHTML).toMatchSnapshot()
  })

  it("general registers and dropdown after connect", async () => {
    const adapter = createMockAdapter()
    const { root } = await connectController(adapter)

    const generalContainer = getTarget(root, "generalContainer")
    const groupSelect = getTarget(root, "groupSelect")
    expect(groupSelect.innerHTML).toMatchSnapshot()
    expect(generalContainer.innerHTML).toMatchSnapshot()
  })

  it("listing panel collapsed on connect", async () => {
    const adapter = createMockAdapter()
    const { root } = await connectController(adapter)

    const panel = getTarget(root, "panel")
    expect(panel.outerHTML).toMatchSnapshot()
  })

  it("assembling bad code", async () => {
    const adapter = createMockAdapter({
      assembleMMIXAL: vi.fn().mockReturnValue(false),
      getStdErr: vi.fn().mockReturnValue("Error at line 1: unknown opcode 'BAD'"),
    })
    const { root } = await connectController(adapter)

    // Type bad source and assemble
    const textarea = getTarget(root, "textarea") as HTMLTextAreaElement
    textarea.value = "BAD CODE"

    const assembleBtn = getTarget(root, "assembleButton") as HTMLButtonElement
    assembleBtn.click()

    const output = getTarget(root, "output") as HTMLTextAreaElement
    const runBtn = getTarget(root, "runButton") as HTMLButtonElement
    const listingToggle = getTarget(root, "listingToggle") as HTMLButtonElement
    const panel = getTarget(root, "panel")

    expect(output.value).toMatchSnapshot()
    expect(runBtn.disabled).toBe(true)
    expect(listingToggle.disabled).toBe(true)
    expect(panel.outerHTML).toMatchSnapshot()
  })

  it("assembling good code", async () => {
    const listing = "001: e3ff0001  SETL $255,1\n002: 00000000  TRAP 0,Halt,0\n"
    const adapter = createMockAdapter({
      assembleMMIXAL: vi.fn().mockReturnValue(true),
      getListing: vi.fn().mockReturnValue(listing),
    })
    const { root } = await connectController(adapter)

    const textarea = getTarget(root, "textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"

    const assembleBtn = getTarget(root, "assembleButton") as HTMLButtonElement
    assembleBtn.click()

    const listingEl = getTarget(root, "listing")
    const runBtn = getTarget(root, "runButton") as HTMLButtonElement
    const listingToggle = getTarget(root, "listingToggle") as HTMLButtonElement
    const panel = getTarget(root, "panel")

    expect(listingEl.textContent).toMatchSnapshot()
    expect(runBtn.disabled).toBe(false)
    expect(listingToggle.disabled).toBe(false)
    expect(panel.outerHTML).toMatchSnapshot()
  })

  it("saving code trims trailing newlines", async () => {
    const adapter = createMockAdapter()
    const { root, app } = await connectController(adapter)

    const textarea = getTarget(root, "textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n\n\n\n"

    const ctrl = app.getControllerForElementAndIdentifier(root, "ide-facade") as IDEFacadeController
    ctrl.beforeSave()

    expect(textarea.value).toMatchSnapshot()
  })

  it("assembling and running good code", async () => {
    const listing = "001: e3ff0001  SETL $255,1\n002: 00000000  TRAP 0,Halt,0\n"
    const adapter = createMockAdapter({
      assembleMMIXAL: vi.fn().mockReturnValue(true),
      getListing: vi.fn().mockReturnValue(listing),
      getStdOut: vi.fn().mockReturnValue("Hello, MMIX!\n"),
      isHalted: vi.fn().mockReturnValueOnce(false).mockReturnValue(true),
      getSpecialRegisterValue: vi.fn().mockReturnValue("0x00000000000000FC"),
      getGeneralRegisterValue: vi.fn().mockImplementation((i: number) =>
        i === 255 ? "0x0000000000000001" : "0x0000000000000000"
      ),
    })
    const { root } = await connectController(adapter)

    // Assemble
    const textarea = getTarget(root, "textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"

    const assembleBtn = getTarget(root, "assembleButton") as HTMLButtonElement
    assembleBtn.click()

    // Run
    const runBtn = getTarget(root, "runButton") as HTMLButtonElement
    runBtn.click()

    const output = getTarget(root, "output") as HTMLTextAreaElement
    const specialContainer = getTarget(root, "specialContainer")
    const generalContainer = getTarget(root, "generalContainer")

    expect(output.value).toMatchSnapshot()
    expect(specialContainer.innerHTML).toMatchSnapshot()
    expect(generalContainer.innerHTML).toMatchSnapshot()

    // Register subpanels should be opened after run
    const subpanelBodies = root.querySelectorAll(".register-subpanel-body")
    const arrows = root.querySelectorAll(".spin-arrow")
    expect(
      Array.from(subpanelBodies).map(el => el.classList.contains("register-subpanel-body--collapsed"))
    ).toMatchSnapshot()
    expect(
      Array.from(arrows).map(el => el.classList.contains("spin-arrow--open"))
    ).toMatchSnapshot()
  })
})
