const {
  checkIfBranchExists,
  createCommit,
  getCurrentBranch,
} = require("../utils/git")

const {
  addJoukkoFileUnderGit,
  askBranchFromExisting,
  askUserConfirmation,
  askUserForBranchName,
  askUserInput,
  checkJoukkoFile,
  checkoutNewLocalBranch,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  preCheckForStartOk,
  updateJoukkoBranchFileBranch,
} = require("../utils/joukko")
const {
  log,
  logError,
  logWarning,
} = require("../utils/log")

const abortSessionStart = (message = "Mob programming session not started.") => {
  log(message)
  return ""
}

const handleStartWithNewBranch = async (branchName) => {
  log(`Branch ${branchName} not found. Creating new branch.`)
  const baseBranch = await askBranchFromExisting("Name of the base branch for the mob programming session branch", true, false)
  try {
    await changeToBranch(baseBranch)
    if (await checkJoukkoFile()) {
      logWarning(`Joukko branch file with branch found on base branch '${baseBranch}'.`)
      const commandConfirmed = await askUserConfirmation(`Rename branch in joukko file and start mob programming session on branch '${branchName}'`)
      if (commandConfirmed) {
        try {
          await checkoutNewLocalBranch(branchName)
          await updateJoukkoBranchFileBranch(branchName)
          return await finishSuccessfulStart()
        } catch(error) {
          logError("Session starting failed.")
          logError(error)
          return abortSessionStart()
        }
      } else {
        return abortSessionStart()
      }
    } else {
      const commandConfirmed = await askUserConfirmation(`Start mob programming session on branch '${branchName}'?`)
      if (commandConfirmed) {
        try {
          await checkoutNewLocalBranch(branchName)
          log("Creating joukko branch file.")
          await createJoukkoBranchFile(branchName)
          return await finishSuccessfulStart()
        } catch(error) {
          logError("Session starting failed.")
          logError(error)
          return abortSessionStart()
        }
      } else {
        return abortSessionStart()
      }
    }
  } catch(error) {
    return abortSessionStart(`Could not start mob session on another branch. ${error}`)  
  }
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

const finishSuccessfulStart = async () => {
  await createBaseCommit()
  log("")
  log("Mob programming session successfully started with joukko.")
  return "Mob programming session started with joukko."
}

const handleStartWithExistingJoukkoFile = async () => {
  logWarning("Joukko branch file found. Mob programming session already started on current branch.")
  const startOnAnotherBranch = await askUserConfirmation("Would you like to start mob session on another branch?")
  if (startOnAnotherBranch) {
    await askUserForBranchName("Name for the mob branch")
      .then(async branchName => {
        const branchAlreadyExists = await checkIfBranchExists(branchName)
        if (!branchAlreadyExists) {
          return handleStartWithNewBranch(branchName)
        } else {
          const commandConfirmed = await askUserConfirmation(`Start mob programming session on branch '${branchName}'?`)
          if (commandConfirmed) {
            try {
              await checkoutUpToDateBranch(branchName)
              if (await checkJoukkoFile()) {
                return abortSessionStart(`Joukko branch file with branch found. Mob programming session has already been started with branch '${branchName}'.`)
              }
              log("Creating joukko branch file.")
              await createJoukkoBranchFile(branchName)

              return await finishSuccessfulStart()
            } catch(error) {
              logError("Session starting failed.")
              logError(error)
              return abortSessionStart()
            }
          } else {
            return abortSessionStart()
          }
        }
      })
  } else {
    const currentBranch = await getCurrentBranch()
    return abortSessionStart(`Mob programming session already started with current branch '${currentBranch}'.`)
  }
}

const handleStartWithoutExistingJoukkoFile = async () => {
  await askUserForBranchName("Name for the mob branch")
  .then(async branchName => {
    const confirmQuestion = `Start mob programming session on branch '${branchName}'?`
    const commandConfirmed = await askUserConfirmation(confirmQuestion)
    if (commandConfirmed) {
      try {
        await checkoutUpToDateBranch(branchName)
  
        if (await checkJoukkoFile()) {
          return abortSessionStart(`Joukko branch file with branch found. Mob programming session has already been started with branch '${branchName}'.`)
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
}

const start = async () => {
  log("Starting mob programming with joukko.")
  await preCheckForStartOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abortSessionStart()
      }
      const joukkoFileWithBranchExists = await checkJoukkoFile()
      if (joukkoFileWithBranchExists) {
        return await handleStartWithExistingJoukkoFile()
      }
      await handleStartWithoutExistingJoukkoFile()
    })
}

module.exports = { start }