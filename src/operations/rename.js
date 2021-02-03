const {
  askUserInput,
  preCheckForRenameOk,
  renameCurrentJoukkoBranch,
} = require("../utils/joukko")
const {
  log,
  logError,
} = require("../utils/log")

const abortSessionRename = (message = "Local joukko branch not renamed.") => {
  log(message)
  return ""
}

const rename = async () => {
  log("Renaming current local joukko mob programming branch.")
  await preCheckForRenameOk()
  .then(async preCheckIsOk => {
    if (!preCheckIsOk) {
      return abortSessionRename()
    }
    try {
      const newBranchName = await askUserInput("New name for the joukko branch")
      await renameCurrentJoukkoBranch(newBranchName)
    } catch(error) {
      logError(error)
      return abortSessionRename()
    }
  })
}

module.exports = { rename }