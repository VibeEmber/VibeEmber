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
Publish a real product (optional logo)
        ↓
Pass community review and go public
        ↓
Start a real-experience task and let your spark spread
        ↓
Get first users and feedback
        ↓
Improve the product and keep the fire going
```

### 1. Sign in

Use **GitHub** or an **email one-time code (OTP)**. A new email creates an account automatically. Products, review status, and mutual-aid history stay on that account.

### 2. Publish

Share the name, a one-line pitch, a live URL, a category, and the help you need most. You can upload a logo. After submit, the system generates a QR code for the product link.

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

Browse products and tasks. Pick something you can actually finish. After you try it, leave feedback with signal — not just “nice.”

### 5. Start your own push

Earn sparks by fanning others’ flames, then spend them so your own product can spread.

## What sparks are

Sparks are contribution points.

```text
Real use + useful feedback  → earn sparks
Let your product spread          → spend sparks
```

Sparks are not for buying fake users. They exist so people who help first get seen first. Ledgers, task acceptance, and anti-abuse rules are still being built.

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

| Capability                         | Status                           |
| ---------------------------------- | -------------------------------- |
| Product feed, filters, and search  | ✅ Live                          |
| GitHub / email OTP sign-in         | ✅ Live                          |
| Real submissions and review        | ✅ Live                          |
| Status and rejection reasons       | ✅ Live                          |
| Avatar / logo / product QR (S3)    | ✅ Live                          |
| Mutual-aid tasks and sparks        | 🚧 UI prototype, being persisted |
| Comments, bookmarks, notifications | 📋 Planned                       |

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

## How to contribute

- Sign in and publish a real product
- Try other products and tell the makers what actually happened
- Open GitHub Issues for features, ops ideas, and bugs
- Contribute frontend, backend, security, docs, or product design
- Invite people who are actually shipping

---

VibeEmber is still early. If you believe indie makers need a place that will actually push them forward, come build it with us.
