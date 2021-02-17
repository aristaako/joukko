const {
  abort,
  askUserInput,
  preCheckForRenameOk,
  renameCurrentJoukkoBranch,
} = require("../../src/utils/joukko")

const {
  log,
  logError,
} = require("../../src/utils/log")

const {
  rename,
} = require("../../src/operations/rename")

jest.mock("../../src/utils/joukko")
jest.mock("../../src/utils/log")

abort.mockReturnValue("aborted")

describe("rename", () => {
  describe("renaming joukko branch aborts", () => {
    test("when the precheck fails", async () => {
      preCheckForRenameOk.mockReturnValueOnce(Promise.resolve(false))
      const result = await rename()
      expect(result).toEqual("aborted")
    })
    test("when renameCurrentJoukkoBranch throws error", async () => {
      preCheckForRenameOk.mockReturnValueOnce(Promise.resolve(true))
      askUserInput.mockReturnValueOnce(Promise.resolve("my-improved-branch"))
      renameCurrentJoukkoBranch.mockImplementationOnce(() => { throw("rename error") })
      const logErrorFunction = jest.fn()
      let logErrorMessage
      logError.mockImplementationOnce(error => {
        logErrorFunction()
        logErrorMessage = error
      })

      const result = await rename()
      expect(logErrorFunction).toBeCalled()
      expect(logErrorMessage).toEqual("rename error")
      expect(result).toEqual("aborted")
    })
  })
  test("renaming joukko branch succeeds", async () => {
    preCheckForRenameOk.mockReturnValueOnce(Promise.resolve(true))
    askUserInput.mockReturnValueOnce(Promise.resolve("my-improved-branch"))
    const renameFunction = jest.fn()
    renameCurrentJoukkoBranch.mockImplementationOnce(() => {
      renameFunction()
    })
    log.mockImplementationOnce()
    const logFunction = jest.fn()
    let logMessage
    log.mockImplementationOnce(message => {
      logFunction()
      logMessage = message
    })

    await rename()
    expect(renameFunction).toBeCalled()
    expect(logFunction).toBeCalled()
    expect(logMessage).toEqual("Local joukko branch renamed to 'my-improved-branch'.")
  })
})
