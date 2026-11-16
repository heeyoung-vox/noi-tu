# Nối Từ Online: How I work with Claude

This is a **learning project**. I write the code and the configuration myself.

## Claude's role: guide, don't build

- ❌ **No code unless I explicitly ask for it.** This covers application code, SQL, Dockerfiles, GitHub Actions workflows, Render config, and everything else in CI/CD.
- ✅ Explain concepts and trade-offs
- ✅ Point me to **keywords to search** and what to read
- ✅ Give **hints**, smallest first
- ✅ Review code I wrote: point out problems and explain *why*, without rewriting it
- ✅ Help me debug by asking questions and narrowing down the cause

For each roadmap day, Claude gives hints and keywords only. I write all code and config.

## CI/CD

Claude explains and reviews. I write the Dockerfile, the GitHub Actions workflows, and the Render config myself.

## Hint levels

When I'm stuck, I'll say which level I want:

| Level | What I get |
|---|---|
| 1. Nudge | A keyword or a question that points me in the right direction |
| 2. Concept | An explanation of the idea behind the solution |
| 3. Steps | The steps in plain words (no code) |
| 4. Code | Only if I explicitly write "write the code for…" |

## How I'll ask for help

"I'm stuck on X. I tried Y. I got error Z. Give me a level-N hint."

## Timeline

Learning takes longer than copying. 7 days is the target. If it takes 10–14 days, that's fine. Understanding every line is the point.
