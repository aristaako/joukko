const fs = require("fs")
const readline = require("readline")

const {
  log,
  logError,
  logNok,
  logOk,
  logWarning,
} = require("../utils/log")

const {
  abortRebase,
  addFile,
  checkIfBranchExistsLocally,
  checkIfBranchExistsInRemote,
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
  pushTo,
  updateBranchWithPullRebase,
  getStatus,
} = require("../utils/git")

const JOUKKO_BRANCH_FILE = ".joukko.file"

const addJoukkoFileUnderGit = async () => {
  const repoRoot = await getPathForGitRoot()
  await addFile(`${repoRoot}/${JOUKKO_BRANCH_FILE}`)
}

const askUserConfirmation = question => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise(resolve => rl.question(`${question} (yes/no): `, answer => {
    const upperCaseAnswer = answer.toUpperCase()
    if (["N", "NO"].includes(upperCaseAnswer)) {
      rl.close()
      resolve(false)
    } else if(["Y", "YES"].includes(upperCaseAnswer)) {
      rl.close()
      resolve(true)
    } else {
      log("Please answer yes or no.")
      rl.close()
      askUserConfirmation(question)
    }
  }))
}

const askUserForBranchName = async () => {
  const currentBranch = await getCurrentBranch()
  return await askUserInput("Name for the mob branch", currentBranch)
}

const askUserInput = (question, defaultInput = "") => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const inputQuestion = question + (defaultInput !== "" ? ` (${defaultInput}): ` : ": ")
  return new Promise(resolve => rl.question(inputQuestion, userInput => {
    if (userInput !== null && userInput.trim() !== "") {
      rl.close()
      resolve(userInput)
    } else {
      if (defaultInput !== "") {
        rl.close()
        resolve(defaultInput)
      } else {
        log("Invalid input.")
        askUserInput(question)
      }
    }
  }))
}

const changeToJoukkoMobBranch = async (joukkoMobBranch, remoteAlreadyUpdated = false) => {
  const currentBranch = await getCurrentBranch()
  log(`Current branch '${currentBranch}' is different from the mob branch '${joukkoMobBranch}'.`)
  const joukkoMobBranchExistsLocally = await checkIfBranchExistsLocally(joukkoMobBranch)
  if (joukkoMobBranchExistsLocally) {
    log(`Mob branch '${joukkoMobBranch}' found locally. Checking out.`)
    await checkoutBranch(joukkoMobBranch)
      .then(async () => {
        await updateBranch(joukkoMobBranch, remoteAlreadyUpdated)
      })
  } else {
    log(`Mob branch '${joukkoMobBranch}' doesn't exist locally.`)
    if (!remoteAlreadyUpdated) {
      await improveKnowledgeOfRemoteBranches()
    }
    const joukkoMobBranchExistsInRemote = await checkIfBranchExistsInRemote(joukkoMobBranch)
    if (joukkoMobBranchExistsInRemote) {
      log(`Mob branch '${joukkoMobBranch}' found in origin. Checking out.`)
      await checkoutBranch(joukkoMobBranch)
    } else {
      log(`Mob branch '${joukkoMobBranch}' doesn't exist in origin. Creating the branch.`)
      await checkoutNewBranch(joukkoMobBranch)
    }
  }
}

const checkIfJoukkoHasAlreadyBeenStarted = async () => {
  const previousCommitAddedFiles = await getPreviousCommitAddedFiles()
  console.log("checkIfJoukkoHasAlreadyBeenStarted ~ previousCommitAddedFiles", previousCommitAddedFiles)
  return true
}

const checkJoukkoFile = async () => {
  const joukkoFileExists = await joukkoFileFound()
  if (!joukkoFileExists) {
    logWarning("Joukko Mob branch file '.joukko.file' not found.")
    return false
  } else {
    const joukkoFileIsEmpty = await joukkoFileEmpty()
    if (joukkoFileIsEmpty) {
      logWarning("Joukko Mob branch file is empty.")
      return false
    }
  }
  return true
}

const checkoutUpToDateBranch = async (branchName, remoteUpdated = false) => {
  if (!remoteUpdated) {
    await improveKnowledgeOfRemoteBranches()
  }
  const branchExistsInRemote = await checkIfBranchExistsInRemote(branchName)
  if (branchExistsInRemote) {
    log(`Branch '${branchName}' found in remote.`)
    await reCheckoutBranchFromRemote(branchName)
  } else {
    logWarning(`Branch '${branchName}' not found in remote.`)
    const branchExistsLocally = await checkIfBranchExistsLocally(branchName)
    const branchIsCurrentBranch = await isBranchCurrentBranch(branchName)
    if (!branchIsCurrentBranch) {
      if (branchExistsLocally) {
        log(`Branch '${branchName}' found locally. Checking it out.`)
        await checkoutBranch(branchName)
      } else {
        log(`Creating and checking out local branch '${branchName}'.`)
        await checkoutNewBranch(branchName)
      }
    }
  }
}

const createJoukkoBranchFile = async (branchName, silent = false) => {
  try {
    const repoRoot = await getPathForGitRoot()
    fs.writeFileSync(`${repoRoot}/${JOUKKO_BRANCH_FILE}`, branchName)
    if (!silent) {
      log("Mob branch file created.")
    }
  } catch(error) {
    logWarning("Could not create mob branch file.")
    throw(error)
  }
}

const isBranchCurrentBranch = async branchName => {
  const currentBranch = await getCurrentBranch()
  return branchName === currentBranch 
}

const joukkoFileEmpty = async () => {
  const joukkoFileContent = await readJoukkoFileContent()
  if (!joukkoFileContent || joukkoFileContent.trim() == "") {
    return true
  } else {
    return false
  }
}

const joukkoFileFound = async () => {
  const repoRoot = await getPathForGitRoot()
  try {
    if (fs.existsSync(`${repoRoot}/${JOUKKO_BRANCH_FILE}`)) {
      return true
    } else {
      return false
    }
  } catch(err) {
    return false
  }
}

const preCheckForFinishAndPassOk = async () => {
  const isGit = await isGitDirectory()
  if (!isGit) {
    logWarning("Directory is not a git directory.")
    logNok("Pre-check")
    return false
  }
  const joukkoFileExists = await checkJoukkoFile()
  if (!joukkoFileExists) {
    logWarning("Joukko branch file not found.")
    logNok("Pre-check")
    return false
  }
  const joukkoMobBranch = await readJoukkoFileContent()
  const currentBranch = await getCurrentBranch()

  if (joukkoMobBranch !== currentBranch) {
    logWarning(`Current branch '${currentBranch}' is different from the mob branch '${joukkoMobBranch}'.`)
    logNok("Pre-check")
    return false
  }
  logOk("Pre-check")
  return true
}

const preCheckForStartOk = async () => {
  const isGit = await isGitDirectory()
  if (!isGit) {
    logWarning("Directory is not a git directory.")
    logNok("Pre-check")
    return false
  }
  const changes = await hasChanges()
  if (changes) {
    logWarning("Changes found.")
    logNok("Pre-check")
    return false
  }
  const joukkoFileExists = await joukkoFileFound()
  if (joukkoFileExists) {
    logWarning("Joukko branch file found. Mob programming session already started.")
    logNok("Pre-check")
    return false
  }
  logOk("Pre-check")
  return true
}

const preCheckForTakeOk = async () => {
  const isGit = await isGitDirectory()
  if (!isGit) {
    logWarning("Directory is not a git directory.")
    logNok("Pre-check")
    return false
  }
  const changes = await hasChanges()
  if (changes) {
    logWarning("Changes found.")
    logNok("Pre-check")
    return false
  }
  const untracked = await hasUntracked()
  if (untracked) {
    logWarning("Untracked files found.")
    logNok("Pre-check")
    return false
  }
  logOk("Pre-check")
  return true
}

const pushToBranch = async (branch, options = []) => {
  const remote = "origin"
  await pushTo(remote, branch, options)
}

const pushToMobBranch = async (options = []) => {
  const remote = "origin"
  const mobBranch = await readJoukkoFileContent()
  await pushTo(remote, mobBranch, options)
}

const readJoukkoFileContent = async () => {
  const repoRoot = await getPathForGitRoot()
  try {
    const fileContent = fs.readFileSync(`${repoRoot}/${JOUKKO_BRANCH_FILE}`, "utf-8")
    return fileContent.trim()
  } catch(err) {
    logError(err)
  }
}

const reCheckoutBranchFromRemote = async branchName => {
  const branchIsCurrentBranch = await isBranchCurrentBranch(branchName)
  try {
    if (branchIsCurrentBranch) {
      const defaultBranch = await getDefaultBranch()
      if (defaultBranch !== "" && defaultBranch !== branchName) {
        log(`Branch '${branchName}' is the current branch. Checking out the default branch '${defaultBranch}'.`)
        await checkoutBranch(defaultBranch)
      } else {
        throw("Current branch is the default branch. Can't remove the branch and checkout.")
      }
    }
    if (branchIsCurrentBranch || await checkIfBranchExistsLocally(branchName)) {
      try {
        log(`Removing local branch '${branchName}'.`)
        await deleteBranch(branchName)
      } catch(deleteError) {
        logError(`Could not remove local branch '${branchName}'.`)
        throw(deleteError)
      }
    }
    log(`Checking out '${branchName}' from remote.`)
    await checkoutBranch(branchName)
  } catch(error) {
    logError("Could not re-checkout branch.")
    throw(error)
  }
}

const removeJoukkoBranchFile = async () => {
  const repoRoot = await getPathForGitRoot()
  try {
    fs.unlinkSync(`${repoRoot}/${JOUKKO_BRANCH_FILE}`)
  } catch(err) {
    logError(err)
  }
}

const updateBranch = async (branchName, remoteAlreadyUpdated = false) => {
  if (!remoteAlreadyUpdated) {
    await improveKnowledgeOfRemoteBranches()
  }
  const branchExistsInRemote = await checkIfBranchExistsInRemote(branchName)
  if (branchExistsInRemote) {
    log(`Branch '${branchName}' found in remote. Updating...`)
      try {
        await updateBranchWithPullRebase(branchName)
      } catch (error) {
        logWarning("Encountered an error with the update.")
        const status = await getStatus()
        const conflicted = status.conflicted
        if (conflicted && conflicted.length > 0) {
          logWarning("Files conflicted. Aborting update.")
          try {
            await abortRebase()
            log("Rebase aborted")
          } catch(rebaseAbortError) {
            logWarning("Could not abort rebase.") 
          }
          const confirmQuestion = `Would you like to remove the current local branch and checkout from remote?`
          const confirmRemoval = await askUserConfirmation(confirmQuestion)
          if (confirmRemoval) {
            reCheckoutBranchFromRemote()
          } else {
            throw(error)
          }
        } else {
          log("Branch update failed.")
          log(error)
          throw(error)
        }
      }
  } else {
    log(`Branch '${branchName}' doesn't exist in origin. Not updating.`)
  }
}

module.exports = {
  addJoukkoFileUnderGit,
  askUserConfirmation,
  askUserForBranchName,
  askUserInput,
  changeToJoukkoMobBranch,
  checkIfJoukkoHasAlreadyBeenStarted,
  checkJoukkoFile,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  isBranchCurrentBranch,
  joukkoFileEmpty,
  joukkoFileFound,
  preCheckForFinishAndPassOk,
  preCheckForTakeOk,
  preCheckForStartOk,
  pushToBranch,
  pushToMobBranch,
  readJoukkoFileContent,
  removeJoukkoBranchFile,
  updateBranch,
}
