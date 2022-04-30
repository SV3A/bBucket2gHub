"use strict";

const { makeRequest } = require('../utils')

const API_URL = "https://dev.azure.com";

class AzurePuller {

    constructor(user) {
        this.usermail = user.mail;
        this.project = user.project;
        this.organization = user.organization;

        this.commitsBuffer = [];

        this.headers =  {
            "Content-Type": "application/json",
            "Authorization": "Basic " +
                new Buffer.from("" + ":" + user.paToken).toString('base64')
        }
    }

    async getRepoNames() {
        // Gets the slugs of all repos found in the workspace

        console.log("Getting repo list from Azure...");

        const results = [];

        let url = (
            `${API_URL}/${this.organization}/${this.project}/_apis/git/repositories?api-version=6.1-preview.1`
        );

        const data = await makeRequest("GET", url, this.headers);

        data.value.forEach(item => {
            results.push(item.name);
        });

        return results;
    };

    async getAllUserCommits(repos) {

        const promises = [];
        this.commitsBuffer = [];

        console.log(`Fetching commits from ${repos.length} Azure repos...`);

        for (let ii = 0; ii < repos.length; ii++) {
            promises.push(
                this._getRepoCommits(repos[ii])
            );
        }

        await Promise.all(promises);
        console.log("Done.");

        return this.commitsBuffer;
    }

    async _getRepoCommits(repo) {
        // Returns all the commits made by the user in the specified repository

        let commits = [];

        let url = (
            `${API_URL}/${this.organization}/${this.project}/_apis/git/` +
            `repositories/${repo}/commits` +
            `?searchCriteria.author=${this.usermail}&api-version=5.1`
        );

        const data = await makeRequest("GET", url, this.headers);

        if (data.ok) {
            data.value.forEach(item => {

                commits.push({
                    "hash": item.commitId,
                    "date": item.author.date,
                    "user": this.usermail
                });
            });
        }

        if (commits && commits.length > 0) {
            this.commitsBuffer.push({
                "repo": repo, "commits": commits
            });
        }
    }
}

module.exports = { AzurePuller };