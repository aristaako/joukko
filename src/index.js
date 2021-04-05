#! /usr/bin/env node
const { finish } = require("./operations/finish")
const { pass } = require("./operations/pass")
const { start } = require("./operations/start")
const { take } = require("./operations/take")
const { rename } = require("./operations/rename")
const { log, logError, logGuide } = require("./utils/log")

const acceptedArguments = [
  "start",
  "take",
  "pass",
  "finish",
  "rename",
  "help"
]

const help = () => {
  logo()
  log("joukko - A tool for mob programming sessions with git.")
  log("")
  log("To use joukko, one of the following arguments must be given:")
  logArgument("start  ", "Start the mob programming session.")
  logArgument("pass   ", "Ends the current driver's turn i.e. 'passes the torch'.")
  logArgument("take   ", "Sets up the new driver's turn i.e. 'takes the reins'.")
  logArgument("finish ", "Finishes the mob programming session.")
  logArgument("rename ", "Renames current branch and updates joukko file branch.")
  logArgument("help   ", "Prints this help.")
  log("")
}

const joukko = argument => {
  if (argument == null || argument == "") {
    logError("An argument must be given.")
    logGuide("Acceptable arguments are:", acceptedArguments.join(", "))
  } else if (!acceptedArguments.includes(argument)) {
    logError(`Invalid argument '${argument}' given.`)
    logGuide("Acceptable arguments are:", acceptedArguments.join(", "))  
  } else {
    switch(argument) {
      case "start":
        start()
        break;
      case "take":
        take()
        break;
      case "pass":
        pass()
        break;
      case "finish":
        finish()
        break;
      case "rename":
        rename()
        break;
      case "help":
        help()
        break;
      default:
        logError(`Invalid argument '${argument}' given.`)
        logGuide("Acceptable arguments are:", acceptedArguments.join(", "))
    }
  }
  return ""
}

const logArgument = (argument, description) => {
  console.log("\x1b[32m", argument, "\x1b[0m", description)
}

const logLogoRow = logoRow => {
  console.log("\x1b[40m\x1b[37m ", logoRow, " \x1b[0m")
}

const logo = () => {
  logLogoRow("           ")
  logLogoRow("J O U K K O")
  logLogoRow("M O B P R O")
  logLogoRow("G R A M M I")
  logLogoRow("N G T O O L")
  logLogoRow("           ")
}


joukko(process.argv[2])