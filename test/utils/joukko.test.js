const {
  createFileWithJson,
  fileExists,
  readFileContent,
} = require("../../src/utils/file")

const {
  abortRebase,
  checkIfBranchExistsInRemote,
  checkIfBranchExistsLocally,
  checkoutBranch,
  checkoutNewBranch,
  deleteBranch,
  getCurrentBranch,
  getDefaultBranch,
  getPathForGitRoot,
  hasChanges,
  hasUntracked,
  improveKnowledgeOfRemoteBranches,
  isGitDirectory,
  updateBranchWithPullRebase,
  getStatus,
} = require("../../src/utils/git")

const {
  changeToBranch,
  changeToDefaultBranch,
  changeToJoukkoMobBranch,
  checkJoukkoFile,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  getBranchNamesForListing,
  getBranchNameFromRemotePath,
  isBranchCurrentBranch,
  isCurrentBranchTheDefaultBranch,
  isSelectedOptionValid,
  joukkoFileEmpty,
  joukkoFileHasBranchName,
  preCheckForFinishAndPassOk,
  preCheckForRenameOk,
  preCheckForStartOk,
  preCheckForTakeOk,
  readJoukkoFileBranch,
  readJoukkoFileContent,
  reCheckoutBranchFromRemote,
  updateBranch,
} = require("../../src/utils/joukko")

const {
  log,
  logError,
  logWarning,
} = require("../../src/utils/log")

const {
  getUserConfirmation,
} = require("../../src/utils/userInput")

jest.mock("../../src/utils/file")
jest.mock("../../src/utils/git")
jest.mock("../../src/utils/log")
jest.mock("../../src/utils/userInput")

describe("joukko", () => {
  describe("getBranchNameFromRemotePath", () => {
    test("returns branch name without remote name", () => {
      const remotePathMain = "origin/main"
      const remotePathDevelop = "origin/develop"
      const remotePathAddNewFeature = "origin/add-new-feature"
      expect(getBranchNameFromRemotePath(remotePathMain)).toEqual("main")
      expect(getBranchNameFromRemotePath(remotePathDevelop)).toEqual("develop")
      expect(getBranchNameFromRemotePath(remotePathAddNewFeature)).toEqual("add-new-feature")
    })
  })
  describe("getBranchNamesForListing", () => {
    const numberColorOn = "\x1b[32m"
    const numberColorOff = "\x1b[0m"
    const remoteBranches = {
      all: [
        "origin/main",
        "origin/develop",
        "origin/add-new-feature"
      ]
    }
    test("returns only branch names when showOptionOther is false", () => { 
      const branchNamesForListing = [
        `[${numberColorOn}0${numberColorOff}]: add-new-feature`,
        `[${numberColorOn}1${numberColorOff}]: develop`,
        `[${numberColorOn}2${numberColorOff}]: main`
      ]
      expect(getBranchNamesForListing(remoteBranches, false)).toEqual(branchNamesForListing)
    })
    test("returns branch names with option 'other' when showOptionOther is true", () => {
      const branchNamesForListing = [
        `[${numberColorOn}0${numberColorOff}]: add-new-feature`,
        `[${numberColorOn}1${numberColorOff}]: develop`,
        `[${numberColorOn}2${numberColorOff}]: main`,
        `[${numberColorOn}3${numberColorOff}]: Other...`
      ]
      expect(getBranchNamesForListing(remoteBranches, true)).toEqual(branchNamesForListing)
    })
  })
  describe("isSelectedOptionValid", () => {
    test("returns true when user selection is within the option count array", () => {
      const firstSelection = "3  "
      const secondSelection = "  4"
      const thirdSelection = "0"
      const optionCount = 5
      expect(isSelectedOptionValid(firstSelection, optionCount)).toEqual(true)
      expect(isSelectedOptionValid(secondSelection, optionCount)).toEqual(true)
      expect(isSelectedOptionValid(thirdSelection, optionCount)).toEqual(true)
    })
    test("returns false when user selection does not contain a valid number", () => {
      const firstSelection = "b3"
      const secondSelection = "number"
      const optionCount = 5
      expect(isSelectedOptionValid(firstSelection, optionCount)).toEqual(false)
      expect(isSelectedOptionValid(secondSelection, optionCount)).toEqual(false)
    })
    test("returns false when user selection is not within the option count array", () => {
      const firstSelection = "-1"
      const secondSelection = "5"
      const optionCount = 5
      expect(isSelectedOptionValid(firstSelection, optionCount)).toEqual(false)
      expect(isSelectedOptionValid(secondSelection, optionCount)).toEqual(false)
    })
  })
  describe("changeToBranch", () => {
    test("throws empty branch name exception when the target branch name is empty", async () => {
      try {
        await changeToBranch("")
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Branch name is empty.")
      }
      try {
        await changeToBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Branch name is empty.")
      }
    })
    test("throws already on the branch exception when current branch is the same as the target branch", async () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
      try {
        await changeToBranch("my-branch")
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Already on the branch.")
      }
    })
    test("calls checkoutBranch function when current branch is different from the target branch", async () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
      const branchCheckoutFunction = jest.fn()
      checkoutBranch.mockImplementationOnce(() => {
        branchCheckoutFunction()
      })

      await changeToBranch("my-new-branch")
      expect(branchCheckoutFunction).toBeCalled()
    })
  })
  describe("changeToDefaultBranch", () => {
    test("throws no default branch found exception when default branch is empty", async () => {
      getDefaultBranch.mockReturnValueOnce(Promise.resolve(""))
      try {
        await changeToDefaultBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("No default branch found.")
      }
    })
    test("throws current branch is the default branch exception when already on the default branch", async () => {
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
      try {
        await changeToDefaultBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Current branch is the default branch.")
      }
    })
    test("calls checkoutBranch function when current branch is different from the default branch", async () => {
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
      const branchCheckoutFunction = jest.fn()
      checkoutBranch.mockImplementationOnce(() => {
        branchCheckoutFunction()
      })

      await changeToDefaultBranch()
      expect(branchCheckoutFunction).toBeCalled()
    })
  })
  describe("changeToJoukkoMobBranch", () => {
    test("throws no joukko mob branch given exception when no joukko branch is given", async () => {
      try {
        await changeToJoukkoMobBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("No joukko mob branch given.")
      }
    })
    test("throws current branch is the joukko mob branch exception when given joukko branch is the current branch", async () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
      try {
        await changeToJoukkoMobBranch("my-branch")
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Current branch is the joukko mob branch.")
      }
    })

    test("calls checkoutBranch when joukko mob branch is found locally", async () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
      checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(true))
      const branchCheckoutFunction = jest.fn()
      checkoutBranch.mockImplementationOnce(() => {
        return Promise.resolve(branchCheckoutFunction())
      })
      improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {
        console.log("Mocking improveKnowledgeOfRemoteBranches()")
      })
      checkIfBranchExistsInRemote.mockImplementationOnce(branchName => Promise.resolve(false))

      await changeToJoukkoMobBranch("my-mob-branch")
      expect(branchCheckoutFunction).toBeCalled()
    })
    describe("with joukko mob branch not found locally", () => {
      test("calls checkoutBranch when the joukko mob branch is found in remote", async () => {
        getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
        checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(false))
        improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {
          console.log("Mocking improveKnowledgeOfRemoteBranches()")
        })
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(true))
        const branchCheckoutFunction = jest.fn()
        checkoutBranch.mockImplementationOnce(() => {
          return Promise.resolve(branchCheckoutFunction())
        })

        await changeToJoukkoMobBranch("my-mob-branch")
        expect(branchCheckoutFunction).toBeCalled()
      })
      test("calls checkoutBranch when the joukko mob branch is not found in remote", async () => {
        getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
        checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(false))
        improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {
          console.log("Mocking improveKnowledgeOfRemoteBranches()")
        })
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(false))
        const newBranchCheckoutFunction = jest.fn()
        checkoutNewBranch.mockImplementationOnce(() => {
          return Promise.resolve(newBranchCheckoutFunction())
        })

        await changeToJoukkoMobBranch("my-mob-branch")
        expect(newBranchCheckoutFunction).toBeCalled()
      })
    })
  })
  describe("checkJoukkoFile", () => {
    describe("returns false", () => {
      test("when joukko file does not exist", () => {
        getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repoRoot"))
        fileExists.mockReturnValueOnce(Promise.resolve(false))
        
        expect(checkJoukkoFile()).resolves.toEqual(false)
      })
      test("when joukko file exists but doesn't contain branch name", () => {
        getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repoRoot"))
        fileExists.mockReturnValueOnce(Promise.resolve(true))
        getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repoRoot"))
        readFileContent.mockReturnValueOnce(Promise.resolve('{"test": "shouldFail"}'))
        
        expect(checkJoukkoFile()).resolves.toEqual(false)
      })
    })
    test("returns true when joukko file exists and contains branch name", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repoRoot"))
      fileExists.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repoRoot"))
      readFileContent.mockReturnValueOnce(Promise.resolve('{"branch": "branchName"}'))
      
      expect(checkJoukkoFile()).resolves.toEqual(true)
    })
  })
  describe("checkoutUpToDateBranch", () => {
    describe("calls checkoutBranch", () => {
      test("when branch doesn't exist in remote, but exists locally and is not the current branch", async () => {
        improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {
          console.log("Mocking improveKnowledgeOfRemoteBranches()")
        })
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(false))
        checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(true))
        getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
        const branchCheckoutFunction = jest.fn()
        checkoutBranch.mockImplementationOnce(() => {
          return Promise.resolve(branchCheckoutFunction())
        })

        await checkoutUpToDateBranch("my-branch")
        expect(branchCheckoutFunction).toBeCalled()
      })
    })
    describe("calls checkoutNewBranch", () => {
      test("when branch doesn't exist in remote or locally and is not the current branch", async () => {
        improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {
          console.log("Mocking improveKnowledgeOfRemoteBranches()")
        })
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(false))
        checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(false))
        getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
        const newBranchCheckoutFunction = jest.fn()
        checkoutNewBranch.mockImplementationOnce(() => {
          return Promise.resolve(newBranchCheckoutFunction())
        })

        await checkoutUpToDateBranch("my-branch")
        expect(newBranchCheckoutFunction).toBeCalled()
      })
    })
    describe("calls getDefaultBranch and checkoutBranch via reCheckoutBranchFromRemote", () => {
      test("when branch is found in remote", async () => {
        improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {
          console.log("Mocking improveKnowledgeOfRemoteBranches()")
        })
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(true))
        getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
        const getDefaultBranchFunction = jest.fn(() => "my-default-branch")
        getDefaultBranch.mockImplementationOnce(() => {
          console.log("Mocking the get of the default branch name")
          return Promise.resolve(getDefaultBranchFunction())
        })
        checkoutBranch.mockImplementationOnce(() => {
          console.log("Mocking the checkout of default branch")
        })
        deleteBranch.mockImplementationOnce(() => {
          console.log("Mocking the deletion of the local mob branch")
        })
        const branchCheckoutFunction = jest.fn()
        checkoutBranch.mockImplementationOnce(() => {
          console.log("Mocking the checkout of the mob branch from remote")
          return Promise.resolve(branchCheckoutFunction())
        })

        await checkoutUpToDateBranch("my-branch")
        expect(getDefaultBranchFunction).toBeCalled()
        expect(branchCheckoutFunction).toBeCalled()
      })
    })
  })
  describe("createJoukkoBranchFile", () => {
    test("calls createFileWithJson and log", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      const fileCreationFunction = jest.fn()
      createFileWithJson.mockImplementationOnce(() => {
        console.log("Mocking file creation")
        return Promise.resolve(fileCreationFunction())
      })
      const logFunction = jest.fn()
      log.mockImplementationOnce(() => {
        console.log("Mocking log")
        return Promise.resolve(logFunction())
      })

      await createJoukkoBranchFile("my-branch")
      expect(fileCreationFunction).toBeCalled()
      expect(logFunction).toBeCalled()
    })
    test("calls createFileWithJson but not log", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      const fileCreationFunction = jest.fn()
      createFileWithJson.mockImplementationOnce(() => {
        console.log("Mocking file creation")
        return Promise.resolve(fileCreationFunction())
      })
      const logFunction = jest.fn()
      log.mockImplementationOnce(() => {
        console.log("Mocking log")
        return Promise.resolve(logFunction())
      })

      await createJoukkoBranchFile("my-branch", true)
      expect(fileCreationFunction).toBeCalled()
      expect(logFunction).not.toBeCalled()
    })
    test("throws error when file creation fails", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      createFileWithJson.mockImplementationOnce(() => { throw("file creation error") })
      try {
        await createJoukkoBranchFile("my-branch")
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("file creation error")
      }
    })
  })
  describe("isBranchCurrentBranch", () => {
    test("returns true when given branch is the current branch", () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      
      expect(isBranchCurrentBranch("my-current-branch")).resolves.toEqual(true)
    })
    test("returns false when given branch is not the current branch", () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      
      expect(isBranchCurrentBranch("my-branch")).resolves.toEqual(false)
    })
  })
  describe("isCurrentBranchTheDefaultBranch", () => {
    test("returns true when current branch is the default branch", () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      
      expect(isCurrentBranchTheDefaultBranch()).resolves.toEqual(true)
    })
    test("returns false when current branch is not the default branch", () => {
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
      
      expect(isCurrentBranchTheDefaultBranch()).resolves.toEqual(false)
    })
  })
  describe("joukkoFileEmpty", () => {
    test("returns true when file has no content", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce()
      
      expect(joukkoFileEmpty()).resolves.toEqual(true)
    })
    test("returns true when file is empty", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce("")
      
      expect(joukkoFileEmpty()).resolves.toEqual(true)
    })
    test("returns true when file contains only spaces", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce("     ")
      
      expect(joukkoFileEmpty()).resolves.toEqual(true)
    })
    test("returns false when file has is not empty", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce("content")
      
      expect(joukkoFileEmpty()).resolves.toEqual(false)
    })
  })
  describe("joukkoFileHasBranchName", () => {
    test("returns false when file has no content", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce("")
      
      expect(joukkoFileHasBranchName()).resolves.toEqual(false)
    })
    test("returns false when file doesn't have valid json content", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce("content")
      
      expect(joukkoFileHasBranchName()).resolves.toEqual(false)
    })
    test("returns false when file has valid json, but doesn't have branch key", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce("{}")
      
      expect(joukkoFileHasBranchName()).resolves.toEqual(false)
    })
    test("returns false when file has valid json and branch key without value", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": ""}')
      
      expect(joukkoFileHasBranchName()).resolves.toEqual(false)
    })
    test("returns true when file has valid json and branch key", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": "my-branch"}')
      
      expect(joukkoFileHasBranchName()).resolves.toEqual(true)
    })
  })
  describe("preCheckForFinishAndPassOk", () => {
    test("returns false when current directory is not a git directory", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(false))
      
      expect(preCheckForFinishAndPassOk()).resolves.toEqual(false)
    })
    test("returns false when joukko file doesn't exist", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      fileExists.mockReturnValueOnce(Promise.resolve(false))

      expect(preCheckForFinishAndPassOk()).resolves.toEqual(false)
    })
    test("returns false when joukko file doesn't have branch name", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      fileExists.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": ""}')

      expect(preCheckForFinishAndPassOk()).resolves.toEqual(false)
    })
    test("returns false when current branch is different from the joukko branch", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      fileExists.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": "my-branch"}')
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": "my-branch"}')
      getCurrentBranch.mockReturnValueOnce('{"branch": "my-current-branch"}')

      expect(preCheckForFinishAndPassOk()).resolves.toEqual(false)
    })
    test("returns true when current branch is the same as the joukko branch", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      fileExists.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": "my-branch"}')
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": "my-branch"}')
      getCurrentBranch.mockReturnValueOnce("my-branch")

      expect(preCheckForFinishAndPassOk()).resolves.toEqual(true)
    })
  })
  describe("preCheckForRenameOk", () => {
    test("returns false when current directory is not a git directory", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(false))
      
      expect(preCheckForRenameOk()).resolves.toEqual(false)
    })
    test("returns false when current branch is the default branch", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))

      expect(preCheckForRenameOk()).resolves.toEqual(false)
    })
    test("returns false when joukko file doesn't exist", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      fileExists.mockReturnValueOnce(Promise.resolve(false))

      expect(preCheckForRenameOk()).resolves.toEqual(false)
    })
    test("returns false when joukko file doesn't have branch name", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      fileExists.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": ""}')

      expect(preCheckForRenameOk()).resolves.toEqual(false)
    })
    test("returns true when current branch is not the default branch and joukko file has branch name", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
      getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      fileExists.mockReturnValueOnce(Promise.resolve(true))
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": "my-branch"}')

      expect(preCheckForRenameOk()).resolves.toEqual(true)
    })
  })
  describe("preCheckForStartOk", () => {
    test("returns false when current directory is not a git directory", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(false))
      
      expect(preCheckForStartOk()).resolves.toEqual(false)
    })
    test("returns false when changes are found", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      hasChanges.mockReturnValueOnce(Promise.resolve(true))

      expect(preCheckForStartOk()).resolves.toEqual(false)
    })
    test("returns true when changes are not found", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      hasChanges.mockReturnValueOnce(Promise.resolve(false))

      expect(preCheckForStartOk()).resolves.toEqual(true)
    })
  })
  describe("preCheckForTakeOk", () => {
    test("returns false when current directory is not a git directory", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(false))
      
      expect(preCheckForTakeOk()).resolves.toEqual(false)
    })
    test("returns false when changes are found", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      hasChanges.mockReturnValueOnce(Promise.resolve(true))

      expect(preCheckForTakeOk()).resolves.toEqual(false)
    })
    test("returns false when untracked files are found", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      hasChanges.mockReturnValueOnce(Promise.resolve(false))
      hasUntracked.mockReturnValueOnce(Promise.resolve(true))

      expect(preCheckForTakeOk()).resolves.toEqual(false)
    })
    test("returns true when changes or untracked files are not found", () => {
      isGitDirectory.mockReturnValueOnce(Promise.resolve(true))
      hasChanges.mockReturnValueOnce(Promise.resolve(false))
      hasUntracked.mockReturnValueOnce(Promise.resolve(false))

      expect(preCheckForTakeOk()).resolves.toEqual(true)
    })
  })
  describe("readJoukkoFileBranch", () => {
    test("throws error when joukko file has no content ", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce()

      try {
        await readJoukkoFileBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Could not read branch from joukko file.")
      }
    })
    test("throws error when file doesn't have valid json content", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce("content")
      
      try {
        await readJoukkoFileBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Could not read branch from joukko file.")
      }
    })
    test("throws error when file has valid json, but doesn't have branch key", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"git": "version"}')
      
      try {
        await readJoukkoFileBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Could not read branch from joukko file.")
      }
    })
    test("throws error when file has valid json and branch key without value", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": ""}')
      
      try {
        await readJoukkoFileBranch()
        expect(true).toBe(false) // fails the test if nothing is thrown
      } catch (error) {
        expect(error).toEqual("Could not read branch from joukko file.")
      }
    })
    test("returns branch name when joukko file contains a json with branch key and value", () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockReturnValueOnce('{"branch": "my-branch"}')
      
      expect(readJoukkoFileBranch()).resolves.toEqual("my-branch")
    })
  })
  describe("readJoukkoFileContent", () => {
    test("calls logError when reading file content fails", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockImplementationOnce(() => {
        console.log("Mocking readFileContent() error")
        throw("error")
      })
      const logErrorFunction = jest.fn()
      logError.mockImplementationOnce(() => {
        logErrorFunction()
      })

      await readJoukkoFileContent()
      expect(logErrorFunction).toBeCalled()
    })
    test("returns file content", async () => {
      getPathForGitRoot.mockReturnValueOnce(Promise.resolve("repo-root-path"))
      readFileContent.mockImplementationOnce(() => {
        console.log("Mocking readFileContent()")
        return "this-is-content"
      })

      expect(readJoukkoFileContent()).resolves.toEqual("this-is-content")
    })
  })
  describe("reCheckoutBranchFromRemote", () => {
    describe("when given branch is the current branch", () => {
      describe("and current branch is not the default branch", () =>  {
        test("checks out the default branch and then deletes and re-checkouts the given branch", async () => {
          const currentBranch = "my-branch"
          const defaultBranch = "my-default-branch"
          getCurrentBranch.mockReturnValueOnce(Promise.resolve(currentBranch))
          getDefaultBranch.mockReturnValueOnce(Promise.resolve(defaultBranch))
          const defaultBranchCheckoutFunction = jest.fn()
          checkoutBranch.mockImplementationOnce(branchToCheckout => {
            console.log("Mocking the checkout of default branch")
            defaultBranchCheckoutFunction()
            expect(branchToCheckout).toEqual(defaultBranch)
          })
          const branchDeleteFunction = jest.fn()
          deleteBranch.mockImplementationOnce(branchToDelete => {
            console.log("Mocking the deletion of the original current branch")
            branchDeleteFunction()
            expect(branchToDelete).toEqual(currentBranch)
          })
          const branchCheckoutFunction = jest.fn()
          checkoutBranch.mockImplementationOnce(branchToCheckout => {
            console.log("Mocking the checkout of the given branch branch")
            branchCheckoutFunction()
            expect(branchToCheckout).toEqual(currentBranch)
          })
 
          await reCheckoutBranchFromRemote("my-branch")
          expect(defaultBranchCheckoutFunction).toBeCalled()
          expect(branchDeleteFunction).toBeCalled()
          expect(branchCheckoutFunction).toBeCalled()
        })
        test("calls logError when default branch checkout fails", async () => {
          getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
          checkoutBranch.mockImplementationOnce(() => { throw("error") })
          const logErrorFunction = jest.fn()
          logError.mockImplementationOnce(() => {
            console.log("Mocking logError()")
            logErrorFunction()
          })

          try {
            await reCheckoutBranchFromRemote("my-branch")
            expect(true).toBe(false) // fails the test if nothing is thrown
          } catch (error) {
            expect(true).toBe(true)
          }
          expect(logErrorFunction).toBeCalled()
        })
        test("calls logError when branch deletion fails", async () => {
          const defaultBranch = "my-default-branch"
          getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          getDefaultBranch.mockReturnValueOnce(Promise.resolve(defaultBranch))
          const defaultBranchCheckoutFunction = jest.fn()
          checkoutBranch.mockImplementationOnce(branchToCheckout => {
            console.log("Mocking the checkout of default branch")
            defaultBranchCheckoutFunction()
            expect(branchToCheckout).toEqual(defaultBranch)
          })
          deleteBranch.mockImplementationOnce(() => { throw("error") })
          const logErrorFunction = jest.fn()
          logError.mockImplementationOnce(() => {
            console.log("Mocking logError()")
            logErrorFunction()
          })

          try {
            await reCheckoutBranchFromRemote("my-branch")
            expect(true).toBe(false) // fails the test if nothing is thrown
          } catch (error) {
            expect(true).toBe(true)
          }
          expect(defaultBranchCheckoutFunction).toBeCalled()
          expect(logErrorFunction).toBeCalled()
        })
      })
      describe("and current branch is the default branch", () =>  {
        test("throws error", async () => {
          getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
          
          try {
            await reCheckoutBranchFromRemote("my-branch")
            expect(true).toBe(false) // fails the test if nothing is thrown
          } catch (error) {
            expect(error).toBe("Current branch is the default branch. Can't remove the branch and checkout.")
          }
        })
      })
    })
    describe("when given branch is not the current branch", () => {
      describe("and branch is found locally", () => {
        test("deletes and re-checkouts the given branch", async () => {
          getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
          getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
          checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(true))
          const branchDeleteFunction = jest.fn()
          deleteBranch.mockImplementationOnce(branchToDelete => {
            console.log("Mocking the deletion of the original current branch")
            branchDeleteFunction()
            expect(branchToDelete).toEqual("my-branch")
          })
          const branchCheckoutFunction = jest.fn()
          checkoutBranch.mockImplementationOnce(branchToCheckout => {
            console.log("Mocking the checkout of the given branch branch")
            branchCheckoutFunction()
            expect(branchToCheckout).toEqual("my-branch")
          })

          await reCheckoutBranchFromRemote("my-branch")
          expect(branchDeleteFunction).toBeCalled()
          expect(branchCheckoutFunction).toBeCalled()
        })
        test("throws error when the given branch is the default branch", async () => {
          getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
          getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
          checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(true))
     
          try {
            await reCheckoutBranchFromRemote("my-default-branch")
            expect(true).toBe(false) // fails the test if nothing is thrown
          } catch (error) {
            expect(error).toBe("The given branch is the default branch. Can't remove the branch.")
          }
        })
      })
      describe("and branch is not found locally", () => {
        test("checkouts the given branch", async () => {
          getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-current-branch"))
          getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
          checkIfBranchExistsLocally.mockReturnValueOnce(Promise.resolve(false))
          const branchCheckoutFunction = jest.fn()
          checkoutBranch.mockImplementationOnce(branchToCheckout => {
            console.log("Mocking the checkout of the given branch branch")
            branchCheckoutFunction()
            expect(branchToCheckout).toEqual("my-branch")
          })

          await reCheckoutBranchFromRemote("my-branch")
          expect(branchCheckoutFunction).toBeCalled()
        })
      })
    })
  })
  describe("updateBranch", () => {
    describe("when branch doesn't exist in remote", () => {
      test("calls log with message about not updating", async () => {
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(false))
        const logFunction = jest.fn()
        log.mockImplementationOnce(message => {
          logFunction()
          expect(message).toEqual("Branch 'my-branch' doesn't exist in remote. Not updating.")
        })
  
        await updateBranch("my-branch")
        expect(logFunction).toBeCalled()
      })
      test("calls improveKnowledgeOfRemoteBranches when remote has not been updated", async () => {
        const remoteBranchKnowledgeImproveFunctionToCall = jest.fn()
        improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {
          console.log("Mocking improveKnowledgeOfRemoteBranches()")
          remoteBranchKnowledgeImproveFunctionToCall()
        })
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(false))
        
        await updateBranch("my-branch")
        expect(remoteBranchKnowledgeImproveFunctionToCall).toBeCalled()
      })
      test("will not call improveKnowledgeOfRemoteBranches when remote has been updated", async () => {
        const remoteBranchKnowledgeImproveFunctionNotToBeCalled = jest.fn()
        improveKnowledgeOfRemoteBranches.mockImplementationOnce(() => {s
          remoteBranchKnowledgeImproveFunctionNotToBeCalled()
        })
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(false))
        
        await updateBranch("my-branch", true)
        expect(remoteBranchKnowledgeImproveFunctionNotToBeCalled).not.toBeCalled()
      })
    })
    describe("when branch exists in remote", () => {
      test("calls updateBranchWithPullRebase()", async () => {
        checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(true))
        const updateBranchWithPullRebaseFunction = jest.fn()
        updateBranchWithPullRebase.mockImplementationOnce(() => {
          console.log("Mocking updateBranchWithPullRebase()")
          updateBranchWithPullRebaseFunction()
        })
        
        await updateBranch("my-branch", true)
        expect(updateBranchWithPullRebaseFunction).toBeCalled()
      })
      describe("and calling updateBranchWithPullRebase() throws an error", () => {
        describe("git status has conflicts", () => {
          describe("and rebase abort fails", () => {
            test("throws error", async () => {
              checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(true))
              log.mockImplementationOnce()
              updateBranchWithPullRebase.mockImplementationOnce(() => { throw("error") })
              logWarning.mockImplementationOnce()
              getStatus.mockReturnValueOnce(Promise.resolve({conflicted: ["file"]}))
              const logWarningFunction = jest.fn()
              let logWarningMessage
              logWarning.mockImplementationOnce(warning => {
                logWarningFunction()
                logWarningMessage = warning
              })
              const abortRebaseFunction = jest.fn()
              abortRebase.mockImplementationOnce(() => {
                abortRebaseFunction()
                throw("rebase error")
              })
              const anotherLogWarningFunction = jest.fn()
              let anotherLogWarningMessage
              logWarning.mockImplementationOnce(message => {
                anotherLogWarningFunction()
                anotherLogWarningMessage = message
              })
    
              try {
                await updateBranch("my-branch", true)
                expect(true).toBe(false) // fails the test if nothing is thrown
              } catch (error) {
                expect(logWarningFunction).toBeCalled()
                expect(logWarningMessage).toEqual("Files conflicted. Aborting update.")
                expect(abortRebaseFunction).toBeCalled()
                expect(anotherLogWarningFunction).toBeCalled()
                expect(anotherLogWarningMessage).toEqual("Could not abort rebase.")
                expect(error).toEqual("rebase error")
              }
            })
          })
          describe("and rebase abort succeeds", () => {
            describe("and user wants to re-checkout the branch from remote", () => {
              test("calls reCheckoutBranchFromRemote()", async () => {
                checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(true))
                log.mockImplementationOnce()
                updateBranchWithPullRebase.mockImplementationOnce(() => { throw("error") })
                logWarning.mockImplementationOnce()
                getStatus.mockReturnValueOnce(Promise.resolve({conflicted: ["file"]}))
                const logWarningFunction = jest.fn()
                let logWarningMessage
                logWarning.mockImplementationOnce(warning => {
                  logWarningFunction()
                  logWarningMessage = warning
                })
                const abortRebaseFunction = jest.fn()
                abortRebase.mockImplementationOnce(() => {
                  abortRebaseFunction()
                })
                const logFunction = jest.fn()
                let logMessage
                log.mockImplementationOnce(message => {
                  logFunction()
                  logMessage = message
                })
                getUserConfirmation.mockReturnValueOnce(Promise.resolve(true)) 
                getCurrentBranch.mockReturnValueOnce(Promise.resolve("my-branch"))
                getDefaultBranch.mockReturnValueOnce(Promise.resolve("my-default-branch"))
                checkoutBranch.mockImplementationOnce()
                deleteBranch.mockImplementationOnce()
                const checkoutFunction = jest.fn()
                checkoutBranch.mockImplementationOnce(() => {
                  checkoutFunction()
                })
                log.mockImplementationOnce()
                log.mockImplementationOnce()
                log.mockImplementationOnce()
                const finalLogFunction = jest.fn()
                let finalLogMessage
                log.mockImplementationOnce(message => {
                  finalLogFunction()
                  finalLogMessage = message
                })
      
                try {
                  await updateBranch("my-branch", true)
                  expect(true).toBe(false) // fails the test if nothing is thrown
                } catch (error) {
                  expect(logWarningFunction).toBeCalled()
                  expect(logWarningMessage).toEqual("Files conflicted. Aborting update.")
                  expect(abortRebaseFunction).toBeCalled()
                  expect(logFunction).toBeCalled()
                  expect(logMessage).toEqual("Rebase aborted")
                  expect(checkoutFunction).toBeCalled()
                  expect(finalLogFunction).toBeCalled()
                  expect(finalLogMessage).toEqual("Branch 'my-branch' updated.")
                  
                }
              })
            })
            describe("and user doesn't want to re-checkout the branch from remote", () => {
              test("throws error", async () => {
                checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(true))
                log.mockImplementationOnce()
                updateBranchWithPullRebase.mockImplementationOnce(() => { throw("error") })
                logWarning.mockImplementationOnce()
                getStatus.mockReturnValueOnce(Promise.resolve({conflicted: ["file"]}))
                const logWarningFunction = jest.fn()
                let logWarningMessage
                logWarning.mockImplementationOnce(warning => {
                  logWarningFunction()
                  logWarningMessage = warning
                })
                const abortRebaseFunction = jest.fn()
                abortRebase.mockImplementationOnce(() => {
                  abortRebaseFunction()
                })
                const logFunction = jest.fn()
                let logMessage
                log.mockImplementationOnce(message => {
                  logFunction()
                  logMessage = message
                })
                getUserConfirmation.mockReturnValueOnce(Promise.resolve(false))  
      
                try {
                  await updateBranch("my-branch", true)
                  expect(true).toBe(false) // fails the test if nothing is thrown
                } catch (error) {
                  expect(logWarningFunction).toBeCalled()
                  expect(logWarningMessage).toEqual("Files conflicted. Aborting update.")
                  expect(abortRebaseFunction).toBeCalled()
                  expect(logFunction).toBeCalled()
                  expect(logMessage).toEqual("Rebase aborted")
                  expect(error).toEqual("Not removing the local branch or checkout from remote")
                }
              })
            })
          })
        })
        describe("git status doesn't have conflicts", () => {
          test("calls log with branch update failed", async () => {
            checkIfBranchExistsInRemote.mockReturnValueOnce(Promise.resolve(true))
            log.mockImplementationOnce()
            updateBranchWithPullRebase.mockImplementationOnce(() => { throw("error") })
            const logWarningFunction = jest.fn()
            let logWarningMessage
            logWarning.mockImplementationOnce(warning => {
              logWarningFunction()
              logWarningMessage = warning
            })
            getStatus.mockReturnValueOnce(Promise.resolve({}))
            const logFunction = jest.fn()
            let logMessage
            log.mockImplementationOnce(message => {
              logFunction()
              logMessage = message
            })
  
            try {
              await updateBranch("my-branch", true)
              expect(true).toBe(false) // fails the test if nothing is thrown
            } catch (error) {
              expect(logWarningFunction).toBeCalled()
              expect(logWarningMessage).toEqual("Encountered an error with the update.")
              expect(logFunction).toBeCalled()
              expect(logMessage).toEqual("Branch update failed.")
            }
          })
        })
      })
    })
  })
})