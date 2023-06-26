Bitbucket 2 GitHub Activity Sync
===================================
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/SV3A/bBucket2gHub/blob/master/LICENSE)

A small tool for including Bitbucket commits in the contributions graph on
GitHub.

## What does it do?
Say you have some repositories on Bitbucket, e.g. for work. This program allows you to shadow you coding activity on Bitbucket to the contributions chart on your Activity overview on GitHub.

![Contribution graph on GitHub](https://raw.githubusercontent.com/SV3A/bBucket2gHub/main/doc/contrib.png?token=AC4MKO7CBL7XIWIXGXT7JCTAIT74K)

You do this by querying the Bitbucket workspace for commits made by you. The program then makes a *shadow* repository on GitHub. Here each Bitbucket repository is represented by a file, and each Bitbucket commit is reflected by the Bitbucket commit hash.

The Bitbucket hashes are added backwards in time so the match the point in time when the original commit was made on Bitbucket.

> **_Note:_**  Per default the shadow repository is made private to hide sensitive information. This means that the program depends on the GitHub settings to allow to show activity from _both_ public and private repositories ([read more](https://docs.github.com/en/github/setting-up-and-managing-your-github-profile/publicizing-or-hiding-your-private-contributions-on-your-profile)).

## Quick start:
### 1) Clone the repository and install:
``` bash
$ git clone https://github.com/SV3A/bBucket2gHub.git
$ cd bBucket2gHub
$ npm install
```

### 2) Create an environment file with credentials:
Rename the file `.env.example` to `.env` and fill accordingly

For now the program works with username/password for Bitbucket and [Personal access tokens](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) for GitHub. So make sure to create such a token and add it to the `.env` file.

### 3) Run the program:
``` bash
$ node src/index.js
```
## Beta support for Azure DevOps

### 1) Add required environment variables
```
AZURE_MAIL=[FILL ACCORDINGLY]
AZURE_TOKEN=[FILL ACCORDINGLY]
AZURE_PROJECT=[FILL ACCORDINGLY]
AZURE_ORG=[FILL ACCORDINGLY]
```

### 2) Run the program
$ node src/index_azure.js

