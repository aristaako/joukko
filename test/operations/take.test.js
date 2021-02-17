const {
  abort,
  askBranchFromExisting,
  checkJoukkoFile,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  preCheckForTakeOk,
  readJoukkoFileBranch
} = require("../../src/utils/joukko")

const {
  take
} = require("../../src/operations/take")

jest.mock("../../src/utils/git")
jest.mock("../../src/utils/joukko")

abort.mockReturnValue("aborted")

describe("take", () => {
  describe("taking the reins aborts", () => {
    test("when the precheck fails", async () => {
      preCheckForTakeOk.mockReturnValueOnce(Promise.resolve(false))

      const result = await take()
      expect(result).toEqual("aborted")
    })
    test("when the checking out the joukko branch fails", async () => {
      preCheckForTakeOk.mockReturnValueOnce(Promise.resolve(true))
      checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
      readJoukkoFileBranch.mockReturnValueOnce("my-branch")
      checkoutUpToDateBranch.mockImplementationOnce(() => { throw("error") })

      const result = await take()
      expect(result).toEqual("aborted")
    })
  })
  describe("taking the reins succeeds", () => {
    describe("with the branch being read from an existing file", () => {
      test("and the branch containing the joukko file after checkout", async () => {
        preCheckForTakeOk.mockReturnValueOnce(Promise.resolve(true))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
        readJoukkoFileBranch.mockReturnValueOnce("my-branch")
        checkoutUpToDateBranch.mockImplementationOnce(() => {
          console.log("Mocking the checkout of up to date branch")
        })
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
  
        const result = await take()
        expect(result).toEqual("Mob Programming - Reins successfully taken with joukko.")
      })
      test("and the joukko file being created after checkout", async () => {
        preCheckForTakeOk.mockReturnValueOnce(Promise.resolve(true))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
        readJoukkoFileBranch.mockReturnValueOnce("my-branch")
        checkoutUpToDateBranch.mockImplementationOnce(() => {
          console.log("Mocking the checkout of up to date branch")
        })
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        createJoukkoBranchFile.mockImplementationOnce(() => {
          console.log("Mocking the creation of joukko branch file")
        })
        const result = await take()
        expect(result).toEqual("Mob Programming - Reins successfully taken with joukko.")
      })
    })
    describe("with the branch being asked from the user", () => {
      test("and the branch containing the joukko file after checkout", async () => {
        preCheckForTakeOk.mockReturnValueOnce(Promise.resolve(true))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        askBranchFromExisting.mockReturnValueOnce("my-branch")
        checkoutUpToDateBranch.mockImplementationOnce(() => {
          console.log("Mocking the checkout of up to date branch")
        })
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
  
        const result = await take()
        expect(result).toEqual("Mob Programming - Reins successfully taken with joukko.")
      })
    })
  })
})
