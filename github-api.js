"use strict";

require('dotenv').config();

const { makeRequest } = require('./utils')

const apiUrl = "https://api.github.com";

const headers =  {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
}

async function getRepos() {
    const repoList = [];

    const repos = await makeRequest("GET", `${apiUrl}/user/repos`, headers);

    if (repos) {
        repos.forEach(repo => {
            repoList.push(repo.name)
        })
    }
    return repoList;
};

async function createRepo(body) {
    return await makeRequest("POST", `${apiUrl}/user/repos`, headers, body);
};

async function getBlob(owner, repo, sha) {
    const url = `${apiUrl}/repos/${owner}/${repo}/git/blobs/${sha}`;

    return await makeRequest("GET", url, headers);
}

async function createBlob(owner, repo, content) {
    const encodedContent = new Buffer.from(content).toString('base64');

    const body = {
        content: encodedContent,
        encoding: "base64"
    };

    const url = `${apiUrl}/repos/${owner}/${repo}/git/blobs`;

    return await makeRequest("POST", url, headers, body);
}

async function _handleTreeOps(owner, repo, body) {
    const url = `${apiUrl}/repos/${owner}/${repo}/git/trees`;

    return makeRequest("POST", url, headers, body);
}

async function createTree(owner, repo, treeEntries) {
    const body = { tree: treeEntries };

    return _handleTreeOps(owner, repo, body);
}

async function modifyTree(owner, repo, baseTree, treeEntries) {
    const body = {
        tree: treeEntries,
        base_tree: baseTree
    };
    return _handleTreeOps(owner, repo, body);
}

async function createCommit(owner, repo, commit) {
    const body = commit;
    const url = `${apiUrl}/repos/${owner}/${repo}/git/commits`;

    return makeRequest("POST", url, headers, body);
}

async function updateRef(owner, repo, branch, commit_sha, force = false) {
    const url = `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`;

    return makeRequest("PATCH", url, headers, {
        sha: commit_sha,
        force: force
    });
}

async function getLatestCommitSha(owner, repo, branch) {
    const commit = getLatestCommit(owner,repo, branch)
    return commit.sha;
}

async function getLatestCommit(owner, repo, branch) {
    const url = `${apiUrl}/repos/${owner}/${repo}/commits/${branch}`;

    return await makeRequest("GET", url, headers);
}

async function getContent(owner, repo, filename, commit) {
    const url = `${apiUrl}/repos/${owner}/${repo}/content/${filename}?ref=${commit}`

    return await makeRequest("GET", url, headers);
}

async function fetchContentUrl(url) {

    return await makeRequest("GET", url, headers);
}

async function getTree(owner, repo, sha) {
    const url = `${apiUrl}/repos/${owner}/${repo}/git/trees/${sha}`;

    return await makeRequest("GET", url, headers);
}

module.exports = {
    getRepos,
    createRepo,
    getBlob,
    createBlob,
    getTree,
    createTree,
    modifyTree,
    createCommit,
    updateRef,
    getLatestCommit,
    getLatestCommitSha,
    getContent,
    fetchContentUrl,
};
