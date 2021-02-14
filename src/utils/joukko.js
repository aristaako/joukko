const {
  createFileWithJson,
  fileExists,
  readFileContent,
  removeFile,
} = require("../utils/file")

const {
  abortRebase,
  addFile,
  checkIfBranchExistsLocally,
  checkIfBranchExistsInRemote,
  checkoutBranch,
  checkoutNewBranch,
  deleteBranch,
  getBranchNameFromRemotePath,
  getCurrentBranch,
  getDefaultBranch,
  getPathForGitRoot,
  getRemoteBranches,
  hasChanges,
  hasUntracked,
  improveKnowledgeOfRemoteBranches,
  isGitDirectory,
  pushTo,
  renameBranch,
  updateBranchWithPullRebase,
  getStatus,
} = require("../utils/git")

const {
  log,
  logError,
  logNok,
  logOk,
  logWarning,
} = require("../utils/log")

const {
  getUserConfirmation,
  getUserInput,
} = require("..utils/userInput")


const JOUKKO_FILE = ".joukko"

const addJoukkoFileUnderGit = async () => {
  const repoRoot = await getPathForGitRoot()
  await addFile(`${repoRoot}/${JOUKKO_FILE}`)
}

const askBranchFromExisting = async (branchQuestion, allowDefaultAsProposed = false, showOptionOther = true) => {
  await improveKnowledgeOfRemoteBranches()
  const remoteBranches = await getRemoteBranches()
  const remoteBranchNames = remoteBranches.all.map(remoteBranch => getBranchNameFromRemotePath(remoteBranch))
  const remoteBranchNamesSorted = remoteBranchNames.sort()
  const branchNamesWithIndexes = remoteBranchNamesSorted.map((branchName, index) => `[\x1b[32m${index}\x1b[0m]: ${branchName}`)
  const nextIndex = branchNamesWithIndexes.length
  let optionCount = branchNamesWithIndexes.length
  let branchNamesForListing
  if (showOptionOther) {
    branchNamesForListing = 
    [
      ...branchNamesWithIndexes,
      `[\x1b[32m${nextIndex}\x1b[0m]: Other...`
    ]
    optionCount = optionCount + 1
  } else {
    branchNamesForListing = branchNamesWithIndexes
  }
  branchNamesForListing.map(branchListing => log(branchListing))
  const selection = await askOption(optionCount)
  if (selection == nextIndex) {
    return await askUserForBranchName(branchQuestion, allowDefaultAsProposed)
  } else {
    return remoteBranchNamesSorted[selection]
  }
}

const askOption = async optionCount => {
  return await askUserInput("Choose correct branch number")
    .then(async selection => {
      const acceptableOptions = [...Array(optionCount).keys()]
      if (acceptableOptions.includes(parseInt(selection.trim()))) {
        return selection
      } else {
        logError("Invalid selection.")
        return askOption(optionCount)
      }
    })
}

const askUserConfirmation = question => getUserConfirmation(question)

const askUserForBranchName = async (branchQuestion, allowDefaultAsProposed = false) => {
  const defaultIsCurrent = await isCurrentBranchTheDefaultBranch()
  if (!allowDefaultAsProposed && defaultIsCurrent) {
    return await askUserInput(branchQuestion)
  } else {
    const currentBranch = await getCurrentBranch()
    return await askUserInput(branchQuestion, currentBranch)
  }
}

const askUserInput = (question, defaultInput = "") => {
  const inputQuestion = question + (defaultInput !== "" ? ` (${defaultInput}): ` : ": ")
  return getUserInput(inputQuestion, defaultInput)
}

const changeToBranch = async (branchName = "") => {
  const currentBranch = await getCurrentBranch()
  if (branchName === "") {
    throw("Branch name is empty.")
  }
  if (branchName !== currentBranch) {
    log(`Branch '${currentBranch}' is the current branch. Checking out the branch '${branchName}'.`)
    await checkoutBranch(branchName)
  } else {
    throw("Already on the branch.")
  }
}

const changeToDefaultBranch = async () => {
  const currentBranch = await getCurrentBranch()
  const defaultBranch = await getDefaultBranch()
  if (defaultBranch === "") {
    throw("No default branch found.")
  }
  if (defaultBranch !== currentBranch) {
    log(`Branch '${currentBranch}' is the current branch. Checking out the default branch '${defaultBranch}'.`)
    await checkoutBranch(defaultBranch)
  } else {
    throw("Current branch is the default branch.")
  }
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
    logWarning("Joukko file '.joukko' not found.")
    return false
  } else {
    const joukkoFileHasBranch = await joukkoFileHasBranchName()
    if (!joukkoFileHasBranch) {
      logWarning("Joukko file doesn't contain branch name.")
      return false
    }
  }
  return true
}

const checkoutNewLocalBranch = async (branchName) => {
  log(`Creating and checking out local branch '${branchName}'.`)
  await checkoutNewBranch(branchName)
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
        await checkoutNewLocalBranch()
      }
    }
  }
}

const createJoukkoBranchFile = async (branchName, silent = false) => {
  try {
    const repoRoot = await getPathForGitRoot()
    const branchJson = { branch: branchName }
    createFileWithJson(repoRoot, JOUKKO_FILE, JSON.stringify(branchJson))
    if (!silent) {
      log("Mob branch file created.")
    }
  } catch (error) {
    logWarning("Could not create mob branch file.")
    throw(error)
  }
}

const isBranchCurrentBranch = async branchName => {
  const currentBranch = await getCurrentBranch()
  return branchName === currentBranch 
}

const isCurrentBranchTheDefaultBranch = async () => {
  const currentBranch = await getCurrentBranch()
  const defaultBranch = await getDefaultBranch()
  return defaultBranch == currentBranch
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
    return fileExists(repoRoot, JOUKKO_FILE)
  } catch (error) {
    return false
  }
}

const joukkoFileHasBranchName = async () => {
  const joukkoFileContent = await readJoukkoFileContent()
  if (joukkoFileContent && joukkoFileContent.trim() != "") {
    try {
      const joukkoFileJson = JSON.parse(joukkoFileContent)
      const joukkoBranch = joukkoFileJson.branch
      if (joukkoBranch && joukkoBranch.trim() != "") {
        return true
      } 
    } catch (error) {
      return false;
    }
  }
  return false
}

const preCheckForFinishAndPassOk = async () => {
  const isGit = await isGitDirectory()
  if (!isGit) {
    logWarning("Directory is not a git directory.")
    logNok("Pre-check")
    return false
  }
  const joukkoFileWithBranchExists = await checkJoukkoFile()
  if (!joukkoFileWithBranchExists) {
    logWarning("Joukko branch file with branch not found.")
    logNok("Pre-check")
    return false
  }
  const joukkoMobBranch = await readJoukkoFileBranch()
  const currentBranch = await getCurrentBranch()

  if (joukkoMobBranch !== currentBranch) {
    logWarning(`Current branch '${currentBranch}' is different from the mob branch '${joukkoMobBranch}'.`)
    logNok("Pre-check")
    return false
  }
  logOk("Pre-check")
  return true
}

const preCheckForRenameOk = async () => {
  const isGit = await isGitDirectory()
  if (!isGit) {
    logWarning("Directory is not a git directory.")
    logNok("Pre-check")
    return false
  }
  const currentBranchIsDefaultBranch = await isCurrentBranchTheDefaultBranch()
  if (currentBranchIsDefaultBranch) {
    logWarning("Current branch is the default branch. Can't rename.")
    logNok("Pre-check")
    return false
  }
  const joukkoFileWithBranchExists = await checkJoukkoFile()
  if (!joukkoFileWithBranchExists) {
    logWarning("Joukko branch file with branch not found.")
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
  const mobBranch = await readJoukkoFileBranch()
  await pushTo(remote, mobBranch, options)
}

const readJoukkoFileBranch = async () => {
  const joukkoFileContent = await readJoukkoFileContent()
  const joukkoFileJson = JSON.parse(joukkoFileContent)
  return joukkoFileJson.branch
}

const readJoukkoFileContent = async () => {
  const repoRoot = await getPathForGitRoot()
  try {
    return readFileContent(repoRoot, JOUKKO_FILE)
  } catch (err) {
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
      } catch (deleteError) {
        logError(`Could not remove local branch '${branchName}'.`)
        throw(deleteError)
      }
    }
    log(`Checking out '${branchName}' from remote.`)
    await checkoutBranch(branchName)
  } catch (error) {
    logError("Could not re-checkout branch.")
    throw(error)
  }
}

const removeJoukkoBranchFile = async () => {
  const repoRoot = await getPathForGitRoot()
  try {
    removeFile(repoRoot, JOUKKO_FILE)
  } catch (error) {
    logError(error)
  }
}

const renameCurrentJoukkoBranch = async (newBranchname) => {
  try {
    await renameBranch(newBranchname)
    await updateJoukkoBranchFileBranch(newBranchname)
  } catch (error) {
    logError("Could not rename current joukko branch.")
    throw(error)
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
          } catch (rebaseAbortError) {
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

const updateJoukkoBranchFileBranch = async (branchName) => {
  log("Updating branch name in joukko branch file.")
  await removeJoukkoBranchFile()
  await createJoukkoBranchFile(branchName)
}

module.exports = {
  addJoukkoFileUnderGit,
  askBranchFromExisting,
  askUserConfirmation,
  askUserForBranchName,
  askUserInput,
  changeToBranch,
  changeToDefaultBranch,
  changeToJoukkoMobBranch,
  checkIfJoukkoHasAlreadyBeenStarted,
  checkJoukkoFile,
  checkoutNewLocalBranch,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  isBranchCurrentBranch,
  joukkoFileFound,
  joukkoFileHasBranchName,
  preCheckForFinishAndPassOk,
  preCheckForRenameOk,
  preCheckForTakeOk,
  preCheckForStartOk,
  pushToBranch,
  pushToMobBranch,
  readJoukkoFileBranch,
  removeJoukkoBranchFile,
  renameCurrentJoukkoBranch,
  updateBranch,
  updateJoukkoBranchFileBranch,
}
