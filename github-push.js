"use strict";

const crypto = require('crypto');
const ghAPI = require('./github-api')

const owner = process.env.GITHUB_OWNER;
const repo = "BitbucketShadowContributions";

async function commitTreeToMain(owner, repo, commit) {
    ghAPI.createCommit(owner, repo, {
        message: commit.msg,
        tree: commit.tree,
        parents: commit.parents,
        author: {
            name: commit.name,
            email: commit.email,
        }
    }).then(r => {
        console.log(r);
        if (r) {
            ghAPI.updateRef(owner, repo, "main", r.sha, true).then(r => console.log(r));
        }
    })
}

async function initRepo(owner, bitbucketData, encrypt=false) {

    const bitbucketRepos = _getRepoList(bitbucketData);

    // If repository not already exists create it
    const repos = await ghAPI.getRepos();

    if (!repos.includes(repo)) {
        await ghAPI.createRepo(
            {
                name: repo,
                description: "Created by Bitbucket2GitHub",
                homepage: "https://github.com/SV3A/bBucket2gHub",
                private: true,
                auto_init: true
            });
    } else {
        console.log("Bitbucket2GitHub already exists.");
        return;
    }

    // Populate the newly created Github repository with a file for each of the
    // Bitbucket repositories
    const treeEntries = [];

    bitbucketRepos.forEach(bbRepo => {
        if (encrypt) {
            bbRepo = crypto.createHash('sha256').update(bbRepo).digest('base64');
        }
        treeEntries.push({
            path: bbRepo,
            mode: "100644",
            type: "blob",
            content: ""
        });
    })

    try {
        const newTree = await ghAPI.createTree(owner, repo, treeEntries);

        if (newTree.sha) {
            commitTreeToMain(owner, repo, {
                name: owner.toLowerCase(),
                email: process.env.GITHUB_MAIL,
                msg: "Initial commit",
                tree: newTree.sha,
                parents: []
            });
        } else {
            throw "Failed to init repo: tree could not be created";
        }
    } catch(err) {
        console.log(err);
    }

}

function _getRepoList(bitbucketData) {
    const bitbucketRepos = [];
    bitbucketData.forEach(repo => {
        bitbucketRepos.push(repo.repo)
    })
    return bitbucketRepos;
}

async function _getRemoteContent(blob_sha) {
    
    const response = await ghAPI.getBlob(owner, repo, blob_sha);

    return (
        new Buffer.from(response.content, response.encoding).toString("utf8")
    );
}

async function _getContents_sha(filename) {
    const head = await ghAPI.getLatestCommit(owner, repo, "main");

    const res = await ghAPI.getTree(owner, repo, head.commit.tree.sha);

    for (let ii = 0; ii < res.tree.length; ii++) {
        const entry = res.tree[ii];

        if (entry.path === filename) {
            return entry.sha;
        }
    }
}

async function _commitUpdate(filename, content, date) {

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

async function _updateShadow(repoName, commits) {
    // Finds the shadow file in the GitHub repo which tracks the current
    // Bitbucket repository, then gets and updates its content

    // Get content url
    const blob_sha = await _getContents_sha(repoName);

    // Get the current content in the shadow file
    let content = await _getRemoteContent(blob_sha);

    // Update the shadow file

    // Commit Bitbucket commit-hashes one by one to GitHub
    let contentArray;

    let commitsAdded = 0;
    for (let ii = 0; ii < commits.length; ii++) {
        const commit = commits[ii];

        contentArray = content.split('\n')

        // Check that the Bitbucket hash is not already in the shadow file
        if ( !contentArray.includes(commit.hash) ) {
            contentArray.push(commit.hash)

            content = contentArray.join('\n').trim();

            // Commit
            await _commitUpdate(repoName, content, commit.date);
            commitsAdded += 1;
        }
    }

    console.log(
        `- Added \x1b[33m${commitsAdded}\x1b[0m commits ` +
        `from \x1b[32m${repoName}\x1b[0m`
    );
}

async function sync(owner, bitbucketData) {

    for (let ii = 0; ii < bitbucketData.length; ii++) {
        const repoName = bitbucketData[ii].repo;
        const commits = bitbucketData[ii].commits;
        
        // Check if exist
        // mkShadow()

        console.log(`Syncing ${ii+1} out of ${bitbucketData.length}`);
        await _updateShadow(repoName, commits);
    }
}

module.exports = {
    initRepo,
    sync,
};
