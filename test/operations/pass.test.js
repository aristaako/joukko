const {
  addAllFiles,
  amendCommit,
  createCommit,
  getPreviousCommitMessage,
  hasChanges,
  hasUntracked,
  undoLatestCommit
} = require("../../src/utils/git")

const {
  abort,
  askUserConfirmation,
  askUserInput,
  preCheckForFinishAndPassOk,
  pushToMobBranch
} = require("../../src/utils/joukko")

const {
  pass
} = require("../../src/operations/pass")

jest.mock("../../src/utils/git")
jest.mock("../../src/utils/joukko")

abort.mockReturnValue("aborted")

describe("pass", () => {
  describe("passing the torch aborts", () => {
    test("when the precheck fails", async () => {
      preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(false))

      const result = await pass()
      expect(result).toEqual("aborted")
    })
    test("when there were no changes and that was not intentional", async () => {
      preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
      hasChanges.mockReturnValueOnce(Promise.resolve(false))
      hasUntracked.mockReturnValueOnce(Promise.resolve(false))
      askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))

      const result = await pass()
      expect(result).toEqual("aborted")
    })
    describe("when there were changes", () => {
      describe("and user wants to amend", () => {
        test("but amending to previous commit failed", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          hasChanges.mockReturnValueOnce(Promise.resolve(true))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My old commit message"))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
          addAllFiles.mockImplementationOnce(() => { throw("error") })

          const result = await pass()
          expect(result).toEqual("aborted")
        })
      })
      describe("and user wants to create a new commit", () => {
        describe("and pushing a new commit initally fails", () => {
          test("and user doesn't want to force push", async () => {
            preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
            hasChanges.mockReturnValueOnce(Promise.resolve(true))
            hasUntracked.mockReturnValueOnce(Promise.resolve(false))
            getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My old commit message"))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
            askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
            addAllFiles.mockImplementationOnce(() => {
              console.log("Mocking the addition of all files to staging")
            })
            createCommit.mockImplementationOnce(() => {
              console.log("Mocking the creation of a commit")
            })
            pushToMobBranch.mockImplementationOnce(() => { throw("error") })
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
            undoLatestCommit.mockImplementationOnce(() => {
              console.log("Mocking the undo of the latest commit")
            })

            const result = await pass()
            expect(result).toEqual("aborted")
          })
          test("after which force pushing fails too", async () => {
            preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
            hasChanges.mockReturnValueOnce(Promise.resolve(true))
            hasUntracked.mockReturnValueOnce(Promise.resolve(false))
            getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My old commit message"))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
            askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
            addAllFiles.mockImplementationOnce(() => {
              console.log("Mocking the addition of all files to staging")
            })
            createCommit.mockImplementationOnce(() => {
              console.log("Mocking the creation of a commit")
            })
            pushToMobBranch.mockImplementationOnce(() => { throw("error") })
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            pushToMobBranch.mockImplementationOnce(() => { throw("error") })
            undoLatestCommit.mockImplementationOnce(() => {
              console.log("Mocking the undo of the latest commit")
            })

            const result = await pass()
            expect(result).toEqual("aborted")
          })
        })
      })
    })
  })
  describe("passing the torch succeeds", () => {
    describe("when there were no changes but that was intentional", () => {
      test("and user wants to create a new commit", async () => {
        preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
        hasChanges.mockReturnValueOnce(Promise.resolve(false))
        hasUntracked.mockReturnValueOnce(Promise.resolve(false))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My old commit message"))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
        askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
        addAllFiles.mockImplementationOnce(() => {
          console.log("Mocking the addition of all files to staging")
        })
        createCommit.mockImplementationOnce(() => {
          console.log("Mocking the creation of a commit")
        })
        pushToMobBranch.mockImplementationOnce(() => {
          console.log("Mocking the push to the mob branch")
        })

        const result = await pass()
        expect(result).toEqual("Mob programming torch passed with joukko.")
      })
      test("and user wants to amend", async () => {
        preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
        hasChanges.mockReturnValueOnce(Promise.resolve(false))
        hasUntracked.mockReturnValueOnce(Promise.resolve(false))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My old commit message"))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        addAllFiles.mockImplementationOnce(() => {
          console.log("Mocking the addition of all files to staging")
        })
        amendCommit.mockImplementationOnce(() => {
          console.log("Mocking the commit amendation")
        })
        pushToMobBranch.mockImplementationOnce(() => {
          console.log("Mocking the force push to the mob branch")
        })

        const result = await pass()
        expect(result).toEqual("Mob programming torch passed with joukko.")
      })
    })
    describe("when there were changes and user wants to create a new commit", () => {
      test("but pushing a new commit initally fails after which user force pushes", async () => {
        preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
        hasChanges.mockReturnValueOnce(Promise.resolve(true))
        hasUntracked.mockReturnValueOnce(Promise.resolve(false))
        getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My old commit message"))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
        askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
        addAllFiles.mockImplementationOnce(() => {
          console.log("Mocking the addition of all files to staging")
        })
        createCommit.mockImplementationOnce(() => {
          console.log("Mocking the creation of a commit")
        })
        pushToMobBranch.mockImplementationOnce(() => { throw("error") })
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        pushToMobBranch.mockImplementationOnce(() => {
          console.log("Mocking the force push to the mob branch")
        })

        const result = await pass()
        expect(result).toEqual("Mob programming torch passed with joukko.")
      })
    })
  })
})
