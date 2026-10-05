import { ProxyAgent } from 'undici';

// ─────────────────────────────────────────────────────────────
// YOUR COOKIE — PASTE A FRESH ONE HERE
// ─────────────────────────────────────────────────────────────

let COOKIE = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEQAhoGCAIQBBgBIhsKBGR1aWQSEzI2MjI4ODAwMzYyOTg1NDk1NDIiFQoFdW5hbWUSDGdvam9tZW93bWFuNyISCgN1aWQSCzEwNzg0MzU0MDkzKAM.a5cZ1ynRMvfU4o-c5W1ZgG_erMi9q1BHwOJgf8bq3mKzkkAIm8_m05ThromDGhPeUdqCUnUkgxxszWZsip8TuN9_HOVM_DzrTUwiaUUkdojsTKf4Lnw1JmYyDUEX_b2EkP759w2vQ62ciH8A--VbSBmLyYeo0nyp-m0H0Am-1lLuct0sqzVSyxlbJ1_1HeWpMa9IU-xoVSDlo1X5JLK_TqDZXoe-PQ-XOV6HUOs9FPwgK8pxZZkKeuZIyX6VvAY77PniIaYQnx3lH9wlQMe3i0-D0cb0sdNTV6p6nieuahNe-668p7t0mMuxw8XX11cHTkSgOSnqu7QTqjvOy5kW69dTtA1DygxQCxUbPzbFbVtPGLg_ZWMSFJBn9JJWSv0N2_bvhufH6gwh_u_K2d0jFkCaGIWYpe4VeYPQ9f7-4ylGkzLpLmtqbvmrj5ipg0QddI-XpeX6dfewX-6IqToQmboJ79agaCb7-VMn_OiGEJvgJepOf1AwAkT7q9HJ3jy3p1-6BR88d-vyDj9aqaMpCuHs6Gm-no8D6l8KdYlM5onuTv0M9FYLA-cA_VrSgdpqozbWHeoYGO2kclV2lUBIGeDxfwTdxB7oSfljtEjCw5e1DxJ_9GD2dxN2gRhl_j0UhOTP2k68wpdMwe6mqel_gQL7YmSCuBO9WwECCohGy2oLRVlSteBlO8p4bn0MfBBcCki0_sieb705VlutH3UHV_ua_Vb4bQ3lTnKI4degfimDQTZIeuOMAmtMYXshA4Z6EE1anoEZi7G-BlFbFNJw67TIAO7WZ66YarF-p1Am_EwLI5-eW_KUsX7oNngyf0B3rXSKqaeTfmy0V1X7PfV7fQ1QXjp9cHisclZmYVpe88axohCufKHEMki-iHFZqX9XHZpKT9NNjoeUT5BHf7nBuA6pwemGUKJQK10BxTBeiF8.-teNIDhwsaJPZ_2B6fXX0Suzt28";

const MAIN_ID = "5813174190";

// ─────────────────────────────────────────────────────────────
// PROXIES TO TEST
// ─────────────────────────────────────────────────────────────

const PROXIES = {
    "direct (no proxy)": null,
    "Webshare #1": {
        uri: "http://31.59.20.176:6754",
        token: "Basic " + Buffer.from("gvfllbrs:upfekwtppxxm").toString("base64")
    },
    "Webshare #2": {
        uri: "http://45.38.107.97:6014",
        token: "Basic " + Buffer.from("gvfllbrs:upfekwtppxxm").toString("base64")
    }
};

// ─────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────

const TESTS = [
    { name: "Neutral site (control)", url: "https://httpbin.org/ip", method: "GET", needsAuth: false, contentType: false },
    { name: "Roblox: public profile", url: `https://users.roblox.com/v1/users/${MAIN_ID}`, method: "GET", needsAuth: false, contentType: false },
    { name: "Roblox: CSRF token", url: "https://auth.roblox.com/v2/logout", method: "POST", needsAuth: true, contentType: false },
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
        return { dispatcher: new ProxyAgent({ uri: cfg.uri, token: cfg.token }), error: null };
    } catch (e) {
        return { dispatcher: null, error: e.message };
    }
}

function snippet(text, max = 120) {
    if (!text) return "(empty)";
    return text.replace(/\s+/g, " ").trim().slice(0, max);
}

// FIX #1: Corrected regex — requires the exact "_|WARNING" prefix
function updateCookieFromResponse(res, headers) {
    let setCookies = [];
    try {
        setCookies = res.headers.getSetCookie();
    } catch (e) {
        const single = res.headers.get("set-cookie");
        if (single) setCookies = [single];
    }
    if (!setCookies || setCookies.length === 0) return;

    for (const cookieStr of setCookies) {
        if (cookieStr.includes(".ROBLOSECURITY=")) {
            const match = cookieStr.match(/\.ROBLOSECURITY=(_\|WARNING[^;]+)/);
            if (match) {
                const newCookie = match[1];
                if (newCookie !== COOKIE) {
                    COOKIE = newCookie;
                    if (headers) headers["Cookie"] = ".ROBLOSECURITY=" + COOKIE;
                    console.log("      🔄 Cookie rotated (new length: " + COOKIE.length + ")");
                }
            }
        }
    }
}

function classifyError(e) {
    const name = e.name || "";
    const code = e.cause?.code || "";
    const msg = (e.cause?.message || e.message || "").toLowerCase();

    if (msg.includes("464") || msg.includes("proxy response")) return { status: "🚫 464 Proxy Blocked", detail: "Proxy refused CONNECT tunnel" };
    if (name === "TimeoutError" || code === "UND_ERR_CONNECT_TIMEOUT" || msg.includes("timeout")) return { status: "⏱️ Timeout", detail: "No response in 20s" };
    if (code === "UND_ERR_ABORTED") return { status: "🚫 Proxy Aborted", detail: snippet(e.cause?.message || e.message, 80) };
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return { status: "🌐 DNS Failed", detail: "Proxy hostname not resolvable" };
    if (code === "ECONNREFUSED") return { status: "🔌 Conn Refused", detail: "Proxy rejected TCP connection" };
    if (code === "ECONNRESET") return { status: "🔌 Conn Reset", detail: "Proxy closed connection early" };
    return { status: "💥 Error", detail: (code || name) + ": " + snippet(msg, 80) };
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
        result.detail = snippet(error, 80);
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
            updateCookieFromResponse(csrfRes, baseHeaders);
            await csrfRes.text();
            const csrf = csrfRes.headers.get("x-csrf-token");
            if (!csrf) {
                result.status = "❌ NO CSRF";
                result.detail = "Status " + csrfRes.status + " — cookie expired or proxy blocked";
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

    const opts = { method: test.method, headers: baseHeaders, signal: AbortSignal.timeout(20000) };
    if (dispatcher) opts.dispatcher = dispatcher;
    if (test.contentType) opts.body = "{}";

    try {
        const res = await fetch(test.url, opts);
        // FIX #2: Pass baseHeaders so cookie rotation propagates
        updateCookieFromResponse(res, baseHeaders);
        const body = await res.text();
        const c = classifyResponse(res.status, body);
        result.status = c.status;
        result.detail = c.detail;
    } catch (e) {
        const c = classifyError(e);
        result.status = c.status;
        result.detail = c.detail;
    }
    return result;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
    console.log("");
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║       ROBLOX AUTOMATION DIAGNOSTIC REPORT                 ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log("");

    // ── Cookie format validation (official Roblox regex) ──
    const EXPIRED_COOKIE_REGEX = /^(_\|WARNING:-DO-NOT-SHARE-THIS\.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items\.|_)(GgIQAQ\.)?([0-9A-F]+)$/;

    if (!COOKIE || COOKIE === "PASTE_YOUR_FRESH_COOKIE_HERE") {
        console.log("⚠️  COOKIE NOT SET");
        console.log("");
    } else if (EXPIRED_COOKIE_REGEX.test(COOKIE)) {
        console.log("❌ COOKIE IS EXPIRED (matches old hex format)");
        console.log("   → Get a fresh cookie from a new login.");
        console.log("");
    } else if (!COOKIE.startsWith("_|WARNING:-DO-NOT-SHARE-THIS")) {
        console.log("⚠️  COOKIE FORMAT UNRECOGNIZED");
        console.log("   → Start: " + COOKIE.slice(0, 40) + "...");
        console.log("");
    } else {
        console.log("✅ Cookie format looks valid");
        console.log("   Length: " + COOKIE.length + " chars");
        console.log("   Start:  " + COOKIE.slice(0, 25) + "...");
        console.log("");
    }

    console.log("Target user: " + MAIN_ID);
    console.log("");

    const results = [];
    for (const [proxyName, proxyConfig] of Object.entries(PROXIES)) {
        console.log("─────────────────────────────────────────────────────────────");
        console.log("  Proxy: " + proxyName);
        console.log("─────────────────────────────────────────────────────────────");
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
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║                  FINAL SUMMARY TABLE                      ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log("");

    for (const testName of TESTS.map(t => t.name)) {
        console.log("▶ " + testName);
        for (const proxyName of Object.keys(PROXIES)) {
            const r = results.find(x => x.proxy === proxyName && x.test === testName);
            console.log("   " + proxyName.padEnd(20) + " " + (r ? r.status : "?"));
        }
        console.log("");
    }

    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║              WHAT TO DO NEXT                              ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log("");

    const csrfDirect = results.find(r => r.proxy === "direct (no proxy)" && r.test === "Roblox: CSRF token");
    const csrfW1 = results.find(r => r.proxy === "Webshare #1" && r.test === "Roblox: CSRF token");
    const csrfW2 = results.find(r => r.proxy === "Webshare #2" && r.test === "Roblox: CSRF token");
    const d = csrfDirect?.status || "";
    const w1 = csrfW1?.status || "";
    const w2 = csrfW2?.status || "";

    if (d.includes("401") && w1.includes("401") && w2.includes("401")) {
        console.log("➡️  Cookie is EXPIRED. All proxies return 401.");
        console.log("    → Get a fresh cookie from the alt account.");
    } else if (w1.includes("✅") || w2.includes("✅")) {
        console.log("➡️  Webshare works with your cookie!");
        console.log("    → Use that Webshare IP in run-follow.js.");
    } else if (w1.includes("464") || w2.includes("464")) {
        console.log("➡️  Webshare blocked CONNECT to auth.roblox.com.");
        console.log("    → Try a different Webshare IP.");
    } else if (w1.includes("403") || w2.includes("403")) {
        console.log("➡️  Reached Roblox but got 403.");
        console.log("    → Cookie might be valid but flagged. Wait 24h.");
    } else {
        console.log("➡️  Mixed results. Check the table above.");
    }
    console.log("");
    console.log("=== DONE — copy everything above and share it ===");
}

main().catch(err => {
    console.error("FATAL:", err);
    process.exit(1);
});
