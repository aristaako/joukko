const {
  abort,
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

const abortTakingTheReins = () => {
  return abort("Mob Programming - Reins not taken.")
}

const finishSuccessfulTake = () => {
  log("")
  log("Mob Programming - Reins successfully taken with joukko.")
  return "Mob Programming - Reins successfully taken with joukko."
}

const take = async () => {
  log("Taking the reins with joukko.")
  return await preCheckForTakeOk()
    .then(async preCheckIsOk => {
      if (!preCheckIsOk) {
        return abortTakingTheReins()
      }

      const joukkoFileWithBranchExists = await checkJoukkoFile()
      let remoteUpdated = false

      let joukkoMobBranch
      try {
        if (!joukkoFileWithBranchExists) {
          joukkoMobBranch = await askBranchFromExisting("Name for the mob branch")
          remoteUpdated = true
        } else {
          joukkoMobBranch = await readJoukkoFileBranch()
        }

        await checkoutUpToDateBranch(joukkoMobBranch, remoteUpdated)

        const joukkoFileWithBranchExistsAfterCheckout = await checkJoukkoFile()
        if (!joukkoFileWithBranchExistsAfterCheckout) {
          log("Creating joukko file with branch.")
          await createJoukkoBranchFile(joukkoMobBranch)
        }

        return finishSuccessfulTake()
      } catch (error) {
        logError("Taking the reins failed.")
        logError(error)
        return abortTakingTheReins()
      }
      
    })
}

module.exports = { take }