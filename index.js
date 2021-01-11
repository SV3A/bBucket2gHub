"use strict";

require('dotenv').config();

const fs = require('fs')
const { getRepoNames, getAllUserCommits } = require('./bitbucket-pull')

async function main() {

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

main();
