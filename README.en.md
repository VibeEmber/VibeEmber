# VibeEmber · 星火场

**[中文](README.md)** · **[English](README.en.md)**

### Gather faint lights into embers; turn embers into a prairie fire.

> **In an era of burning tokens, we gather embers to light the way.**
>
> 在烧 Token 的时代，聚微光取暖，以星火燎原。

A product-launch and cold-start community for vibe coders, indie hackers, and small teams.

**A good product should not start with zero users.**

Publish what you just shipped. Get your first real testers, usable feedback, and a first spark of attention. VibeEmber will not run your product or growth for you — but it can keep a real build from dying at “nobody knows it exists.”

Add your kindling here first. Then let the spark become a prairie fire.

## Live community

👉 **[https://wenxinxu.com/VibeEmber/](https://wenxinxu.com/VibeEmber/)**

The project is in early preview. Ship real products, try other people’s work, and help shape the rules.

## The problem

Vibe coding lowered the cost of _making_ a product. It did not lower the cost of putting it in front of real people.

Makers keep hitting the same wall:

- The product is live, and nobody knows
- There are no first users, so there is no signal
- It works for the author and breaks for everyone else
- A handful of real testers would change everything
- Tokens were burned to build it; nobody has validated whether it can go further
- Someone may already have built the same thing
- There is no team, and no steady circle of builders

VibeEmber gathers scattered indie makers in one place. Everyone can show their work — and be someone else’s first user. Faint lights become embers; embers can still start a fire.

## Who it is for

- Developers shipping with AI and vibe coding
- Individuals running mini programs, web apps, mobile apps, or browser extensions
- Early teams that need honest product feedback
- People looking for ideas, collaborators, or a niche
- Anyone willing to try others’ products carefully before asking for help

You do not have to write code. Careful testing and useful feedback already make you valuable here.

## How it works

```text
Sign in with GitHub or email OTP
        ↓
Publish a real, tryable product (screenshot required)
        ↓
Pass community review and go public
        ↓
Help others finish trial tasks and earn sparks
        ↓
Spend sparks to start a push: pick a feedback type, write a checklist, freeze the bounty
        ↓
Improve from valid feedback and keep the fire going
```

### 1. Sign in

Use **GitHub** or an **email one-time code (OTP)**. A new email creates an account automatically. Products, review status, and mutual-aid history stay on that account.

### 2. Publish

Share the name, a one-line pitch, a live entry point, the product kind, and the help you need most (at least 20 characters). Upload at least one product screenshot; a logo is optional. After submit, the system generates a QR code for the product link.

You do not need a business plan. Answer three things:

1. What is this?
2. Who does it help, and how?
3. What kind of real help do you need right now?

### 3. Review

New projects enter a review queue. Moderators check that the link works, the description is honest, and the post follows community rules.

- **Pending**: submitted, not public yet
- **Live**: approved and shown on the home feed
- **Rejected**: needs changes; the author can read the reason

### 4. Help someone else

Browse the help hall. Read the feedback type and the brief before you claim. After you try the product, answer the three questions and upload a usage screenshot. Copying the pitch or pasting the same text again will not pass the check.

### 5. Start your own push

Having sparks is not enough. The product must be live, tryable, and have screenshots. The task must name a feedback type (first run / bug hunt / onboarding / copy review / bring a user) and a clear checklist. Creating a task freezes `reward × quota` sparks.

## What sparks are

Sparks are contribution points. The price list is public and fixed. There is no subjective quality score.

```text
Sign-up grant: +20 sparks
Finish a real trial report (three answers + screenshot, accepted) → task bounty
Bring a user (that task type + evidence)                         → that task bounty
Let your product spread                                          → spend the frozen sparks
```

Votes, bookmarks, short comments, opening a link, repeating the pitch, or farming alts do not earn sparks. Owners review against the checklist. If they do not review in 48 hours, the claim auto-accepts. Admins spot-check accepted samples and can claw sparks back. The full ledger is in the account panel.

## Community rules

### We encourage

- Shipping products you actually helped make
- Being clear about current limits and needs
- Feedback that is specific and actionable
- Respect for rough, early work
- Honesty about product, data, partnerships, and money

### We reject

- Malware, scams, phishing, and illegal content
- Click / signup farms with no real use
- Fake ads, fake reviews, fake rankings
- Pressuring people into praise
- Copying someone else’s product, assets, or listing
- Leaking private or test data you saw while trying a product

## Status

| Capability                                 | Status  |
| ------------------------------------------ | ------- |
| Product feed, filters, and search          | ✅ Live |
| GitHub / email OTP sign-in                 | ✅ Live |
| Real submissions and review                | ✅ Live |
| Status and rejection reasons               | ✅ Live |
| Avatar / logo / product QR (S3)            | ✅ Live |
| Mutual-aid tasks, ledger, checklist review | ✅ Live |
| Help-request quality gates and spot-checks | ✅ Live |
| Weekly real mutual-aid results             | ✅ Live |
| Comments, bookmarks, notifications         | ✅ Live |

## Local quick start

Requires Node 24 LTS, pnpm 9, and Docker. See [`.nvmrc`](.nvmrc) for the pinned Node version.

```bash
pnpm install
docker compose up -d          # PostgreSQL :5432 / MinIO :9000 / Mailpit :8025
pnpm db:migrate               # apply Prisma migrations
pnpm db:seed                  # curated launch set
pnpm dev                      # web :3000 / api :4000 / worker
```

Dev OTP emails show up in [Mailpit](http://localhost:8025). GitHub sign-in needs `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `.env`, with callback `http://localhost:4000/api/auth/callback/github`.

Architecture, ports, env vars, and production deploy: **[Development guide](docs/DEVELOPMENT.md)** (currently in Chinese).

## Development guidelines (VibeCoding)

This project follows a **VibeCoding** development model:

- **Everything is vibe-coded; no hand-written coding.** All features, bug fixes, and refactors are done with AI pair programming. Writing code line by line manually is not part of the workflow.

## How to contribute

- Sign in and publish a real product
- Try other products and tell the makers what actually happened
- Scan the community QR on the site, or write to hello@vibember.dev
- Open [GitHub](https://github.com/VibeEmber/VibeEmber) Issues for features, ops ideas, and bugs
- Contribute frontend, backend, security, docs, or product design
- Invite people who are actually shipping

---

VibeEmber is still early. If you believe indie makers need a place that will actually push them forward, come build it with us.
