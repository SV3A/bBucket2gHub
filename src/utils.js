const fetch = require('node-fetch');

async function _logRequestError(res) {
    // Prints the failed status and its url
    let msg;

    // If failed reponse includes a message append it
    try {
        let res_json = await res.json();
        res_json.message ? msg = `:\n    "${res_json.message}"` : msg = "";
    } finally {}

    console.log(
        `Request to \x1b[32m${res.url}\x1b[0m ` +
        `failed with status \x1b[33m${res.status}\x1b[0m${msg}`
    );
}

async function makeRequest(method, url, headers, body) {
    const opts = {
        method: method,
        headers: headers
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
            const json = await res.json();
            json.ok = true;
            return json
        } else {
            _logRequestError(res);
            return {ok: false};
        }

    } catch (err) {
        console.log(err);
        return {ok: false};
    }
}

module.exports = {
    makeRequest
}