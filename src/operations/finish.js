const {
  addAllFiles,
  amendCommit,
  createCommit,
  getPreviousCommitMessage,
  hasChanges,
  hasUntracked,
  undoLatestCommit,
} = require("../utils/git")

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
} = require("../utils/joukko")
const {
  log,
  logError,
  logWarning,
} = require("../utils/log")

const abortSessionFinish = () => {
  return abort("Mob programming session not finished.")
}

const addChangesToStaging = async () => {
  log("Adding all changes to staging area.")
  await addAllFiles()
}

const recreateJoukkoBranchFile = async (mobBranchName) => {
  const joukkoFileWithBranchExists = await checkJoukkoFile()
  if (!joukkoFileWithBranchExists) {
    log("Re-creating joukko branch file.")
    await createJoukkoBranchFile(mobBranchName, true)
  }
}

const removeBranchFile = async () => {
  log("Removing joukko branch file.")
  await removeJoukkoBranchFile()
}

const undoFinishingCommitAndRecreateJoukkoFile = async (mobBranchName) => {
  log("Undoing latest commit.")
  await undoLatestCommit()
  await recreateJoukkoBranchFile(mobBranchName)
}

const undoFinishingCommit = async () => {
  log("Undoing latest commit.")
  await undoLatestCommit()
}

const finishSuccessfulFinish = async () => {
  log("")
  log("Mob programming session finished successfully with joukko.")
  return "Mob programming session finished with joukko."
}

const finishWithAmend = async (mobBranchName) => {
  await removeBranchFile()
  await addChangesToStaging()
  log("Amending previous commit.")
  await amendCommit()
  try {
    log("Forcefully pushing local commits to remote.")
    await pushToBranch(mobBranchName, ["--force"])
    return finishSuccessfulFinish()
  } catch (error) {
    logWarning("Failed to forcefully push to remote.")
    throw(error)
  }
}

const finishWithNewCommit = async (mobBranchName) => {
  return await askUserInput("New commit message to finish the session")
    .then(async commitMessage => {
      await removeBranchFile()
      await addChangesToStaging()
      log("Creating new commit.")
      await createCommit(commitMessage)
      try {
        log("Pushing local commits to remote.")
        await pushToBranch(mobBranchName)
        return finishSuccessfulFinish()
      } catch (pushError) {
        logWarning("Failed to push to remote. Remote might have been updated since taking the reins.")
        const useTheForce = await askUserConfirmation("Would you like to force push?")
        if (useTheForce) {
          try {
            log("Forcefully pushing local commits to remote.")
            await pushToBranch(mobBranchName, ["--force"])
            return finishSuccessfulFinish()
          } catch (forcePushError) {
            logWarning("Failed to force push to remote.")
            await undoFinishingCommit()
            throw(forcePushError)
          }
        } else {
          await undoFinishingCommitAndRecreateJoukkoFile(mobBranchName)
          return abortSessionFinish()
        }
      }
    })
}

const finishWithChanges = async (mobBranchName) => {
  const shouldAmend = await askUserConfirmation("Would you like to amend to the previous commit?")
  if (shouldAmend) {
    return await finishWithAmend(mobBranchName)
  } else {
    return await finishWithNewCommit(mobBranchName)
  }
}

const finishWithoutChanges = async (mobBranchName) => {
  log("No uncommitted changes or untracked files found before joukko file removal.")
  const shouldAmend = await askUserConfirmation("Would you like to amend joukko file removal to the previous commit?")
  if (shouldAmend) {
    return await finishWithAmend(mobBranchName)
  } else {
    return await finishWithNewCommit(mobBranchName)
  }
}

const finish = async () => {
  log("Finishing mob programming session with joukko.")
  return await preCheckForFinishAndPassOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abortSessionFinish()
      }   

      let mobBranchName
      try {
        const previousCommitMessage = await getPreviousCommitMessage()
        log(`Previous commit message is '${previousCommitMessage}'`)

        mobBranchName = await readJoukkoFileBranch()

        const changes = await hasChanges()
        const untracked = await hasUntracked()
        if (!changes && !untracked) {
          return await finishWithoutChanges(mobBranchName)
        } else {
          return await finishWithChanges(mobBranchName)
        }
      } catch (error) {
        logError("Finishing the session failed.")
        logError(error)
        await recreateJoukkoBranchFile(mobBranchName)
        return abortSessionFinish()
      }
    })
}

module.exports = { finish }