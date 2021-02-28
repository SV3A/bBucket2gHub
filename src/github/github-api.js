"use strict";

const { makeRequest } = require('../utils')

const API_URL = "https://api.github.com";

class GithubAPI {

    constructor(token) {
        this.headers =  {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    }

    async getRepos() {
        const repoList = [];

        const repos = (
            await makeRequest("GET", `${API_URL}/user/repos`, this.headers)
        );

        if (repos) {
            repos.forEach(repo => {
                repoList.push(repo.name)
            })
        }
        return repoList;
    };

    async createRepo(body) {
        return (
            await makeRequest("POST", `${API_URL}/user/repos`, this.headers, body)
        );
    };

    async getBlob(owner, repo, sha) {
        const url = `${API_URL}/repos/${owner}/${repo}/git/blobs/${sha}`;

        return await makeRequest("GET", url, this.headers);
    }

    async createBlob(owner, repo, content) {
        const encodedContent = new Buffer.from(content).toString('base64');

        const body = {
            content: encodedContent,
            encoding: "base64"
        };

        const url = `${API_URL}/repos/${owner}/${repo}/git/blobs`;

        return await makeRequest("POST", url, this.headers, body);
    }

    async _handleTreeOps(owner, repo, body) {
        const url = `${API_URL}/repos/${owner}/${repo}/git/trees`;

        return makeRequest("POST", url, this.headers, body);
    }

    async createTree(owner, repo, treeEntries) {
        const body = { tree: treeEntries };

        return this._handleTreeOps(owner, repo, body);
    }

    async modifyTree(owner, repo, baseTree, treeEntries) {
        const body = {
            tree: treeEntries,
            base_tree: baseTree
        };
        return this._handleTreeOps(owner, repo, body);
    }

    async createCommit(owner, repo, commit) {
        const body = commit;
        const url = `${API_URL}/repos/${owner}/${repo}/git/commits`;

        return makeRequest("POST", url, this.headers, body);
    }

    async updateRef(owner, repo, branch, commit_sha, force = false) {
        const url = `${API_URL}/repos/${owner}/${repo}/git/refs/heads/${branch}`;

        return makeRequest("PATCH", url, this.headers, {
            sha: commit_sha,
            force: force
        });
    }

    async getLatestCommitSha(owner, repo, branch) {
        const commit = getLatestCommit(owner,repo, branch)
        return commit.sha;
    }

    async getLatestCommit(owner, repo, branch) {
        const url = `${API_URL}/repos/${owner}/${repo}/commits/${branch}`;

        return await makeRequest("GET", url, this.headers);
    }

    async getContent(owner, repo, filename, commit) {
        const url = (
            `${API_URL}/repos/${owner}/${repo}/content/${filename}?ref=${commit}`
        );

        return await makeRequest("GET", url, this.headers);
    }

    async fetchContentUrl(url) {

        return await makeRequest("GET", url, this.headers);
    }

    async getTree(owner, repo, sha) {
        const url = `${API_URL}/repos/${owner}/${repo}/git/trees/${sha}`;

        return await makeRequest("GET", url, this.headers);
    }
};

module.exports = {
    GithubAPI
};
