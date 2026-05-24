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

let _lastApp: Application | null = null

async function connectController(adapter: IModuleAdapter): Promise<{ root: HTMLElement; app: Application }> {
  mockedFactory.mockResolvedValue(adapter)

  const root = buildIDEDOM()
  document.body.innerHTML = ""
  document.body.appendChild(root)

  const app = Application.start()
  app.register("ide-facade", IDEFacadeController)
  //odd global var here for such an involved method
  _lastApp = app

  await vi.waitFor(() => {
    const container = root.querySelector("[data-ide-facade-target='specialContainer']")
    if (container?.innerHTML === "") throw new Error("registers not rendered yet")
  })

  return { root, app }
}

class DOMTargets {
  constructor(private root: HTMLElement) { }
  get(name: string): HTMLElement {
    const element: HTMLElement | null = this.root.querySelector(`[data-ide-facade-target="${name}"]`)
    if (element === null) throw new Error(`could not retrieve target ${name}`)
    return element
  }
}
//ADT mockAppInstance
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
      if (container?.innerHTML === "") throw new Error("registers not rendered yet")
    })

  }

  getTargetElement(name: string): HTMLElement {
    return this.targets.get(name)
  }

  reset(): void {
    document.body.innerHTML = ""
    if (this.stimulusApp === null) return
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
    appInstance.reset()
  })

  it("initial state after connect", async () => {
    //    const adapter = createMockAdapter()
    await appInstance.init(createMockAdapter())
    // const { root } = await connectController(adapter)

    expect(appInstance.root.innerHTML).toMatchSnapshot()
  })

  // it("special registers after connect", async () => {
  //   const adapter = createMockAdapter()
  //   const { root } = await connectController(adapter)
  //   const target = new DOMTargets(root)
  //   const specialContainer = target.get("specialContainer")
  //
  //   expect(specialContainer.innerHTML).toMatchSnapshot()
  // })
  //
  // it("general registers and dropdown after connect", async () => {
  //   const adapter = createMockAdapter()
  //   const { root } = await connectController(adapter)
  //   const targets = new DOMTargets(root)
  //   const generalContainer = targets.get("generalContainer")
  //   const groupSelect = targets.get("groupSelect")
  //
  //   expect(groupSelect.innerHTML).toMatchSnapshot()
  //   expect(generalContainer.innerHTML).toMatchSnapshot()
  // })
  //
  // it("listing panel collapsed on connect", async () => {
  //   const adapter = createMockAdapter()
  //   const { root } = await connectController(adapter)
  //   const target = new DOMTargets(root)
  //
  //   const panel = target.get("panel")
  //
  //   expect(panel.outerHTML).toMatchSnapshot()
  // })
  //
  // it("assembling bad code", async () => {
  //   const adapter = createMockAdapter({
  //     assembleMMIXAL: vi.fn().mockReturnValue(false),
  //     getStdErr: vi.fn().mockReturnValue("Error at line 1: unknown opcode 'BAD'"),
  //   })
  //   const { root } = await connectController(adapter)
  //   const targets = new DOMTargets(root)
  //   // Type bad source and assemble
  //   const textarea = targets.get("textarea") as HTMLTextAreaElement
  //   textarea.value = "BAD CODE"
  //   const assembleBtn = targets.get("assembleButton") as HTMLButtonElement
  //
  //   assembleBtn.click()
  //
  //   const outputTextarea = targets.get("output").querySelector("textarea")
  //   if (outputTextarea === null) {
  //     expect(outputTextarea).not.toBeNull()
  //     return
  //   }
  //   const runBtn = targets.get("runButton") as HTMLButtonElement
  //   const listingToggle = targets.get("listingToggle") as HTMLButtonElement
  //   const panel = targets.get("panel")
  //
  //   expect(outputTextarea.value).toMatchSnapshot()
  //   expect(runBtn.disabled).toBe(true)
  //   expect(listingToggle.disabled).toBe(true)
  //   expect(panel.outerHTML).toMatchSnapshot()
  // })
  //
  // it("assembling good code", async () => {
  //   const listing = "001: e3ff0001  SETL $255,1\n002: 00000000  TRAP 0,Halt,0\n"
  //   const adapter = createMockAdapter({
  //     assembleMMIXAL: vi.fn().mockReturnValue(true),
  //     getListing: vi.fn().mockReturnValue(listing),
  //   })
  //   const { root } = await connectController(adapter)
  //   const targets = new DOMTargets(root)
  //   const textarea = targets.get("textarea") as HTMLTextAreaElement
  //   textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"
  //   const assembleBtn = targets.get("assembleButton") as HTMLButtonElement
  //
  //   assembleBtn.click()
  //
  //   const listingEl = targets.get("listing")
  //   const runBtn = targets.get("runButton") as HTMLButtonElement
  //   const listingToggle = targets.get("listingToggle") as HTMLButtonElement
  //   const panel = targets.get("panel")
  //   expect(listingEl.textContent).toMatchSnapshot()
  //   expect(runBtn.disabled).toBe(false)
  //   expect(listingToggle.disabled).toBe(false)
  //   expect(panel.outerHTML).toMatchSnapshot()
  // })
  //
  // it("saving code trims trailing newlines", async () => {
  //   const adapter = createMockAdapter()
  //   const { root, app } = await connectController(adapter)
  //   const targets = new DOMTargets(root)
  //   const textarea = targets.get("textarea") as HTMLTextAreaElement
  //   textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n\n\n\n"
  //   const ctrl = app.getControllerForElementAndIdentifier(root, "ide-facade") as IDEFacadeController
  //
  //   ctrl.beforeSave()
  //
  //   expect(textarea.value).toMatchSnapshot()
  // })
  //
  // it("assembling and running good code", async () => {
  //   const listing = "001: e3ff0001  SETL $255,1\n002: 00000000  TRAP 0,Halt,0\n"
  //   const adapter = createMockAdapter({
  //     assembleMMIXAL: vi.fn().mockReturnValue(true),
  //     getListing: vi.fn().mockReturnValue(listing),
  //     getStdOut: vi.fn().mockReturnValue("Hello, MMIX!\n"),
  //     isHalted: vi.fn().mockReturnValueOnce(false).mockReturnValue(true),
  //     getSpecialRegisterValue: vi.fn().mockReturnValue("0x00000000000000FC"),
  //     getGeneralRegisterValue: vi.fn().mockImplementation((i: number) =>
  //       i === 255 ? "0x0000000000000001" : "0x0000000000000000"
  //     ),
  //   })
  //   const { root } = await connectController(adapter)
  //   const targets = new DOMTargets(root)
  //   const textarea = targets.get("textarea") as HTMLTextAreaElement
  //   textarea.value = " SETL $255,1\n TRAP 0,Halt,0\n"
  //   const assembleBtn = targets.get("assembleButton") as HTMLButtonElement
  //   assembleBtn.click()
  //   const runBtn = targets.get("runButton") as HTMLButtonElement
  //
  //   runBtn.click()
  //
  //   const outputTextarea = targets.get("output").querySelector("textarea")
  //   if (outputTextarea === null) {
  //     expect(outputTextarea).not.toBeNull()
  //     return
  //   }
  //   const specialContainer = targets.get("specialContainer")
  //   const generalContainer = targets.get("generalContainer")
  //   expect(outputTextarea.value).toMatchSnapshot()
  //   expect(specialContainer.innerHTML).toMatchSnapshot()
  //   expect(generalContainer.innerHTML).toMatchSnapshot()
  //   const subpanelBodies = root.querySelectorAll(".register-subpanel-body")
  //   const arrows = root.querySelectorAll(".spin-arrow")
  //   expect(
  //     Array.from(subpanelBodies).map(el => el.classList.contains("register-subpanel-body--collapsed"))
  //   ).toMatchSnapshot()
  //   expect(
  //     Array.from(arrows).map(el => el.classList.contains("spin-arrow--open"))
  //   ).toMatchSnapshot()
  // })
})
