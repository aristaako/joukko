const {
  addAllFiles,
  amendCommit,
  createCommit,
  getPreviousCommitMessage,
  undoLatestCommit,
  hasChanges,
  hasUntracked,
} = require("../utils/git")
const {
  abort,
  askUserConfirmation,
  askUserInput,
  preCheckForFinishAndPassOk,
  pushToMobBranch,
} = require("../utils/joukko")
const {
  log,
  logError,
  logWarning,
} = require("../utils/log")

const abortTorchPass = () => {
  return abort("Mob programming torch not passed.")
}

const addChangesToStaging = async () => {
  log("Adding all changes to staging area.")
  await addAllFiles()
}

const finishSuccessfulPass = () => {
  log("")
  log("Mob programming torch successfully passed with joukko.")
  return "Mob programming torch passed with joukko."
}

const passWithAmend = async () => {
  try {
    await addChangesToStaging()
    log("Amending previous commit.")
    await amendCommit()
    log("Forcefully pushing local commits to remote.")
    await pushToMobBranch(["--force"])
  } catch (error) {
    logWarning("Failed to forcefully push to remote.")
    throw(error)
  }
}

const passWithNewCommit = async () => {
  return await askUserInput("New commit message before passing the torch")
    .then(async commitMessage => {
      await addChangesToStaging()
      log("Creating new commit.")
      await createCommit(commitMessage)
      try {
        log("Pushing local commits to remote.")
        await pushToMobBranch()
      } catch (pushError) {
        logWarning("Failed to push to remote. Remote might have been updated since taking the reins.")
        const useTheForce = await askUserConfirmation("Would you like to force push?")
        if (useTheForce) {
          try {
            log("Forcefully pushing local commits to remote.")
            await pushToMobBranch(["--force"])
          } catch (forcePushError) {
            logWarning("Failed to force push to remote.")
            log("Undoing latest commit.")
            await undoLatestCommit()
            throw(forcePushError)
          }
        } else {
          log("Undoing latest commit.")
          await undoLatestCommit()
          throw("Failed to push to remote.")
        }
      }
    })
}

const pass = async () => {
  log("Passing the torch with joukko.")
  return await preCheckForFinishAndPassOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abortTorchPass()
      }

      const changes = await hasChanges()
      const untracked = await hasUntracked()
      if (!changes && !untracked) {
        logWarning("No changes or untracked files found.")
        const passIntended = await askUserConfirmation("Are you sure you want to pass the torch without any uncommited changes?")
        if (!passIntended) {
          return abortTorchPass()
        } 
      }
      try {
        const previousCommitMessage = await getPreviousCommitMessage()
        log(`Previous commit message is '${previousCommitMessage}'`)
        const shouldAmend = await askUserConfirmation("Would you like to amend to the previous commit?")
        if (shouldAmend) {
          await passWithAmend()
        } else {
          await passWithNewCommit()
        }
        return finishSuccessfulPass()
      } catch (error) {
        logError("Torch passing failed.")
        logError(error)
        return abortTorchPass()
      }
    })
}

module.exports = { pass }