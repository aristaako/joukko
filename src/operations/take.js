const {
  getBranchNameFromRemotePath,
  getRemoteBranches,
  improveKnowledgeOfRemoteBranches,
} = require("../utils/git")

const {
  askUserForBranchName,
  askUserInput,
  checkJoukkoFile,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  preCheckForTakeOk,
  readJoukkoFileContent,
} = require("../utils/joukko")
const {
  log,
  logError,
} = require("../utils/log")

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

const askForJoukkoBranchFromExisting = async () => {
  await improveKnowledgeOfRemoteBranches()
  const remoteBranches = await getRemoteBranches()
  const remoteBranchNames = remoteBranches.all.map(remoteBranch => getBranchNameFromRemotePath(remoteBranch))
  const remoteBranchNamesSorted = remoteBranchNames.sort()
  const branchNamesWithIndexes = remoteBranchNamesSorted.map((branchName, index) => `[\x1b[32m${index}\x1b[0m]: ${branchName}`)
  const nextIndex = branchNamesWithIndexes.length
  const optionCount = branchNamesWithIndexes.length + 1 
  const branchNamesWithIndexesAndOther = 
    [
      ...branchNamesWithIndexes,
      `[\x1b[32m${nextIndex}\x1b[0m]: Other...`
    ]
  branchNamesWithIndexesAndOther.map(branchListing => log(branchListing))
  const selection = await askOption(optionCount)
  if (selection == nextIndex) {
    return await askUserForBranchName()
  } else {
    return remoteBranchNamesSorted[selection]
  }
}

const abort = (message = "Mob Programming - Reins not taken.") => {
  logError(message)
  return ""
}

const take = async () => {
  log("Taking the reins with joukko.")
  await preCheckForTakeOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abort()
      }

      const joukkoFileExists = await checkJoukkoFile()
      let remoteUpdated = false

      let joukkoMobBranch
      if (!joukkoFileExists) {
        joukkoMobBranch = await askForJoukkoBranchFromExisting()
        remoteUpdated = true
      } else {
        joukkoMobBranch = await readJoukkoFileContent()
      }

      try {
        await checkoutUpToDateBranch(joukkoMobBranch, remoteUpdated)

        const joukkoFileExistsAfterCheckout = await checkJoukkoFile()
        if (!joukkoFileExistsAfterCheckout) {
          log("Creating joukko branch file.")
          await createJoukkoBranchFile(joukkoMobBranch)
        }

        log("")
        log("Mob Programming - Reins successfully taken with joukko.")
      } catch (error) {
        logError("Taking the reins failed.")
        logError(error)
        return abort()
      }
      
    })
}

module.exports = { take }