<h1 align="center">
  <img src="img/joukko.png" alt="joukko logo" height="250px" />
</h1>

# joukko
[![npm](https://img.shields.io/npm/v/joukko?style=for-the-badge)](https://www.npmjs.org/package/joukko)

A tool for mob programming sessions using git version control

> The motivation for this tool comes from participating regularly in remote mob programming sessions.  
> There is always a hassle when it comes time to change the driver.  
> joukko tries to sort out the difficulties and make mob programming a smooth experience.  
>   
> joukko is based on the workflow I encounter and as such it may not suit every situation and mob programming session.  
> However, it might still be a good starting point when a dev team is getting introduced to mob programming even if the team is working co-locatedly on a single computer.

## Requirements

- Git
- Npm

## Install

```
$ npm install --save-dev joukko
```

```
$ npm install -g joukko
```

## Usage

Run the tool on command line with one of the listed arguments

### Arguments

| Name      | Description                                                     |
|---------- |---------------------------------------------------------------- |
| start     | starts the mob programming session                              |
| pass      | makes preparations for the driver swap i.e. 'passes the torch'  |
| take      | sets things up for the new driver i.e. 'takes the reins'        |
| finish    | finishes the mob programmin session                             |
| rename    | renames current local branch and updates branch in joukko file  |
| help      | prints help                                                     |

## Starting the session

To start a mob programming session with joukko, the first driver should be running the following command.
```
$ joukko start
```

> Note: Starting a mob session on the default git branch is discouraged and using a feature branch is recommended.

Starting a mob programming session with joukko begins with a preliminary check to ensure that a joukko session can actually be started.  
First, joukko checks that the directory, where the command is executed, is a git directory. Then joukko checks whether git can detect any changes as joukko cannot start a session if changes exist. 

After pre-checks, joukko checks for the existance of a joukko branch file (.joukko) that stores the name of the mob programming session git branch. 

### Joukko file exists
If the file exists, a session has already been started and joukko asks the user whether a mob session should be started on another branch. If not, starting a new mob programming session is aborted.  
If the mob session should be started on another branch, joukko asks user input on what is the name of the git branch the mob programming session is focusing on. Joukko then checks whether the given branch already exists locally or in remote.

#### Branch exists
If the branch already exists, joukko asks user input on whether the session should be started. Joukko then checkouts the named mob programming branch. When performing a checkout, joukko first ascertains whether the named branch exists in remote. If the branch exists in remote, joukko tries to checkout the remote branch (if a local version of the branch exists, it is removed before checkout). 
If the branch is not found in remote, a local branch is either created or checked out.

If a joukko file is found after checkout, the session cannot be started as it has already been started on the branch. 
When joukko file is not found, such a file is created for storing the name of the git branch.

User is then asked to type in a commit message for the initial mob programming commit which will include the joukko branch file. When the initial commit is created, the mob programming session has been started

#### Branch doesn't exist
If the branch doesn't exist, joukko asks user what is the branch the mob programming session should be based on. Only existing branches are given as options. If the chosen branch is not the current branch, the branch is checked out.

If a joukko file is found on the base branch, user is asked to confirm that the named branch in the joukko file is to be renamed and the mob programming session is to be started. When user confirms session start, a new local branch is created and checked out and the branch name in the joukko file is updated.

If a joukko file is not found on the base branch, user is asked to confirm that the mob programming session is to be started. After confirming session start, a new local branch is created and checked out and a joukko file is created.

### Joukko file doesn't exist
Joukko asks user input on what is the name of git branch the mob programming session is focusing and whether the session should be started. 

Joukko then checkouts the named mob programming branch. When performing a checkout, joukko first ascertains whether the named branch exists in remote. If the branch exists in remote, joukko tries to checkout the remote branch (if a local version of the branch exists, it is removed before checkout). 
If the branch cannot be found from remote, a local branch is either created or checked out.

If a joukko file is found after checkout, the session cannot be started as it has already been started on the branch. 
When joukko file is not found, it is created for storing the name of the git branch.

User is then asked to type in a commit message for the initial mob programming commit which will include the joukko branch file. When the initial commit is created, the mob programming session has been started.

## Passing the torch

After the mob programming session has been started and the first driver has done one's part it, is time to change drivers. The current driver should be running the following command to end one's turn and 'pass the torch'.
```
$ joukko pass
```
When passing the torch to the next driver, joukko starts again with a preliminary check to ensure the command can be run. Joukko checks that it is run on a git directory and that there is a joukko branch file.  If the branch file is missing, driver's turn hasn't been properly initiated and thus it cannot be ended.  
Joukko also checks that the current git branch is the same as the one named in the joukko branch file. 

After pre-checks, joukko checks if there are changes to be found. If no changes are found, then the user is asked whether the torch is to be passed without any changes.

Joukko then finds the previous commit message and asks if the user wants to amend new changes to the previous commit or wants to make a new commit.
Joukko adds all files to the commit so it is recommended to check, before running the pass command, that git can't detect unwanted files.

If user wanted to amend changes, joukko amends changes and pushes changes to the mob programming branch with force. Otherwise user is asked to give a commit message before creating the commit and pushing.

## Taking the reins

When the torch has been passed, it is time for the new driver to start typing on the mob programming session. The new driver should run the following command and 'take the reins'.
```
$ joukko take
```
New driver's turn begins with a preliminary check. Joukko checks that the directory, where the command is executed, is a git directory and that git can't detect any changes (incl. untracked files).

After pre-checks, joukko checks for the joukko git branch file. If the file is not found, the user is asked to name the branch the mob programming session is working on. Joukko gives the user and option to select one from a list of remote branches or to type it oneself.

Joukko then checkouts the branch. When performing a checkout, joukko first ascertains whether the named branch exists in remote. If the branch exists in remote, joukko tries to checkout the remote branch (if a local version of the branch exists, it is removed before checkout). 
If the branch cannot be found from remote, a local branch is either created or checked out.
The joukko git branch file is created after checkout if it doesn't exist.

## Finishing the session

When it is time to finish the session the last driver should run the following command instead of passing the torch:
```
$ joukko finish
```
As with the other phases, finishing a session also begins with checks. The check for finishing a session includes checks for the git directory, the joukko git branch file and for the current branch being the mob programming branch.

After pre-checks, joukko finds the previous commit message and asks if the user wants to amend new changes to the previous commit or wants to make a new commit. If user wanted to amend changes, joukko amends changes and pushes changes to the mob programming branch with force. Otherwise user is asked to give a commit message before creating the commit and pushing. As this is the last step in the mob programming session, the joukko git branch file is removed before creating the commit.

## Renaming joukko branch

When the current joukko mob session branch is to be renamed, one should run the following command:
```
$ joukko rename
```
As with the mob programming session workflow, renaming the joukko branch begins with checks. First joukko checks that the current directory is a git directory. Then joukko checks whether the current branch is the same as the default git branch. If the branches match, branch cannot be renamed. Finally joukko checks that there is a joukko file with a branch name in it.

If checks pass, joukko renames the git branch first, the branch name in joukko file second.

> Note: Rename only renames the current local joukko branch. If the branch already exists in a remote repository, it will remain the same there.

## License

MIT. Read more from the [license](LICENSE) file.

## TODO
- Ask credentials for git operations so it is not necessary to type them multiple times
- Add support for multiple remotes
- Improve logging
- Combine prechecks
- Maybe add the ability to change the name of the mob branch
