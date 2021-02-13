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

const abort = (message = "Mob programming torch not passed.") => {
  logError(message)
  return ""
}

const addChangesToStaging = async () => {
  log("Adding all changes to staging area.")
  await addAllFiles()
}

const passWithAmend = async () => {
  try {
    await addChangesToStaging()
    log("Amending previous commit.")
    await amendCommit()
    log("Forcefully pushing local commits to remote.")
    await pushToMobBranch(["--force"])
  } catch(error) {
    logWarning("Failed to forcefully push to remote.")
    throw(error)
  }
}

const passWithNewCommit = async () => {
  await askUserInput("New commit message before passing the torch")
    .then(async commitMessage => {
      await addChangesToStaging()
      log("Creating new commit.")
      await createCommit(commitMessage)
      try {
        log("Pushing local commits to remote.")
        await pushToMobBranch()
      } catch(pushError) {
        logWarning("Failed to push to remote. Remote might have been updated since taking the reins.")
        const useTheForce = await askUserConfirmation("Would you like to force push?")
        if (useTheForce) {
          try {
            log("Forcefully pushing local commits to remote.")
            await pushToMobBranch(["--force"])
          } catch(forcePushError) {
            logWarning("Failed to force push to remote.")
            log("Undoing latest commit.")
            await undoLatestCommit()
            abort()
          }
        } else {
          log("Undoing latest commit.")
          await undoLatestCommit()
          abort()
        }
      }
    })
}

const pass = async () => {
  log("Passing the torch with joukko.")
  await preCheckForFinishAndPassOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abort()
      }

      const changes = await hasChanges()
      const untracked = await hasUntracked()
      if (!changes && !untracked) {
        logWarning("No changes or untracked files found.")
        const passIntended = await askUserConfirmation("Are you sure you want to pass the torch without any uncommited changes?")
        if (!passIntended) {
          return abort()
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
        log("")
        log("Mob programming torch successfully passed with joukko.")
      } catch(error) {
        logError("Torch passing failed.")
        logError(error)
        return abort()
      }
    })
}

module.exports = { pass }