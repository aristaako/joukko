const fs = require("fs")

const createFileWithJson = (path, fileName, json) => {
  try {
    fs.writeFileSync(`${path}/${fileName}`, json)
  } catch (error) {
    throw(error)
  }
}

const fileExists = (path, fileName) => {
  try {
    if (fs.existsSync(`${path}/${fileName}`)) {
      return true
    } else {
      return false
    }
  } catch (error) {
    throw(error)
  }
}

const readFileContent = (path, fileName) => {
  try {
    const fileContent = fs.readFileSync(`${path}/${fileName}`, "utf-8")
    return fileContent.trim()
  } catch (error) {
    throw(error)
  }
}

const removeFile = (path, fileName) => {
  try {
    fs.unlinkSync(`${path}/${fileName}`)
  } catch (error) {
    throw(error)
  }
}

module.exports = {
  createFileWithJson,
  fileExists,
  readFileContent,
  removeFile,
}