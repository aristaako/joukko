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

const abort = (message = "Mob programming session not finished.") => {
  logError(message)
  return ""
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

const finishWithAmend = async (mobBranchName) => {
  try {
    await removeBranchFile()
    await addChangesToStaging()
    log("Amending previous commit.")
    await amendCommit()
    log("Forcefully pushing local commits to remote.")
    await pushToBranch(mobBranchName, ["--force"])
  } catch (error) {
    logWarning("Failed to forcefully push to remote.")
    await recreateJoukkoBranchFile(mobBranchName)
    throw(error)
  }
}

const finishWithNewCommit = async (mobBranchName) => {
  await askUserInput("New commit message to finish the session")
    .then(async commitMessage => {
      await removeBranchFile()
      await addChangesToStaging()
      log("Creating new commit.")
      await createCommit(commitMessage)
      try {
        log("Pushing local commits to remote.")
        await pushToBranch(mobBranchName)
      } catch (pushError) {
        logWarning("Failed to push to remote. Remote might have been updated since taking the reins.")
        const useTheForce = await askUserConfirmation("Would you like to force push?")
        if (useTheForce) {
          try {
            log("Forcefully pushing local commits to remote.")
            await pushToBranch(mobBranchName, ["--force"])
          } catch (forcePushError) {
            logWarning("Failed to force push to remote.")
            await undoFinishingCommitAndRecreateJoukkoFile(mobBranchName)
            abort()
          }
        } else {
          await undoFinishingCommitAndRecreateJoukkoFile(mobBranchName)
          abort()
        }
      }
    })
}

const finishWithoutChanges = async (mobBranchName) => {
  log("No uncommitted changes or untracked files found before joukko file removal.")
  await removeBranchFile()
  const shouldAmend = await askUserConfirmation("Would you like to amend joukko file removal to the previous commit?")
  if (shouldAmend) {
    await finishWithAmend(mobBranchName)
  } else {
    await finishWithNewCommit(mobBranchName)
  }
}

const finish = async () => {
  log("Finishing mob programming session with joukko.")
  await preCheckForFinishAndPassOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abort()
      }   

      try {
        const previousCommitMessage = await getPreviousCommitMessage()
        log(`Previous commit message is '${previousCommitMessage}'`)

        const mobBranchName = await readJoukkoFileBranch()

        const changes = await hasChanges()
        const untracked = await hasUntracked()
        if (!changes && !untracked) {
          await finishWithoutChanges()
        } else {
          const shouldAmend = await askUserConfirmation("Would you like to amend to the previous commit?")
          if (shouldAmend) {
            await finishWithAmend(mobBranchName)
          } else {
            await finishWithNewCommit(mobBranchName)
          }
        }
        log("")
        log("Mob programming session finished successfully with joukko.")
      } catch (error) {
        logError("Finishing the session failed.")
        logError(error)
        return abort()
      }
    })
}

module.exports = { finish }