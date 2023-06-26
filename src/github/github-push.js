"use strict";

const { GithubAPI } = require('./github-api')

class GithubPusher {

    constructor(user, githubRepoName = "BitbucketShadowContributions") {
        this.owner = user.owner;
        this.username = user.username,
        this.usermail = user.mail;

        this.api = new GithubAPI(user.token);
        this.repo = githubRepoName;
    }

    async _githubRepoExists() {
        const repos = await this.api.getRepos();

        return repos.includes(this.repo);
    }

    async _initShadowRepo() {
        console.log("Creating GitHub shadow repo...");

        const response = await this.api.createRepo(
            {
                name: this.repo,
                description: "Created by Bitbucket2GitHub",
                homepage: "https://github.com/SV3A/bBucket2gHub",
                private: true,
                auto_init: true
            });

        if (!response.ok) {
            throw new Error("Initialization of repository failed");
        }
    }

    async _getBlobContents(sha) {

        const response = await this.api.getBlob(this.owner, this.repo, sha);

        return (
            new Buffer.from(response.content, response.encoding).toString("utf8")
        );
    }

    async _queryBlobSha(filename) {

        try {
            const head = await this.api.getLatestCommit(this.owner, this.repo, "main");

            const res = (
                await this.api.getTree(this.owner, this.repo, head.commit.tree.sha)
            );

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

    async _commitShadow(filename, content, date) {

        const head = await this.api.getLatestCommit(this.owner, this.repo, "main");

        const tree = await this.api.modifyTree(
            this.owner,
            this.repo,
            head.commit.tree.sha,
            [{
                path: filename,
                mode: "100644",
                type: "blob",
                content: content
            }]
        );

        const commit = await this.api.createCommit(this.owner, this.repo, {
            message: `Update ${filename}`,
            tree: tree.sha,
            parents: [head.sha],
            author: {
                name: this.username,
                email: this.usermail,
                date: date
            }
        })

        await this.api.updateRef(this.owner, this.repo, "main", commit.sha);
    }

    async _mkOrUpdateShadow(repoName, commits, content) {
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
                await this._commitShadow(repoName, content, commit.date);
                commitsAdded += 1;
            }
        }

        // Print msg: "- Added X commits from [REPO/SHADOW NAME]"
        console.log(
            `- Added \x1b[33m${commitsAdded}\x1b[0m commits`
        );
    }

    async _getOrInitShadowContent(repoName) {
        const shadowFilename = repoName;

        const blob = await this._queryBlobSha(shadowFilename);

        // Get the current content in the shadow file, if shadow does not exist,
        // we init a new contect string
        let content;

        if (blob.exist) {
            content = await this._getBlobContents(blob.sha);
        } else {
            content = "";
        }

        return content;
    }

    async sync(bitbucketData) {

        // Create GitHub shadow repository if it doesn't already exist
        if (! await this._githubRepoExists()) {
            await this._initShadowRepo();
        }

        // For each repository on Bitbucket, update (or create) shadow file on
        // GitHub
        for (let ii = 0; ii < bitbucketData.length; ii++) {
            const repoName = bitbucketData[ii].repo;
            const commits = bitbucketData[ii].commits;

            // Print msg: "Syncing X out of Y"
            console.log(`Syncing \x1b[32m${repoName}\x1b[0m (${ii + 1}/${bitbucketData.length})`);

            const content = await this._getOrInitShadowContent(repoName);

            await this._mkOrUpdateShadow(repoName, commits, content);
        }
    }
}

module.exports = {
    GithubPusher
};
