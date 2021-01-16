"use strict";

require('dotenv').config();
const fetch = require('node-fetch');

const apiUrl = "https://api.github.com";

async function _makeRequest(method, url, body) {
    const opts = {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
        }
    }

    method = method.toUpperCase();
    if (method === "PUT"  ||
        method === "POST" ||
        method === "PATCH") {
        opts.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(url, opts);

        if (res.ok) {
            const data = await res.json();
            return data;
        } else {
            console.log(`Request failed with reponse: ${res.status}`);
            return null;
        }

    } catch (err) {
        console.log(err);
        return null;
    }
}

async function getRepos() {
    const repoList = [];

    const repos = await _makeRequest("GET", `${apiUrl}/user/repos`);

    if (repos) {
        repos.forEach(repo => {
            repoList.push(repo.name)
        })
    }
    return repoList;
};

async function createRepo(body) {
    return await _makeRequest("POST", `${apiUrl}/user/repos`, body);
};

async function createBlob(owner, repo, content) {
    const encodedContent = new Buffer.from(content).toString('base64');

    const body = {
        content: encodedContent,
        encoding: "base64"
    };

    const url = `${apiUrl}/repos/${owner}/${repo}/git/blobs`;

    return await _makeRequest("POST", url, body);
}

async function _handleTreeOps(owner, repo, body) {
    const url = `${apiUrl}/repos/${owner}/${repo}/git/trees`;

    return _makeRequest("POST", url, body);
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

    return _makeRequest("POST", url, body);
}

async function updateRef(owner, repo, branch, commitSha) {
    const url = `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`;

    return _makeRequest("PATCH", url, { sha: commitSha });
}

async function getLatestCommitSha(owner, repo, branch) {
    const url = `${apiUrl}/repos/${owner}/${repo}/commits/${branch}`;

    const commit = await _makeRequest("GET", url);
    return commit.sha;
}

module.exports = {
    getRepos,
    createRepo,
    createBlob,
    createTree,
    modifyTree,
    createCommit,
    updateRef,
    getLatestCommitSha,
};
