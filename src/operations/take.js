const {
  askBranchFromExisting,
  checkJoukkoFile,
  checkoutUpToDateBranch,
  createJoukkoBranchFile,
  preCheckForTakeOk,
  readJoukkoFileBranch,
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

      const joukkoFileWithBranchExists = await checkJoukkoFile()
      let remoteUpdated = false

      let joukkoMobBranch
      if (!joukkoFileWithBranchExists) {
        joukkoMobBranch = await askBranchFromExisting("Name for the mob branch")
        remoteUpdated = true
      } else {
        joukkoMobBranch = await readJoukkoFileBranch()
      }

      try {
        await checkoutUpToDateBranch(joukkoMobBranch, remoteUpdated)

        const joukkoFileWithBranchExistsAfterCheckout = await checkJoukkoFile()
        if (!joukkoFileWithBranchExistsAfterCheckout) {
          log("Creating joukko file with branch.")
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