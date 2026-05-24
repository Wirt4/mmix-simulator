import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest"
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
        <div class="output-panel" data-ide-facade-target="output">
          <textarea class="output-textarea" readonly></textarea>
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
      <input type="text" data-ide-facade-target="arguments">
      <button type="button" data-ide-facade-target="argumentsButton">Args</button>
      <input type="submit" class="btn--tactile" value="Save" data-action="click->ide-facade#beforeSave">
    </div>
  `
  return root
}

class DOMTargets {
  constructor(private root: HTMLElement) { }
  get(name: string): HTMLElement {
    const element: HTMLElement | null = this.root.querySelector(`[data-ide-facade-target="${name}"]`)
    if (element === null) throw new Error(`could not retrieve target ${name}`)
    return element
  }
}

class MockAppInstance {
  public stimulusApp: Application | null
  public root: HTMLElement
  private targets: DOMTargets

  //sets up the DOM
  constructor() {
    if (document.body.innerHTML !== "") {
      throw new Error("innerHtml should be empty")
    }
    //wipe previous state
    this.reset()
    this.root = buildIDEDOM()
    this.targets = new DOMTargets(this.root)
    document.body.appendChild(this.root)
    // set app to null
    this.stimulusApp = null
  }

  //implements the connect() logic from stimulus: getting the app up and running
  async init(adapter: IModuleAdapter): Promise<void> {
    mockedFactory.mockResolvedValue(adapter)
    //start and register the app
    this.stimulusApp = Application.start()
    this.stimulusApp.register("ide-facade", IDEFacadeController)
    //wait for the app elements to load
    await vi.waitFor(() => {
      const container = this.getTargetElement('specialContainer')
      if (container.innerHTML === "") throw new Error("registers not rendered yet")
    })

  }

  getTargetElement(name: string): HTMLElement {
    return this.targets.get(name)
  }

  reset(): void {
    document.body.innerHTML = ""
    if (this.stimulusApp === null) return
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.stimulusApp?.stop()
    this.stimulusApp = null
  }
}

describe("IDE facade UI snapshots", () => {
  let appInstance: MockAppInstance

  beforeAll(() => {
    document.body.innerHTML = ""
  })

  beforeEach(() => {
    vi.clearAllMocks()
    appInstance = new MockAppInstance()
  })

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    appInstance?.reset()
  })

  it("initial state after connect", async () => {
    await appInstance.init(createMockAdapter())
    expect(appInstance.root.innerHTML).toMatchSnapshot()
  })

  it("special registers after connect", async () => {
    await appInstance.init(createMockAdapter())
    const specialContainer = appInstance.getTargetElement("specialContainer")
    expect(specialContainer.innerHTML).toMatchSnapshot()
  })

  it("general registers and dropdown after connect", async () => {
    await appInstance.init(createMockAdapter())
    const generalContainer = appInstance.getTargetElement("generalContainer")
    const groupSelect = appInstance.getTargetElement("groupSelect")
    expect(groupSelect.innerHTML).toMatchSnapshot()
    expect(generalContainer.innerHTML).toMatchSnapshot()
  })

  it("listing panel collapsed on connect", async () => {
    await appInstance.init(createMockAdapter())
    const panel = appInstance.getTargetElement("panel")
    expect(panel.outerHTML).toMatchSnapshot()
  })

  it("assembling bad code", async () => {
    const adapter = createMockAdapter({
      assembleMMIXAL: vi.fn().mockReturnValue(false),
      getStdErr: vi.fn().mockReturnValue("Error at line 1: unknown opcode 'BAD'"),
    })
    await appInstance.init(adapter)
    const textarea = appInstance.getTargetElement("textarea") as HTMLTextAreaElement
    textarea.value = "BAD CODE"
    const assembleBtn = appInstance.getTargetElement("assembleButton") as HTMLButtonElement

    assembleBtn.click()

    const output = appInstance.getTargetElement("output")
    const outputTextarea = output.querySelector("textarea")
    const runBtn = appInstance.getTargetElement("runButton") as HTMLButtonElement
    const listingToggle = appInstance.getTargetElement("listingToggle") as HTMLButtonElement
    const panel = appInstance.getTargetElement("panel")
    if (outputTextarea === null) {
      expect(outputTextarea).not.toBeNull()
      return
    }
    expect(outputTextarea.value).toMatchSnapshot()
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
    await appInstance.init(adapter)
    const textarea = appInstance.getTargetElement("textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"
    const assembleBtn = appInstance.getTargetElement("assembleButton") as HTMLButtonElement

    assembleBtn.click()

    const listingEl = appInstance.getTargetElement("listing")
    const runBtn = appInstance.getTargetElement("runButton") as HTMLButtonElement
    const listingToggle = appInstance.getTargetElement("listingToggle") as HTMLButtonElement
    const panel = appInstance.getTargetElement("panel")
    expect(listingEl.textContent).toMatchSnapshot()
    expect(runBtn.disabled).toBe(false)
    expect(listingToggle.disabled).toBe(false)
    expect(panel.outerHTML).toMatchSnapshot()
  })

  it("saving code trims trailing newlines", async () => {
    await appInstance.init(createMockAdapter())
    const textarea = appInstance.getTargetElement("textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n\n\n\n"
    const ctrl = appInstance.stimulusApp?.getControllerForElementAndIdentifier(appInstance.root, "ide-facade") as IDEFacadeController

    ctrl.beforeSave()

    expect(textarea.value).toMatchSnapshot()
  })

  it("good code output matches snapshot", async () => {
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
    await appInstance.init(adapter)
    const textarea = appInstance.getTargetElement("textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"
    const assembleBtn = appInstance.getTargetElement("assembleButton") as HTMLButtonElement
    assembleBtn.click()
    const runBtn = appInstance.getTargetElement("runButton") as HTMLButtonElement

    runBtn.click()

    const outputTextarea = appInstance.getTargetElement("output").querySelector("textarea")
    if (outputTextarea === null) {
      expect(outputTextarea).not.toBeNull()
      return
    }
    expect(outputTextarea.value).toMatchSnapshot()
  })

  it("good code special and general register containers outputs match snapshot", async () => {
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
    await appInstance.init(adapter)
    const textarea = appInstance.getTargetElement("textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"
    const assembleBtn = appInstance.getTargetElement("assembleButton") as HTMLButtonElement
    assembleBtn.click()
    const runBtn = appInstance.getTargetElement("runButton") as HTMLButtonElement

    runBtn.click()

    const specialContainer = appInstance.getTargetElement("specialContainer")
    const generalContainer = appInstance.getTargetElement("generalContainer")
    expect(specialContainer.innerHTML).toMatchSnapshot()
    expect(generalContainer.innerHTML).toMatchSnapshot()
  })

  it("good code run affects spinner arrow", async () => {
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
    await appInstance.init(adapter)
    const textarea = appInstance.getTargetElement("textarea") as HTMLTextAreaElement
    textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"
    const assembleBtn = appInstance.getTargetElement("assembleButton") as HTMLButtonElement
    assembleBtn.click()
    const runBtn = appInstance.getTargetElement("runButton") as HTMLButtonElement

    runBtn.click()

    const { root } = appInstance
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
