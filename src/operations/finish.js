const {
  addAllFiles,
  amendCommit,
  createCommit,
  getPreviousCommitMessage,
  undoLatestCommit,
} = require("../utils/git")

const {
  askUserConfirmation,
  askUserInput,
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

const removeBranchFile = async () => {
  log("Removing joukko branch file.")
  await removeJoukkoBranchFile()
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

        const shouldAmend = await askUserConfirmation("Would you like to amend to the previous commit?")
        if (shouldAmend) {
          await removeBranchFile()
          await addChangesToStaging()
          log("Amending previous commit.")
          await amendCommit()
          log("Forcefully pushing local commits to remote.")
          await pushToBranch(mobBranchName, ["--force"])
        } else {
          await askUserInput("New commit message to finish the session")
            .then(async commitMessage => {
              await removeBranchFile()
              await addChangesToStaging()
              log("Creating new commit.")
              await createCommit(commitMessage)
              try {
                log("Pushing local commits to remote.")
                await pushToBranch(mobBranchName)
              } catch(pushError) {
                logWarning("Failed to push to remote. Remote might have been updated since taking the reins.")
                log("Undoing latest commit.")
                await undoLatestCommit()
                log("Re-creating joukko branch file.")
                await createJoukkoBranchFile(mobBranchName, true)
                logError("Finishing the session failed.")
                return abort()
              }
            })
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