# Setting up CMS sign-in (Sveltia OAuth relay)

What this fixes: the **"Sign In with GitHub"** button at `/admin`, which currently dead-ends.

Everything here happens in the Cloudflare and GitHub dashboards. **Only Step 4 touches
this repo** — one line.

---

## Do you actually need this?

Not for yourself. Two paths already work:

| Who | Path | Setup needed |
| --- | --- | --- |
| You | **Work with Local Repository** at `/admin` | None. Chromium only. |
| Mac | **Sign In Using Access Token** | None. He pastes a PAT. |
| Mac | **Sign In with GitHub** | This guide. |

The relay's own README is blunt that most projects don't need it, and names exactly one
case that does: *non-technical users signing in.* That's Mac. The token path works but
tokens expire and live per-browser, so you'd be walking him through regenerating one
periodically. That's the reason to do this — not because anything is broken.

---

## Why the button is broken now

Sveltia can't complete an OAuth authorization code flow from the browser alone —
something has to hold the client secret. When `base_url` is absent from the backend
config, Sveltia falls back to **Netlify as the OAuth provider**, purely for Netlify CMS
backward compatibility. This site isn't on Netlify, so the button goes nowhere.

**Do not set up Netlify to fix this.** It's a compatibility path for existing Netlify
customers; using it means adopting a hosting account this project doesn't otherwise
need. Deploy your own relay instead — that's what the rest of this guide does.

---

## Before you start: sequencing

Two ordering constraints, both worth respecting:

1. **Register the OAuth App under the Purple Crate Co org, not your personal account.**
   Whoever owns the OAuth App is permanently in the loop for the client's logins. Same
   reasoning as the [migration plan](cloudflare-migration-plan.md).
2. **`ALLOWED_DOMAINS` (Step 3) wants the site's real hostname**, so the domain should
   be registered. You *can* set it later — it's an optional variable — but leaving it
   unset means any origin can use your relay.

If you want to test the flow before the transfer, you can do all of this under your own
accounts and redo Steps 1–3 later. Steps 1–3 take about ten minutes; the cost of
redoing them is low, so don't let the sequencing block you if you want to prove it works
first.

The repo transfer has already happened — the remote is
`purplecrateco/Mac-Harness-Photography` — and `backend.repo` in
[config.yml](../static/admin/config.yml) has been updated to match. So the
"do this under the org" constraint above is satisfiable now, not later.

---

## Step 1 — Deploy the relay to Cloudflare Workers

Use the deploy button in the [sveltia-cms-auth
repo](https://github.com/sveltia/sveltia-cms-auth), or clone it and run `wrangler
deploy`.

When it's done, open the Cloudflare Workers dashboard → the `sveltia-cms-auth` service,
and copy the Worker URL:

```
https://sveltia-cms-auth.<your-subdomain>.workers.dev
```

You need it in Steps 2 and 4. Call it `<WORKER_URL>` below.

> This is a separate Worker from the one that will serve the site. Don't try to combine
> them.

## Step 2 — Register a GitHub OAuth App

[Register a new OAuth app](https://github.com/settings/applications/new) — under the
**Purple Crate Co org**, per the sequencing note above:

| Field | Value |
| --- | --- |
| Application name | `Sveltia CMS Authenticator` (or anything) |
| Homepage URL | anything — the relay repo URL is fine |
| Application description | leave empty |
| **Authorization callback URL** | `<WORKER_URL>/callback` |

The callback URL is the one field that must be exact — note the `/callback` suffix.

Then click **Generate a new client secret**. Copy both the **Client ID** and the
**Client Secret** now; the secret is only shown once.

## Step 3 — Give the Worker its credentials

Cloudflare dashboard → `sveltia-cms-auth` → **Settings** → **Variables**. Add:

| Variable | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | Client ID from Step 2 |
| `GITHUB_CLIENT_SECRET` | Client Secret from Step 2 — **click Encrypt** |
| `ALLOWED_DOMAINS` | your site's hostname, e.g. `macharness.com, *.macharness.com` |

Save and deploy.

- **Encrypt the secret.** Unencrypted Worker variables are readable in the dashboard.
- **`ALLOWED_DOMAINS` is optional but you want it.** Without it, any site can point at
  your relay and use your OAuth app. The naked domain and its subdomains are separate
  patterns — `example.com, *.example.com` covers both.
- `GITHUB_HOSTNAME` is only for GitHub Enterprise. Skip it.
- These secrets live **only** in Cloudflare. Never in this repo, and never in
  `config.yml` — that file is served to the browser.

## Step 4 — Point the CMS at the relay

The only repo change. In [static/admin/config.yml](../static/admin/config.yml), uncomment
`base_url` and set it to your Worker URL:

```diff
 backend:
   name: github
   repo: purplecrateco/Mac-Harness-Photography
   branch: master
-  # base_url: https://<worker-name>.<subdomain>.workers.dev
+  base_url: https://sveltia-cms-auth.<your-subdomain>.workers.dev
```

No trailing slash, no `/callback` here — that suffix belongs only to the GitHub callback
URL in Step 2. Commit and deploy.

---

## Verify it

1. Open `/admin` on the **deployed** site, not localhost — the OAuth redirect goes to a
   real hostname, and `ALLOWED_DOMAINS` will reject localhost if you set it.
2. Click **Sign In with GitHub**. You should get GitHub's authorization prompt, approve
   once, and land in the CMS.
3. Make a trivial edit and save. Confirm a commit appears on `master`.

Have Mac do the same on his own account once his repo invite is accepted — his approval
is separate from yours.

## If it fails

| Symptom | Likely cause |
| --- | --- |
| Redirects to Netlify, or nothing happens | `base_url` not deployed, or has a typo. Check the built site, not just the repo. |
| GitHub: "redirect_uri does not match" | Step 2 callback URL isn't exactly `<WORKER_URL>/callback`. |
| Signs in, then errors returning to the site | Site's hostname isn't in `ALLOWED_DOMAINS`. |
| "Bad credentials" / 401 from the Worker | `GITHUB_CLIENT_SECRET` wrong, or pasted with whitespace. Regenerate and re-enter. |
| Works for you, not for Mac | He lacks write access to the repo — that's a repo-invite problem, not OAuth. |

**Backing out** is a one-line revert: comment `base_url` again and the GitHub button
returns to its broken state, while local mode and the token button keep working. Nothing
about this is load-bearing for the site itself.

## Not coming: PKCE

Client-side PKCE would remove the need for this relay entirely, and the relay's README
says it'll be deprecated once GitHub ships it. It was slated for Q4 2025 with no ship
date. Sveltia's docs specifically warn that AI assistants claim GitHub already supports
it by confusing it with GitLab — it doesn't. Don't plan around it.
