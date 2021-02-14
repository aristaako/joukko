const readline = require("readline")

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
      log("Please answer yes or no.")
      rl.close()
      getUserConfirmation(question)
    }
  }))
}

const getUserInput = (question, defaultInput = "") => {
  const rl = createReadLineInterface()
  return new Promise(resolve => rl.question(inputQuestion, userInput => {
    if (userInput !== null && userInput.trim() !== "") {
      rl.close()
      resolve(userInput)
    } else {
      if (defaultInput !== "") {
        rl.close()
        resolve(defaultInput)
      } else {
        log("Invalid input.")
        getUserInput(question)
      }
    }
  }))
}

module.exports = {
  getUserConfirmation,
  getUserInput,
}