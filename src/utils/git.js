const simpleGit = require("simple-git")
const git = simpleGit()

const {
  logGit,
  logGitMessages,
} = require("../utils/log")

const abortMerge = async () => {
  logGit("git merge --abort")
  await git.merge(["--abort"])
}

const abortRebase = async () => {
  logGit("git rebase --abort")
  await git.rebase(["--abort"])
}

const addAllFiles = async () => {
  logGit("git add *")
  await git.add("*")
}

const addFile = async fileName => {
  logGit(`git add ${fileName}`)
  await git.add(fileName)
}

const amendCommit = async () => {
  const previousCommitMessage = await getPreviousCommitMessage()
  logGit("git commit --amend --no-edit")
  await git.commit(previousCommitMessage, ["--amend", "--no-edit"])
}

const checkIfBranchExists = async branchName => {
  const branchExistsLocally = await checkIfBranchExistsLocally(branchName)
  if (branchExistsLocally) {
    return true
  } else {
    return await checkIfBranchExistsInRemote(branchName)
  }
}

const checkIfBranchExistsInRemote = async branchName => {
  const remoteBranches = await getRemoteBranches()
  const branchExists = remoteBranches.all.includes(`origin/${branchName}`)
  return branchExists
}

const checkIfBranchExistsLocally = async branchName => {
  const localBranches = await git.branchLocal()
  const branchExists = localBranches.all.includes(branchName)
  return branchExists
}

const checkoutBranch = async branchName => {
  logGit(`git checkout ${branchName}`)
  await git.checkout(branchName)
}

const checkoutNewBranch = async branchName => {
  logGit(`git branch ${branchName}`)
  await git.branch([branchName])
  logGit(`git checkout ${branchName}`)
  await git.checkout(branchName)
}

const createCommit = async message => {
  logGit(`git commit -m "${message}"`)
  await git.commit(message)
}

const deleteBranch = async branchName => {
  logGit(`git branch -D ${branchName}`)
  await git.deleteLocalBranch(branchName, true)
}

const getCurrentBranch = async () => {
  const branchLocal = await git.branchLocal()
  const currentBranch = branchLocal.current
  return currentBranch
}

const getDefaultBranch = async () => {
  // logGit("git remote show origin")
  const remoteShow = await git.remote(["show", "origin"])
  const remoteShowAsRows = remoteShow.split('\n')
  const headBranchRow = remoteShowAsRows.filter(row => row.includes("HEAD branch")).pop()
  const headBranch = headBranchRow.split(':').pop().trim()
  return headBranch  
}

const getGitLog = async () => {
  // logGit("git log")
  return await git.log()
}

const getPathForGitRoot = async () => {
  // logGit("git rev-parse --show-toplevel")
  return await git.revparse(["--show-toplevel"])
}

const getPreviousCommit = async () => {
  const log = await getGitLog()
  if (log) {
    return log.latest
  } else {
    return {}
  }
}

const getPreviousCommitFileListing = async () => {
  // logGit("git show --pretty=%f --name-only")
  const previousCommitShow = await git.show("--pretty=%f", "--name-only")
  const previousCommitShowRows = previousCommitShow.split('\n')
  const previousCommitShowDiffRows = previousCommitShowRows.filter(row => row.startsWith("diff --git"))
  const previousCommitFiles = previousCommitShowDiffRows.map(diffRow => diffRow.split(" ").pop().substring(2))
  return previousCommitFiles
}

const getPreviousCommitMessage = async () => {
  const previousCommit = await getPreviousCommit()
  if (Object.keys(previousCommit).length !== 0) {
    return previousCommit.message
  } else {
    return ""
  }
}

const getRemoteBranches = async () => {
  // logGit("git branch --remotes")
  return await git.branch(["--remotes"])
}

const getStatus = async () => {
  // logGit("git status")
  return await git.status()
}

const hasChanges = async () => {
  const status = await getStatus()
  const conflicted = status.conflicted
  const created = status.created
  const deleted = status.deleted
  const modified = status.modified
  const renamed = status.renamed
  const staged = status.staged
  const changes = [
    conflicted, created, deleted, modified, renamed, staged
  ]
  const changeCount = changes.reduce((totalChangeCount, change) => totalChangeCount + change.length, 0)
  const hasChanges = changeCount > 0
  return hasChanges
}

const hasUntracked = async () => {
  const status = await getStatus()
  const notAdded = status.not_added
  const untrackedCount = notAdded.length
  const hasUntracked = untrackedCount > 0
  return hasUntracked
}

const improveKnowledgeOfRemoteBranches = async () => {
  console.log("Improving knowledge of remote branches.")
  // logGit("git remote update origin --prune")
  await git.remote(["update", "origin", "--prune"])
}

const isGitDirectory = async () => {
  return await git.checkIsRepo()
}

const pushTo = async (remote, branch, options = []) => {
  logGit(`git push ${remote} ${branch} ${options.toString()}`)
  const response = await git.push(remote, branch, options)
  const remoteMessages = response.remoteMessages
  if (remoteMessages && remoteMessages.all && remoteMessages.all !== []) {
    logGitMessages(remoteMessages.all)
  }
}

const renameBranch = async (newBranchname) => {
  try {
    const branchAlreadyExists = await checkIfBranchExists(newBranchname)
    if (branchAlreadyExists) {
      throw(`Branch '${newBranchname}' already exists.`)
    }
    logGit(`git branch -m ${newBranchname}`)
    await git.branch(["-m", newBranchname])
  } catch (error) {
    throw(error)
  }
}

const undoLatestCommit = async () => {
  logGit("git reset HEAD~")
  await git.reset(["HEAD~"])
}

const updateBranchWithPullRebase = async branchName => {
  logGit(`git pull origin ${branchName}:${branchName} --rebase`)
  const pullResponse = await git.pull("origin", `${branchName}:${branchName}`, ["--rebase"])
  console.log("pullResponse")
  console.log(pullResponse)
  console.log("pullResponse")
}


module.exports = {
  abortMerge,
  abortRebase,
  addAllFiles,
  addFile,
  amendCommit,
  checkIfBranchExists,
  checkIfBranchExistsInRemote,
  checkIfBranchExistsLocally,
  checkoutBranch,
  checkoutNewBranch,
  createCommit,
  deleteBranch,
  getCurrentBranch,
  getDefaultBranch,
  getGitLog,
  getPathForGitRoot,
  getPreviousCommitFileListing,
  getPreviousCommitMessage,
  getRemoteBranches,
  getStatus,
  hasChanges,
  hasUntracked,
  improveKnowledgeOfRemoteBranches,
  isGitDirectory,
  pushTo,
  renameBranch,
  undoLatestCommit,
  updateBranchWithPullRebase,
}