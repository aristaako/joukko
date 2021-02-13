
const NOK = "NOK"
const OK = "OK"

const log = text => {
  console.log(text)
}

const logError = text => {
  console.log(`  \x1b[31m${text}\x1b[0m`)
}

const logGit = text => {
  console.log(`  \x1b[36m${text}\x1b[0m`)
}

const logGitMessages = messages => {
  console.log("")
  messages.forEach(message => console.log(`  \x1b[92m${message}\x1b[0m`))
  console.log("")
}

const logGuide = (guide, options = "") => {
  console.log(` \x1b[0m${guide}  \x1b[32m${options}\x1b[0m`)
}

const logNok = text => {
  console.log(`  ${text} \x1b[31m${NOK}\x1b[0m`)
}

const logOk = text => {
  console.log(`  ${text} \x1b[32m${OK}\x1b[0m`)
}

const logWarning = text => {
  console.log(`  \x1b[33m${text}\x1b[0m`)
}

module.exports = {
  log,
  logError,
  logGit,
  logGitMessages,
  logGuide,
  logNok,
  logOk,
  logWarning,
}
