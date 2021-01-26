"use strict";

const ghAPI = require('./github-api')

const owner = process.env.GITHUB_OWNER;
const repo = "BitbucketShadowContributions";

async function githubRepoExists() {
    const repos = await ghAPI.getRepos();

    return repos.includes(repo);
}

async function initRepo() {
    console.log("Creating repo...");

    const response = await ghAPI.createRepo(
        {
            name: repo,
            description: "Created by Bitbucket2GitHub",
            homepage: "https://github.com/SV3A/bBucket2gHub",
            private: true,
            auto_init: true
        });

    if (!response.ok) {
        throw new Error("Initialization of repository failed");
    }

}

async function _getBlobContents(sha) {

    const response = await ghAPI.getBlob(owner, repo, sha);

    return (
        new Buffer.from(response.content, response.encoding).toString("utf8")
    );
}

async function _queryBlobSha(filename) {

    try {
        const head = await ghAPI.getLatestCommit(owner, repo, "main");

        const res = await ghAPI.getTree(owner, repo, head.commit.tree.sha);

        // Loop over blobs in tree
        for (let ii = 0; ii < res.tree.length; ii++) {
            const entry = res.tree[ii];

            if (entry.path === filename) {
                return { exist: true, sha: entry.sha };
            }
        }

        return { exist: false, sha: null };

    } catch {
        throw new Error("Query for blob failed");
    }
}

async function _commitShadow(filename, content, date) {

    const head = await ghAPI.getLatestCommit(owner, repo, "main");

    const tree = await ghAPI.modifyTree(
        owner,
        repo,
        head.commit.tree.sha,
        [{
            path: filename,
            mode: "100644",
            type: "blob",
            content: content
        }]
    );

    const commit = await ghAPI.createCommit(owner, repo, {
        message: `Update ${filename}`,
        tree: tree.sha,
        parents: [head.sha],
        author: {
            name: process.env.GITHUB_NAME,
            email: process.env.GITHUB_MAIL,
            date: date
        }
    })

    await ghAPI.updateRef(owner, repo, "main", commit.sha);
}

async function _mkOrUpdateShadow(repoName, commits, content) {
    // Commit Bitbucket commit-hashes one by one to GitHub shadow files
    let commitsAdded = 0;

    let contentArray;

    for (let ii = 0; ii < commits.length; ii++) {
        const commit = commits[ii];

        // Convert lines in str to array for easier handling
        contentArray = content.split('\n')

        // Check that the Bitbucket hash is not already in the shadow file
        if (!contentArray.includes(commit.hash)) {
            contentArray.push(commit.hash)

            content = contentArray.join('\n').trim();

            // Commit
            await _commitShadow(repoName, content, commit.date);
            commitsAdded += 1;
        }
    }

    // Print msg: "- Added X commits from [REPO/SHADOW NAME]"
    console.log(
        `- Added \x1b[33m${commitsAdded}\x1b[0m commits ` +
        `from \x1b[32m${repoName}\x1b[0m`
    );
}

async function _getOrInitShadowContent(repoName) {
    const shadowFilename = repoName;

    const blob = await _queryBlobSha(shadowFilename);

    // Get the current content in the shadow file, if shadow does not exist,
    // we init a new contect string
    let content;

    if (blob.exist) {
        content = await _getBlobContents(blob.sha);
    } else {
        content = "";
    }

    return content;
}

async function sync(owner, bitbucketData) {
    owner = owner

    // Create GitHub shadow repository if it doesn't already exist
    if (! await githubRepoExists()) {
        await initRepo();
    }

    // For each repository on Bitbucket, update (or create) shadow file on
    // GitHub
    for (let ii = 0; ii < bitbucketData.length; ii++) {
        const repoName = bitbucketData[ii].repo;
        const commits = bitbucketData[ii].commits;

        // Print msg: "Syncing X out of Y"
        console.log(`Syncing ${ii + 1} out of ${bitbucketData.length}`);

        const content = await _getOrInitShadowContent(repoName);

        await _mkOrUpdateShadow(repoName, commits, content);
    }
}

module.exports = {
    initRepo,
    sync,
};
