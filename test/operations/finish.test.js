const {
  addAllFiles,
  amendCommit,
  createCommit,
  getPreviousCommitMessage,
  hasChanges,
  hasUntracked,
  undoLatestCommit,
} = require("../../src/utils/git")

const {
  abort,
  askUserConfirmation,
  askUserInput,
  checkJoukkoFile,
  createJoukkoBranchFile,
  preCheckForFinishAndPassOk,
  pushToBranch,
  readJoukkoFileBranch,
  removeJoukkoBranchFile,
} = require("../../src/utils/joukko")

const {
  finish
} = require("../../src/operations/finish")

jest.mock("../../src/utils/git")
jest.mock("../../src/utils/joukko")

abort.mockReturnValue("aborted")

describe("finish", () => {
  describe("finishing the mob session aborts", () => {
    test("when the precheck fails", async () => {
      preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(false))

      const result = await finish()
      expect(result).toEqual("aborted")
    })
    describe("with changes", () => {
      describe("and with a new commit", () => {
        test("when the initial push fails and so does the following force push", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(true))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
          askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
          removeJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the removal of branch file")
          })
          addAllFiles.mockImplementationOnce(() => {
            console.log("Mocking the staging of changes")
          })
          createCommit.mockImplementationOnce(() => {
            console.log("Mocking the commit creation")
          })
          pushToBranch.mockImplementationOnce(() => { throw("error") })
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
          pushToBranch.mockImplementationOnce(() => { throw("error") })
          undoLatestCommit.mockImplementationOnce(() => {
            console.log("Mocking the undo of the latest commit")
          })
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
          createJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the recreation of the joukko file")
          })

          const result = await finish()
          expect(result).toEqual("aborted")
        })
      })
      describe("and with amending", () => {
        test("when the commit amendation fails", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(true))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
          removeJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the removal of branch file")
          })
          addAllFiles.mockImplementationOnce(() => {
            console.log("Mocking the staging of changes")
          })
          amendCommit.mockImplementationOnce(() => { throw("error") })
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
          createJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the recreation of the joukko file")
          })

          const result = await finish()
          expect(result).toEqual("aborted")
        })
        test("when the force push fails", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(true))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
          removeJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the removal of branch file")
          })
          addAllFiles.mockImplementationOnce(() => {
            console.log("Mocking the staging of changes")
          })
          amendCommit.mockImplementationOnce(() => {
            console.log("Mocking the commit amendation")
          })
          pushToBranch.mockImplementationOnce(() => { throw("error") })
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
          createJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the recreation of the joukko file")
          })

          const result = await finish()
          expect(result).toEqual("aborted")
        })
      })
    })
    describe("without changes", () => {
      describe("and with a new commit", () => {
        test("when the initial push fails and user doesn't want to force push", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(false))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
          askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
          removeJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the removal of branch file")
          })
          addAllFiles.mockImplementationOnce(() => {
            console.log("Mocking the staging of changes")
          })
          createCommit.mockImplementationOnce(() => {
            console.log("Mocking the commit creation")
          })
          pushToBranch.mockImplementationOnce(() => { throw("error") })
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
          undoLatestCommit.mockImplementationOnce(() => {
            console.log("Mocking the undo of the latest commit")
          })
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
          createJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the recreation of the joukko file")
          })

          const result = await finish()
          expect(result).toEqual("aborted")
        })
        test("when the initial push fails and so does the following force push", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(false))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
          askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
          removeJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the removal of branch file")
          })
          addAllFiles.mockImplementationOnce(() => {
            console.log("Mocking the staging of changes")
          })
          createCommit.mockImplementationOnce(() => {
            console.log("Mocking the commit creation")
          })
          pushToBranch.mockImplementationOnce(() => { throw("error") })
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
          pushToBranch.mockImplementationOnce(() => { throw("error") })
          undoLatestCommit.mockImplementationOnce(() => {
            console.log("Mocking the undo of the latest commit")
          })
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
          createJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the recreation of the joukko file")
          })

          const result = await finish()
          expect(result).toEqual("aborted")
        })
        test("when the joukko file removal fails", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(false))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
          askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
          removeJoukkoBranchFile.mockImplementationOnce(() => { throw("error") })
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))

          const result = await finish()
          expect(result).toEqual("aborted")
        })
      })
    })
  })
  describe("finishing the mob session succeeds", () => {
    describe("with changes", () => {
      test("and with a new commit", async () => {
        preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
        getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
        readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
        hasChanges.mockReturnValueOnce(Promise.resolve(true))
        hasUntracked.mockReturnValueOnce(Promise.resolve(false))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
        askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
        removeJoukkoBranchFile.mockImplementationOnce(() => {
          console.log("Mocking the removal of branch file")
        })
        addAllFiles.mockImplementationOnce(() => {
          console.log("Mocking the staging of changes")
        })
        createCommit.mockImplementationOnce(() => {
          console.log("Mocking the commit creation")
        })
        pushToBranch.mockImplementationOnce(() => {
          console.log("Mocking the push to the remote branch")
        })

        const result = await finish()
        expect(result).toEqual("Mob programming session finished with joukko.")
      })
      test("and with amending", async () => {
        preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
        getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
        readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
        hasChanges.mockReturnValueOnce(Promise.resolve(false))
        hasUntracked.mockReturnValueOnce(Promise.resolve(true))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        removeJoukkoBranchFile.mockImplementationOnce(() => {
          console.log("Mocking the removal of branch file")
        })
        addAllFiles.mockImplementationOnce(() => {
          console.log("Mocking the staging of changes")
        })
        amendCommit.mockImplementationOnce(() => {
          console.log("Mocking the commit amendation")
        })
        pushToBranch.mockImplementationOnce(() => {
          console.log("Mocking the push to the remote branch")
        })

        const result = await finish()
        expect(result).toEqual("Mob programming session finished with joukko.")
      })
    })
    describe("without any changes", () => {
      describe("and with a new commit", () => {
        test("when the initial push is accepted", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(false))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
          askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
          removeJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the removal of branch file")
          })
          addAllFiles.mockImplementationOnce(() => {
            console.log("Mocking the staging of changes")
          })
          createCommit.mockImplementationOnce(() => {
            console.log("Mocking the commit creation")
          })
          pushToBranch.mockImplementationOnce(() => {
            console.log("Mocking the push to the remote branch")
          })
  
          const result = await finish()
          expect(result).toEqual("Mob programming session finished with joukko.")
        })
        test("when the initial push fails and a force push is required", async () => {
          preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
          getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
          readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          hasChanges.mockReturnValueOnce(Promise.resolve(false))
          hasUntracked.mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
          askUserInput.mockReturnValueOnce(Promise.resolve("My new commit message"))
          removeJoukkoBranchFile.mockImplementationOnce(() => {
            console.log("Mocking the removal of branch file")
          })
          addAllFiles.mockImplementationOnce(() => {
            console.log("Mocking the staging of changes")
          })
          createCommit.mockImplementationOnce(() => {
            console.log("Mocking the commit creation")
          })
          pushToBranch.mockImplementationOnce(() => { throw("error") })
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
          pushToBranch.mockImplementationOnce(() => {
            console.log("Mocking the force push to the remote branch")
          })
  
          const result = await finish()
          expect(result).toEqual("Mob programming session finished with joukko.")
        })
      })
      test("and with amending", async () => {
        preCheckForFinishAndPassOk.mockReturnValueOnce(Promise.resolve(true))
        getPreviousCommitMessage.mockReturnValueOnce(Promise.resolve("My commit message"))
        readJoukkoFileBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
        hasChanges.mockReturnValueOnce(Promise.resolve(false))
        hasUntracked.mockReturnValueOnce(Promise.resolve(false))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        removeJoukkoBranchFile.mockImplementationOnce(() => {
          console.log("Mocking the removal of branch file")
        })
        addAllFiles.mockImplementationOnce(() => {
          console.log("Mocking the staging of changes")
        })
        amendCommit.mockImplementationOnce(() => {
          console.log("Mocking the commit amendation")
        })
        pushToBranch.mockImplementationOnce(() => {
          console.log("Mocking the push to the remote branch")
        })

        const result = await finish()
        expect(result).toEqual("Mob programming session finished with joukko.")
      })
    })
  })
})
