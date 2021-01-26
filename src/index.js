"use strict";

require('dotenv').config();

const fs = require('fs')
const bitbucketData = require('./data/bitbuck_data')
const { getRepoNames, getAllUserCommits } = require('./bitbucket/bitbucket-pull')
const github = require('./github/github-push')


async function bitbucketTest() {

    // Get list of repositories
    console.log("Getting repos...");
    const repos = await getRepoNames();

    // Find all commits made by user with following mail
    const mail = process.env.MAIL;
    const userCommits = await getAllUserCommits(repos, mail);

    // Write results
    const jsonStr = JSON.stringify(userCommits, null, 2)

    fs.writeFile('./bitbuck_data.json', jsonStr, err => {
        err && console.log(err)
    })
}

async function githubTest() {
    const githubOwner = process.env.GITHUB_OWNER;

    await github.sync(githubOwner, bitbucketData);
}

// bitbucketTest();
githubTest();
