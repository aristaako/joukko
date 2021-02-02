const {
  askBranchFromExisting,
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
        joukkoMobBranch = await askBranchFromExisting("Name for the mob branch")
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