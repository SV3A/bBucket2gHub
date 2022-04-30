"use strict";

require('dotenv').config();

const { GithubPusher } = require('./github/github-push')
const { AzurePuller } = require('./azure/azure-pull')

async function main() {

    const azurePull = new AzurePuller({
        mail: process.env.AZURE_MAIL,
        paToken: process.env.AZURE_TOKEN,
        project: process.env.AZURE_PROJECT,
        organization: process.env.AZURE_ORG
    });

    const repos = await azurePull.getRepoNames();
    const azureCommits = await azurePull.getAllUserCommits(repos)

    const githubPush = new GithubPusher(
        {
            owner: process.env.GITHUB_OWNER,
            username: process.env.GITHUB_USERNAME,
            mail: process.env.GITHUB_MAIL,
            token: process.env.GITHUB_TOKEN,
        },
        "AzureShadowContributions"
    );

    await githubPush.sync(azureCommits);
}

main();
