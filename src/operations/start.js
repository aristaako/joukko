const {
  createCommit,
} = require("../utils/git")

const {
  addJoukkoFileUnderGit,
  askUserConfirmation,
  askUserForBranchName,
  askUserInput,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  joukkoFileFound,
  preCheckForStartOk,
} = require("../utils/joukko")
const {
  log,
  logError,
} = require("../utils/log")

const abortSessionStart = (message = "Mob programming session not started.") => {
  log(message)
  return ""
}

const createBaseCommit = async () => {
  await askUserInput("Commit message for mob programming base commit")
    .then(async commitMessage => {
      log("Adding joukko branch file to git staging area.")
      await addJoukkoFileUnderGit()
      log("Creating new commit.")
      await createCommit(commitMessage)
    })
}

const start = async () => {
  log("Starting mob programming with joukko.")
  await preCheckForStartOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abortSessionStart()
      }
      await askUserForBranchName()
      .then(async branchName => {
        const confirmQuestion = `Start mob programming session on branch '${branchName}'?`
        const commandConfirmed = await askUserConfirmation(confirmQuestion)
        if (commandConfirmed) {
          try {
            await checkoutUpToDateBranch(branchName)
  
            if (await joukkoFileFound()) {
              return abortSessionStart(`Joukko branch file found. Mob programming session has already been started with branch '${branchName}'.`)
            }
  
            log("Creating joukko branch file.")
            await createJoukkoBranchFile(branchName)
            
            await createBaseCommit()
  
            log("")
            log("Mob programming session successfully started with joukko.")
  
            return "Mob programming session started with joukko."
          } catch(error) {
            logError("Session starting failed.")
            logError(error)
            return abortSessionStart()
          }
        } else {
          return abortSessionStart()
        }
      })
    })
}

module.exports = { start }