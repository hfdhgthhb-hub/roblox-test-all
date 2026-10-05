import { ProxyAgent } from 'undici';

// ─────────────────────────────────────────────────────────────
// CONFIGURATION — EDIT THE COOKIE BELOW
// ─────────────────────────────────────────────────────────────

const COOKIE = "PASTE_YOUR_ALT_COOKIE_HERE";
const MAIN_ID = "5813174190";

const PROXIES = {
    "direct (no proxy)": null,
    "IPLoop": {
        uri: "http://proxy.iploop.io:8880",
        token: "Basic " + Buffer.from(":iploop_30320642_9d98a3b6d6cdaab573aa2bf4c9d7a7e6d86eba28").toString("base64")
    },
    "Webshare": {
        uri: "http://31.59.20.176:6754",
        token: "Basic " + Buffer.from("gvfllbrs:upfekwtppxxm").toString("base64")
    },
    "Quantum": {
        uri: "http://residentialboson.quantumproxies.io:9000",
        token: "Basic " + Buffer.from("qp_cmutvj_4et0cv666627:quantPs7aQ2tTexqVEgqH88FTwE1fWupJ4lp").toString("base64")
    }
};

const TESTS = [
    { name: "Neutral site (control)", url: "https://httpbin.org/ip", method: "GET", needsAuth: false, contentType: false },
    { name: "Roblox: public profile", url: `https://users.roblox.com/v1/users/${MAIN_ID}`, method: "GET", needsAuth: false, contentType: false },
    { name: "Roblox: CSRF token", url: "https://auth.roblox.com/v2/logout", method: "POST", needsAuth: true, contentType: true },
    { name: "Roblox: friend request", url: `https://friends.roblox.com/v1/users/${MAIN_ID}/request-friendship`, method: "POST", needsAuth: true, contentType: true },
    { name: "Roblox: follow", url: `https://friends.roblox.com/v1/users/${MAIN_ID}/follow`, method: "POST", needsAuth: true, contentType: true }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function makeDispatcher(cfg) {
    if (!cfg) return { dispatcher: null, error: null };
    try {
        const d = new ProxyAgent({ uri: cfg.uri, token: cfg.token });
        return { dispatcher: d, error: null };
    } catch (e) {
        return { dispatcher: null, error: e.message };
    }
}

function snippet(text, max = 90) {
    if (!text) return "(empty)";
    return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function classifyError(e) {
    const name = e.name || "";
    const code = e.cause?.code || "";
    const msg = (e.cause?.message || e.message || "").toLowerCase();

    if (msg.includes("464") || msg.includes("proxy response")) {
        return { status: "🚫 464 Proxy Blocked", detail: "Proxy refused CONNECT tunnel" };
    }
    if (name === "TimeoutError" || code === "UND_ERR_CONNECT_TIMEOUT" || msg.includes("timeout")) {
        return { status: "⏱️ Timeout", detail: "No response in 20s" };
    }
    if (code === "UND_ERR_ABORTED") {
        return { status: "🚫 Proxy Aborted", detail: snippet(e.cause?.message || e.message, 60) };
    }
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
        return { status: "🌐 DNS Failed", detail: "Proxy hostname not resolvable" };
    }
    if (code === "ECONNREFUSED") {
        return { status: "🔌 Conn Refused", detail: "Proxy rejected TCP connection" };
    }
    if (code === "ECONNRESET") {
        return { status: "🔌 Conn Reset", detail: "Proxy closed connection early" };
    }
    return { status: "💥 Error", detail: (code || name) + ": " + snippet(msg, 60) };
}

function classifyResponse(status, body) {
    const lower = (body || "").toLowerCase();

    if (status >= 200 && status < 300) return { status: "✅ " + status, detail: snippet(body) };
    if (status === 429) return { status: "⚠️ 429 Rate Limit", detail: snippet(body) };
    if (status === 401) return { status: "🔑 401 Bad Cookie", detail: snippet(body) };
    if (status === 400) return { status: "⚠️ 400 Bad Request", detail: snippet(body) };
    if (status === 403) {
        if (lower.includes("challenge") || lower.includes("captcha") || lower.includes("verification")) {
            return { status: "🔒 403 CAPTCHA", detail: "FunCaptcha required (proxy WORKED)" };
        }
        return { status: "🚫 403 Forbidden", detail: snippet(body) };
    }
    return { status: "⚠️ " + status, detail: snippet(body) };
}

// ─────────────────────────────────────────────────────────────
// TEST RUNNER
// ─────────────────────────────────────────────────────────────

async function runTest(proxyName, proxyConfig, test) {
    const result = { proxy: proxyName, test: test.name, status: "?", detail: "" };

    const { dispatcher, error } = makeDispatcher(proxyConfig);
    if (error) {
        result.status = "❌ PROXY INIT FAILED";
        result.detail = snippet(error, 60);
        return result;
    }

    const baseHeaders = { "User-Agent": UA, "Accept": "application/json" };
    if (test.needsAuth) baseHeaders["Cookie"] = ".ROBLOSECURITY=" + COOKIE;
    if (test.contentType) baseHeaders["Content-Type"] = "application/json";

    // Pre-fetch CSRF for auth-required tests
    if (test.needsAuth && test.name !== "Roblox: CSRF token") {
        try {
            const csrfOpts = {
                method: "POST",
                headers: { ...baseHeaders },
                signal: AbortSignal.timeout(15000)
            };
            if (dispatcher) csrfOpts.dispatcher = dispatcher;
            const csrfRes = await fetch("https://auth.roblox.com/v2/logout", csrfOpts);
            await csrfRes.text();
            const csrf = csrfRes.headers.get("x-csrf-token");
            if (!csrf) {
                result.status = "❌ NO CSRF";
                result.detail = "Status " + csrfRes.status + " — proxy likely blocked";
                return result;
            }
            baseHeaders["X-CSRF-TOKEN"] = csrf;
        } catch (e) {
            const c = classifyError(e);
            result.status = "❌ CSRF FAILED";
            result.detail = c.status + " — " + c.detail;
            return result;
        }
    }

    // Main request with limited retry
    const opts = {
        method: test.method,
        headers: baseHeaders,
        signal: AbortSignal.timeout(20000)
    };
    if (dispatcher) opts.dispatcher = dispatcher;
    if (test.contentType) opts.body = "{}";

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await fetch(test.url, opts);
            const body = await res.text();
            const c = classifyResponse(res.status, body);
            result.status = c.status;
            result.detail = c.detail;
            return result;
        } catch (e) {
            const code = e.cause?.code || "";
            const msg = (e.cause?.message || e.message || "").toLowerCase();

            const isTransient = (code === "ECONNRESET" || code === "ECONNREFUSED") && !msg.includes("464");
            if (attempt === 1 && isTransient) {
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            const c = classifyError(e);
            result.status = c.status;
            result.detail = c.detail;
            return result;
        }
    }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
    console.log("");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║         ROBLOX AUTOMATION DIAGNOSTIC REPORT                 ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("");

    if (!COOKIE || COOKIE === "PASTE_YOUR_ALT_COOKIE_HERE") {
        console.log("⚠️  COOKIE NOT SET — auth tests will show 401 Bad Cookie");
    } else if (COOKIE.length < 100) {
        console.log("⚠️  COOKIE TOO SHORT (" + COOKIE.length + " chars) — likely truncated");
    } else {
        console.log("Cookie length: " + COOKIE.length + " chars");
        console.log("Cookie start:  " + COOKIE.slice(0, 25) + "...");
    }
    console.log("Target user:   " + MAIN_ID);
    console.log("");

    const results = [];

    for (const [proxyName, proxyConfig] of Object.entries(PROXIES)) {
        console.log("────────────────────────────────────────────────────────────────");
        console.log("  Proxy: " + proxyName);
        console.log("────────────────────────────────────────────────────────────────");

        for (const test of TESTS) {
            process.stdout.write("  " + test.name.padEnd(28) + " ... ");
            const r = await runTest(proxyName, proxyConfig, test);
            console.log(r.status);
            if (r.detail) console.log("      └─ " + r.detail);
            results.push(r);
        }
        console.log("");
    }

    console.log("");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║                    FINAL SUMMARY TABLE                       ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("");

    for (const testName of TESTS.map(t => t.name)) {
        console.log("▶ " + testName);
        for (const proxyName of Object.keys(PROXIES)) {
            const r = results.find(x => x.proxy === proxyName && x.test === testName);
            console.log("   " + proxyName.padEnd(20) + " " + (r ? r.status : "?"));
        }
        console.log("");
    }

    console.log("=== DONE — copy everything above and share it ===");
}

main().catch(err => {
    console.error("FATAL:", err);
    process.exit(1);
});
