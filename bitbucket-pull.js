"use strict";

require('dotenv').config();
const fetch = require('node-fetch');

const username = process.env.USERNAME;
const pw = process.env.PASSWORD;
const workspace = process.env.WORKSPACE;

const apiUrl = "https://api.bitbucket.org/2.0";

const opts = {
    method: 'get',
    headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " +
            new Buffer.from(username + ":" + pw).toString('base64')
    }
};

function getMail(authorRawStr) {
    // Extracts the mail address of the "raw author" string, e.g.
    // "abc <abc@somewhere.com>", via a regular expression

    const mailMatch = authorRawStr.match(/(?:\<)(.*)(?=\>)/);

    if (mailMatch) {
        return mailMatch[1]; // Second capture group
    } else {
        return null;
    }
}

async function getRepoNames() {
    // Gets the slugs of all repos found in the chosen "workspace"

    const results = [];

    let url = `${apiUrl}/repositories/${workspace}?fields=next,values.slug`

    // do-while loop that handles the pagination of the API
    do {
        const res = await fetch(url, opts);

        const data = await res.json();

        data.values.forEach(item => {
            results.push(item.slug);
        });

        url = data.next;
    } while (url)

    return results;
};

async function getAllUserCommits(repos, userMail) {
    const userCommits = []; // All the commits made by the user

    for (let ii = 0; ii < repos.length; ii++) {
        const repo = repos[ii];

        console.log(`Searching "${repo}"`);
        
        let commits = [];

        let url = (
            `${apiUrl}/repositories/${workspace}/${repo}/commits/` +
            "?fields=next,values.author,values.date,values.hash"
        );

        // do-while loop that handles the pagination of the API
        do {
            try {
                const res = await fetch(url, opts);

                if (res.ok) {
                    const data = await res.json();

                    data.values.forEach(item => {

                        const mail = getMail(item.author.raw);

                        if (mail === userMail.trim()) {
                            commits.push(
                                {
                                    "hash": item.hash,
                                    "date": item.date,
                                    "user": mail
                                }
                            );
                        }
                    });

                    url = data.next;
                } else {
                    url = null;
                }

            } catch (err) {
                console.log(err);
            }

        } while (url)

        if (commits && commits.length > 0) {
            userCommits.push( { "repo": repo, "commits": commits });
        }
    }

    return userCommits;
}

module.exports = { getRepoNames, getAllUserCommits };
