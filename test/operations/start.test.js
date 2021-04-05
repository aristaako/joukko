const {
  checkIfBranchExists,
  createCommit
} = require("../../src/utils/git")

const {
  abort,
  addJoukkoFileUnderGit,
  askBranchFromExisting,
  askUserConfirmation,
  askUserForBranchName,
  askUserInput,
  changeToBranch,
  checkJoukkoFile,
  checkoutNewLocalBranch,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  preCheckForStartOk,
  updateJoukkoBranchFileBranch
} = require("../../src/utils/joukko")

const {
  start
} = require("../../src/operations/start")

jest.mock("../../src/utils/git")
jest.mock("../../src/utils/joukko")

abort.mockReturnValue("aborted")

describe("start", () => {
  describe("starting a mob programming session aborts", () => {
    test("when the precheck fails", async () => {
      preCheckForStartOk.mockReturnValueOnce(Promise.resolve(false))
      const result = await start()
      expect(result).toEqual("aborted")
    })
    describe("with an existing joukko file", () => {
      test("when the user doesn't want to start a session", async () => {
        preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))

        const result = await start()
        expect(result).toEqual("aborted")
      })
      describe("and user naming an existing branch for the session", () => {
        test("when the user doesn't want to start the session on a branch", async () => {
          preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
          askUserConfirmation
            .mockReturnValueOnce(Promise.resolve(true))
            .mockReturnValueOnce(Promise.resolve(false))
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
          askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
          checkIfBranchExists.mockReturnValueOnce(Promise.resolve(true))

          const result = await start()
          expect(result).toEqual("aborted")
        })
        test("when the user wants to start the session on a branch but an exception is thrown", async () => {
          preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
          askUserConfirmation
            .mockReturnValueOnce(Promise.resolve(true))
            .mockReturnValueOnce(Promise.resolve(true))
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
          askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
          checkIfBranchExists.mockReturnValueOnce(Promise.resolve(true))
          checkoutUpToDateBranch.mockImplementation(() => { throw("exception") })

          const result = await start()
          expect(result).toEqual("aborted")
        })
        test("aborts when the user wants to start the session on a branch, but it already has a joukko file", async () => {
          preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
          checkJoukkoFile
            .mockReturnValueOnce(Promise.resolve(true))
            .mockReturnValueOnce(Promise.resolve(true))
          askUserConfirmation
            .mockReturnValueOnce(Promise.resolve(true))
            .mockReturnValueOnce(Promise.resolve(true))
          askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
          checkIfBranchExists.mockReturnValueOnce(Promise.resolve(true))
          checkoutUpToDateBranch.mockImplementation((branchName) => {
            console.log(`Mocking the checkout of branch '${branchName}'`)
          })

          const result = await start()
          expect(result).toEqual("aborted")
        })
      })
      describe("and user naming a new branch for the session", () => {
        test("when an exception is thrown", async () => {
          preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
          checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
          askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
          askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
          checkIfBranchExists.mockReturnValueOnce(Promise.resolve(false))
          askBranchFromExisting.mockReturnValueOnce(Promise.resolve("my-base-branch"))
          changeToBranch.mockImplementation(() => { throw("exception") })

          const result = await start()
          expect(result).toEqual("aborted")
        })
        describe("and the branch already has a joukko file", () => {
          test("when user doesn't want to rename the branch in the joukko file", async () => {
            preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
            checkIfBranchExists.mockReturnValueOnce(Promise.resolve(false))
            askBranchFromExisting.mockReturnValueOnce(Promise.resolve("my-base-branch"))
            changeToBranch.mockImplementation((branchName) => {
              console.log(`Mocking the change of a branch to '${branchName}'`)
            })
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))

            const result = await start()
            expect(result).toEqual("aborted")
          })
          test("when user wants to rename the branch in the joukko file but an exception is thrown", async () => {
            preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
            checkIfBranchExists.mockReturnValueOnce(Promise.resolve(false))
            askBranchFromExisting.mockReturnValueOnce(Promise.resolve("my-base-branch"))
            changeToBranch.mockImplementation((branchName) => {
              console.log(`Mocking the change of a branch to '${branchName}'`)
            })
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            checkoutNewLocalBranch.mockImplementation(() => { throw("exception") })

            const result = await start()
            expect(result).toEqual("aborted")
          })
        })
        describe("and the branch doesn't have a joukko file", () => {
          test("when user doesn't want to start", async () => {
            preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
            checkIfBranchExists.mockReturnValueOnce(Promise.resolve(false))
            askBranchFromExisting.mockReturnValueOnce(Promise.resolve("my-base-branch"))
            changeToBranch.mockImplementation((branchName) => {
              console.log(`Mocking the change of a branch to '${branchName}'`)
            })
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))

            const result = await start()
            expect(result).toEqual("aborted")
          })
          test("when user wants to start but an exception is thrown", async () => {
            preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
            checkIfBranchExists.mockReturnValueOnce(Promise.resolve(false))
            askBranchFromExisting.mockReturnValueOnce(Promise.resolve("my-base-branch"))
            changeToBranch.mockImplementation((branchName) => {
              console.log(`Mocking the change of a branch to '${branchName}'`)
            })
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            checkoutNewLocalBranch.mockImplementation(() => { throw("exception") })

            const result = await start()
            expect(result).toEqual("aborted")
          })
        })
      })
    })
    describe("without an existing joukko file", () => {
      test("when the user doesn't want to start a session", async () => {
        preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(false))

        const result = await start()
        expect(result).toEqual("aborted")
      })
      test("when the user wants to start a session but the branch has a joukko file", async () => {
        preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        checkoutUpToDateBranch.mockImplementation((branchName) => {
          console.log(`Mocking the checkout of an up to date branch '${branchName}'`)
        })
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))

        const result = await start()
        expect(result).toEqual("aborted")
      })
      test("when the user wants to start a session but an exception is thrown", async () => {
        preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        checkoutUpToDateBranch.mockImplementation((branchName) => {
          console.log(`Mocking the checkout of an up to date branch '${branchName}'`)
        })
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        createJoukkoBranchFile.mockImplementation(() => { throw("exception") })

        const result = await start()
        expect(result).toEqual("aborted")
      })
    })
  })
  describe("starting a mob programming session succeeds", () => {
    describe("with an existing joukko file", () => {
      describe("and user naming an existing branch for the session", () => {
        test("when the user wants to start the session on a branch which doesn't have a joukko file", async () => {
          preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
          checkJoukkoFile
            .mockReturnValueOnce(Promise.resolve(true))
            .mockReturnValueOnce(Promise.resolve(false))
          askUserConfirmation
            .mockReturnValueOnce(Promise.resolve(true))
            .mockReturnValueOnce(Promise.resolve(true))
          askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
          checkIfBranchExists.mockReturnValueOnce(Promise.resolve(true))
          checkoutUpToDateBranch.mockImplementationOnce((branchName) => {
            console.log(`Mocking the checkout of branch '${branchName}'`)
          })
          createJoukkoBranchFile.mockImplementationOnce(() => {
            console.log(`Mocking the creation of joukko file`)
          })
          askUserInput.mockReturnValueOnce(Promise.resolve("My commit message"))
          addJoukkoFileUnderGit.mockImplementationOnce(() => {
            console.log(`Mocking the addition of joukko file under git`)
          })
          createCommit.mockImplementationOnce(() => {
            console.log(`Mocking the creation of a commit`)
          })

          const result = await start()
          expect(result).toEqual("Mob programming session started with joukko.")
        })
      })
      describe("and user naming a new branch for the session", () => {
        describe("and the branch already has a joukko file", () => {
          test("when user wants to rename the branch in the joukko file", async () => {
            preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
            checkIfBranchExists.mockReturnValueOnce(Promise.resolve(false))
            askBranchFromExisting.mockReturnValueOnce(Promise.resolve("my-base-branch"))
            changeToBranch.mockImplementationOnce((branchName) => {
              console.log(`Mocking the change of a branch to '${branchName}'`)
            })
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            checkoutNewLocalBranch.mockImplementationOnce((branchName) => {
              console.log(`Mocking the checkout of a new local branch '${branchName}'`)
            })
            updateJoukkoBranchFileBranch.mockImplementationOnce(() => {
              console.log(`Mocking the branch name update in the joukko file`)
            })
            askUserInput.mockReturnValueOnce(Promise.resolve("My commit message"))
            addJoukkoFileUnderGit.mockImplementationOnce(() => {
              console.log(`Mocking the addition of joukko file under git`)
            })
            createCommit.mockImplementationOnce(() => {
              console.log(`Mocking the creation of a commit`)
            })

            const result = await start()
            expect(result).toEqual("Mob programming session started with joukko.")
          })
        })
        describe("and the branch doesn't have a joukko file", () => {
          test("when user wants to start", async () => {
            preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(true))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
            checkIfBranchExists.mockReturnValueOnce(Promise.resolve(false))
            askBranchFromExisting.mockReturnValueOnce(Promise.resolve("my-base-branch"))
            changeToBranch.mockImplementation((branchName) => {
              console.log(`Mocking the change of a branch to '${branchName}'`)
            })
            checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
            askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
            checkoutNewLocalBranch.mockImplementationOnce((branchName) => {
              console.log(`Mocking the checkout of a new local branch '${branchName}'`)
            })
            createJoukkoBranchFile.mockImplementationOnce(() => {
              console.log(`Mocking the creation of joukko file`)
            })
            askUserInput.mockReturnValueOnce(Promise.resolve("My commit message"))
            addJoukkoFileUnderGit.mockImplementationOnce(() => {
              console.log(`Mocking the addition of joukko file under git`)
            })
            createCommit.mockImplementationOnce(() => {
              console.log(`Mocking the creation of a commit`)
            })

            const result = await start()
            expect(result).toEqual("Mob programming session started with joukko.")
          })
        })
      })
    })
    describe("without an existing joukko file", () => {
      test("when the user wants to start a session", async () => {
        preCheckForStartOk.mockReturnValueOnce(Promise.resolve(true))
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        askUserForBranchName.mockReturnValueOnce(Promise.resolve("my-branch"))
        askUserConfirmation.mockReturnValueOnce(Promise.resolve(true))
        checkoutUpToDateBranch.mockImplementation((branchName) => {
          console.log(`Mocking the checkout of an up to date branch '${branchName}'`)
        })
        checkJoukkoFile.mockReturnValueOnce(Promise.resolve(false))
        createJoukkoBranchFile.mockImplementation(() => {
          console.log(`Mocking the creation of joukko file`)
        })
        askUserInput.mockReturnValueOnce(Promise.resolve("My commit message"))
        addJoukkoFileUnderGit.mockImplementationOnce(() => {
          console.log(`Mocking the addition of joukko file under git`)
        })
        createCommit.mockImplementationOnce(() => {
          console.log(`Mocking the creation of a commit`)
        })

        const result = await start()
        expect(result).toEqual("Mob programming session started with joukko.")
      })
    })
  })
})
