const readline = require("readline")

const {
  log,
  logWarning,
} = require("./log")

const createReadLineInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

const getUserConfirmation = question => {
  const rl = createReadLineInterface()
  return new Promise(resolve => rl.question(`${question} (yes/no): `, answer => {
    const upperCaseAnswer = answer.toUpperCase()
    if (["N", "NO"].includes(upperCaseAnswer)) {
      rl.close()
      resolve(false)
    } else if(["Y", "YES"].includes(upperCaseAnswer)) {
      rl.close()
      resolve(true)
    } else {
      logWarning("Please answer yes or no.")
      rl.close()
      resolve(getUserConfirmation(question))
    }
  }))
}

const getUserInput = (question, defaultInput = "") => {
  const rl = createReadLineInterface()
  return new Promise(resolve => rl.question(question, userInput => {
    if (userInput !== null && userInput.trim() !== "") {
      rl.close()
      resolve(userInput)
    } else {
      if (defaultInput !== "") {
        rl.close()
        resolve(defaultInput)
      } else {
        rl.close()
        logWarning("Invalid input.")
        resolve(getUserInput(question))
      }
    }
  }))
}

module.exports = {
  getUserConfirmation,
  getUserInput,
}