"use strict";

require('dotenv').config();

const { GithubPusher } = require('./github/github-push')
const { BitbucketPuller } = require('./bitbucket/bitbucket-pull')

async function main() {

    const bitbucketPull = new BitbucketPuller({
        username: process.env.BITBUCKET_USERNAME,
        mail: process.env.BITBUCKET_MAIL,
        pw: process.env.BITBUCKET_PASSWORD,
        workspace: process.env.BITBUCKET_WORKSPACE
    });

    const repos = await bitbucketPull.getRepoNames();
    const bitbucketCommits = await bitbucketPull.getAllUserCommits(repos)

    const githubPush = new GithubPusher({
        owner: process.env.GITHUB_OWNER,
        username: process.env.GITHUB_USERNAME,
        mail: process.env.GITHUB_MAIL,
        token: process.env.GITHUB_TOKEN,
    });

    await githubPush.sync(bitbucketCommits);
}

main();
