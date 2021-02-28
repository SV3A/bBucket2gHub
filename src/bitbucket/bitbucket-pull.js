"use strict";

const { makeRequest } = require('../utils')

const API_URL = "https://api.bitbucket.org/2.0";

class BitbucketPuller {

    constructor(user) {
        this.username = user.username;
        this.pw = user.pw;
        this.workspace = user.workspace;
        this.usermail = user.mail;

        this.commitsBuffer = [];

        this.headers =  {
            "Content-Type": "application/json",
            "Authorization": "Basic " +
                new Buffer.from(this.username + ":" + this.pw).toString('base64')
        }
    }

    _getMail(authorRawStr) {
        // Extracts the mail address of the "raw author" string, e.g.
        // "abc <abc@somewhere.com>", via a regular expression

        const mailMatch = authorRawStr.match(/(?:\<)(.*)(?=\>)/);

        if (mailMatch) {
            return mailMatch[1]; // Second capture group
        } else {
            return null;
        }
    }

    async _getRepoCommits(repo) {
        // Returns all the commits made by the user in the specified repository

        let commits = [];

        let url = (
            `${API_URL}/repositories/${this.workspace}/${repo}/commits/` +
            "?fields=next,values.author,values.date,values.hash"
        );

        // do-while loop that handles the pagination of the API
        do {
            const data = await makeRequest("GET", url, this.headers);

            if (data.ok) {

                data.values.forEach(item => {

                    const mail = this._getMail(item.author.raw);

                    if (mail === this.usermail) {
                        commits.push({
                            "hash": item.hash,
                            "date": item.date,
                            "user": mail
                        });
                    }
                });

                url = data.next;
            } else {
                url = null;
            }

        } while (url)

        if (commits && commits.length > 0) {
            this.commitsBuffer.push({
                "repo": repo, "commits": commits
            });
        }
    }

    async getRepoNames() {
        // Gets the slugs of all repos found in the workspace

        console.log("Getting repo list from Bitbucket...");

        const results = [];

        let url = (
            `${API_URL}/repositories/${this.workspace}?fields=next,values.slug`
        );

        // do-while loop that handles the pagination of the API
        do {
            const data = await makeRequest("GET", url, this.headers);

            data.values.forEach(item => {
                results.push(item.slug);
            });

            url = data.next;
        } while (url)

        return results;
    };

    async getAllUserCommits(repos) {

        const promises = [];
        this.commitsBuffer = [];

        console.log(`Fetching commits from ${repos.length} Bitbucket repos...`);

        for (let ii = 0; ii < repos.length; ii++) {
            promises.push(
                this._getRepoCommits(repos[ii])
            );
        }

        await Promise.all(promises);
        console.log("Done.");

        return this.commitsBuffer;
    }
}

module.exports = { BitbucketPuller };
