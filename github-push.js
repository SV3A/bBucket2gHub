"use strict";

const ghAPI = require('./github-api')

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

async function initializeRepo(owner, bitbucketRepos) {

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
        // return;
    }

    // Populate the newly created Github repository with a file for each of the
    // Bitbucket repositories
    const treeEntries = [];

    bitbucketRepos.forEach(bbRepo => {
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
                email: "svean@protonmail.com",
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

module.exports = {
    initializeRepo
};
