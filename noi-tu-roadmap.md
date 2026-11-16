# Nối Từ Online: Roadmap & Milestones

A mobile-first web word-chain game (Vietnamese two-syllable words).
Play solo against a bot, with friends through a room link, or with strangers through quick match.

**Goals:**
1. **Learn** by building every part myself: backend, frontend, CI/CD, deployment.
2. Ship a live game with real users.
3. Come out with a backend story I can explain confidently in interviews.

**Working rules** (how Claude helps, hint levels, CI/CD rules): see [rules.md](rules.md).

---

## 1. Tech stack

### Backend (the showcase)

| Part | Choice | Why |
|---|---|---|
| Language / framework | Java 25 + Spring Boot 4.1 | Current Spring Boot line; Java 25 is the latest long-term-support Java |
| Real-time | Spring WebSocket + STOMP | One channel per room, messages to specific players, heartbeats detect dropped phones |
| REST API | Spring Web | Nickname, create room, leaderboard, match history |
| Database | PostgreSQL (Neon) + Spring Data JPA + Flyway | Free and permanent; versioned table changes |
| Dictionary | Loaded into memory at startup | ~74K words is only a few MB; lookups take microseconds |
| Testing | JUnit 5 (Testcontainers later) | Most tests go on the game rules, which have no web or database parts |
| Ops | Actuator health check, Docker, GitHub Actions CI | Minimum for "can ship to production" |

### Frontend (keep it simple: about 4 screens, no state-management library)

| Part | Choice | Why |
|---|---|---|
| Framework | React + TypeScript + Vite | Very common in Vietnamese job posts; small, fast-loading bundles |
| Styling | Tailwind CSS | Fastest way to build a mobile layout |
| Real-time client | @stomp/stompjs | Matches the backend; reconnects automatically |
| Installable app | vite-plugin-pwa | Home-screen icon and full-screen mode |

### Hosting ($0)

- **Frontend:** Render static site or Cloudflare Pages (free, never sleeps)
- **Backend:** Render free web service, **Singapore** region
- **Database:** Neon free plan, region closest to Vietnam

### Dictionary source

- `Viet74K.txt` from duyet/vietnamese-wordlist (~74,000 words and phrases, GPL)
- Keep the license file and credit the author; check what GPL means before publishing your code with it

---

## 2. Key decisions (interviewers will ask about these)

- [ ] **The server owns the timer.** It sends each turn's deadline; phones only display the countdown. Allow ~300 ms of grace for network lag.
- [ ] **Normalize every word.** One Unicode form and one tone-mark style ("xóa" = "xoá") before any comparison.
- [ ] **Mobile keyboards:**
  - Check the word only when the player submits, not on every keystroke (Vietnamese keyboards build letters in steps)
  - Turn off autocorrect and auto-capitalization on the input box
  - Keep the input box visible above the on-screen keyboard (iPhones are the tricky ones)
- [ ] **Cold starts:** the free server sleeps after 15 min idle and takes ~1 min to wake. Show a friendly "Đang khởi động máy chủ…" screen, not a blank page.
- [ ] **No free chat.** Only dictionary words can be entered (vulgar words filtered out), so there's almost nothing to moderate.
- [ ] **Scaling story (explain it, don't build it):** one server keeps rooms in memory; to run several servers, share room state through Redis or a message broker.

---

## 3. Game rules (v1)

- A player enters a two-syllable word (e.g. *học sinh*)
- The next player must start with its last syllable (*sinh viên* → *viên chức* → …)
- ~15 seconds per turn; no word can be used twice in a match
- Run out of time or words and you're out; last player standing wins

### Modes

- **Solo:** vs bot (easy = common words, hard = words that lead to dead ends)
- **Daily challenge:** longest chain from today's starting word, with a leaderboard
- **Quick match:** 1v1 with a stranger; a bot fills in after 10 seconds
- **Friends:** room link or code, 2–6 players

---

## 4. Roadmap

Each day lists **tasks**, **keywords to look up**, and **hints**.

**Build order: outside-in.** Each feature starts at the web layer and works down:
1. **Web:** the screen or request that triggers the feature
2. **Controller:** the endpoint or message handler, returning a hard-coded answer at first
3. **Service:** replace the hard-coded answer with a service call (the service can start as a stub)
4. **Business logic:** fill in the real rules behind the service, with unit tests

Every step ends with something you can run and click. The game rules still end up in plain Java with no Spring code; they're just written last, when you know exactly what the service needs from them.

### Day 0: setup & deploy a skeleton

**Tasks**
- [ ] One repository with `noi-tu-backend/` and `noi-tu-frontend/` folders
- [ ] Generate the Spring Boot project and the React project
- [ ] Docker:
  - [ ] Write a Dockerfile for the backend; build and run it locally, then open the health endpoint
  - [ ] Run PostgreSQL locally with Docker Compose so you develop against the same database type as production
- [ ] Deploy a "hello" backend (Render, Singapore, from your Dockerfile) + database (Neon) + frontend (static host) **today**
- [ ] CI: build and test on every push (see section 5)
- [ ] Prepare the dictionary:
  - [ ] Keep only two-syllable words
  - [ ] Normalize Unicode and tone-mark style
  - [ ] Remove vulgar words
  - [ ] Build an index from each syllable to the words starting with it
  - [ ] List dead-end syllables (ones no word can follow)

**Keywords**
- Spring Initializr, Spring Boot Actuator health endpoint, Spring profiles (`application-prod`)
- Vite React TypeScript template
- Dockerfile basics (`FROM`, `COPY`, `ENTRYPOINT`), `docker build` / `docker run -p`, `.dockerignore`
- Docker Compose, the official `postgres` image, volumes
- Render Docker web service, Render health check path, Render environment variables
- Neon connection string, JDBC `sslmode=require`
- Spring CORS configuration
- `java.text.Normalizer`, Unicode NFC vs NFD
- Vietnamese tone placement: "dấu kiểu cũ" vs "dấu kiểu mới"
- Loading a classpath resource at startup in Spring (`ApplicationRunner`)

**Hints**
- Deploy while the app is tiny. Deployment problems are much easier to debug before there's a game on top.
- If the container works on your machine, most Render problems are about configuration (port, environment variables), not your code. Look up which port Render expects your app to listen on.
- A simple single-stage Dockerfile is fine today. You'll make it smaller and faster in section 5.
- Never commit passwords or connection strings. Look up how to pass them as environment variables.
- Before coding the dictionary step, open the word list and look at the data. Check how many entries have exactly two syllables and what odd entries exist.

✅ **Done when:** the live frontend shows the backend's health status

### Day 1: first feature through every layer (REST)

**Tasks**
- [ ] **Web:** Home screen with a nickname box and a "check a word" box
- [ ] **Controller:** an endpoint that creates a guest (nickname → token) and one that checks a word; hard-coded responses first
- [ ] **Service:** a guest service and a dictionary service behind the controllers
- [ ] **Business logic:** wire in the Day 0 dictionary: normalize the input, look it up, list the words that can follow it
- [ ] Tests: a controller test with the service mocked, plain unit tests for the services

**Keywords**
- Layered architecture (controller / service / domain), constructor injection
- `@RestController`, request/response DTOs as Java `record`s
- Bean Validation (`@Valid`, `@NotBlank`), `@RestControllerAdvice`, `ProblemDetail`
- Opaque token vs JWT; storing a hashed token
- `@WebMvcTest`, `MockMvc`, `@MockitoBean`
- `fetch` from React, Vite dev proxy
- HTML input attributes: `autocapitalize`, `autocorrect`, `spellcheck`, `enterkeyhint`

**Hints**
- Get the hard-coded response showing on the live site before writing any service. Then swap in one layer at a time.
- The controller only translates HTTP into a service call and back. If it contains an `if` about words, that logic belongs lower down.
- Decide what the API returns for an unknown word: an error status, or a normal response that says "not found"?

✅ **Done when:** on the live site, you enter a nickname and a word, and the page tells you whether the word is valid

### Day 2: solo mode, top down

**Tasks**
- [ ] **Web:** Game screen and a WebSocket/STOMP connection; start with the server echoing your move back
- [ ] **Controller:** STOMP message handlers for "start game" and "play word", with the token checked on CONNECT
- [ ] **Service:** a game service that holds active games and runs the server-side turn timer; it starts by accepting any word
- [ ] **Business logic:** a game engine in plain Java, adding one rule at a time, each with a test:
  - [ ] Chain rule (next word starts with the last syllable)
  - [ ] No-repeat check, unknown-word check
  - [ ] Turn order, timeouts, eliminations, last player standing
  - [ ] Easy bot (common words) and hard bot (trap words)

**Keywords**
- Spring STOMP: `@MessageMapping`, `SimpMessagingTemplate`, user destinations
- `ChannelInterceptor` (checking the token on CONNECT)
- `TaskScheduler` / `ScheduledExecutorService`, STOMP heartbeats
- `@stomp/stompjs`, React `useEffect` cleanup
- Tailwind mobile-first, `dvh` units, `visualViewport` API
- Domain model, state machine, "keep the domain free of framework code"
- JUnit 5 `@ParameterizedTest`, AssertJ
- Injecting `java.time.Clock` to make time testable
- Seeded `Random` for repeatable bot behaviour
- Graph out-degree (for finding dead-end syllables)

**Hints**
- Decide your message format (types and fields) on paper before coding either side.
- Think about who is allowed to end a turn: the client, or the server's timer?
- Write the engine's test cases on paper before adding the rules: valid move, wrong first syllable, repeated word, unknown word, timeout, last player left.
- If the game engine needs Spring to run, it's coupled too tightly. It should work in a plain unit test.

✅ **Done when:** you can play against the bot on your phone, on the live site, and a full bot-vs-bot game runs inside a unit test

### Day 3: rooms with friends

**Tasks**
- [ ] Create a room, share link/code, lobby
- [ ] 2–6 players, eliminations, results screen

**Keywords**
- Short room codes without confusing characters (0/O, 1/l)
- `ConcurrentHashMap`, thread safety, "one thread per room" / actor model
- React Router dynamic routes, Web Share API

**Hints**
- Two players can send moves at the same moment. Look up how to make sure a room processes one move at a time.

✅ **Done when:** you and a friend finish a game on two phones

### Day 4: quick match & real-world problems

**Tasks**
- [ ] Matchmaking queue with bot backfill after 10 seconds
- [ ] Reconnect within ~20 seconds
- [ ] Handle players leaving mid-game and the host leaving

**Keywords**
- Matchmaking queue, `BlockingQueue`
- Spring `SessionDisconnectEvent`, session resume
- Message sequence numbers, idempotency
- Page Visibility API (phones pausing background tabs)

**Hints**
- A disconnect isn't the same as leaving. Decide how long you wait before treating it as leaving.
- Test on a real phone: switch apps for 15 seconds, then come back.

✅ **Done when:** wifi off for 10 seconds, back on, and the match continues

### Day 5: saving data & reasons to come back

**Tasks**
- [ ] Match history
- [ ] Rating for quick matches
- [ ] Daily challenge + leaderboard
- [ ] "Report missing word" button
- [ ] Analytics events (game started, game finished, share clicked)
- [ ] Home-screen install (PWA manifest + icon)

**Keywords**
- Flyway migration naming (`V1__...`)
- JPA relationships, N+1 query problem, database indexes, `Pageable`
- Elo rating, K-factor
- Daily seed by date, time zone `Asia/Ho_Chi_Minh`
- Web app manifest, service worker, `vite-plugin-pwa`, Lighthouse PWA audit

**Hints**
- "Today" depends on the time zone. Decide which day it is for a player in Vietnam at 00:30.
- Look at the database queries your leaderboard runs (look up how to log SQL in Spring).

✅ **Done when:** the leaderboard shows real entries

### Day 6: polish & launch

**Tasks**
- [ ] Test on a cheap Android phone and an iPhone
- [ ] Cold-start loading screen
- [ ] Shareable result card ("Chuỗi 23 từ! 🔥")
- [ ] Post to university groups, friends, Vietnamese word-game communities

**Keywords**
- Chrome DevTools device mode, remote debugging Android Chrome, Safari Web Inspector for iOS
- Lighthouse performance audit
- Open Graph meta tags (link previews on Facebook/Zalo)

**Hints**
- Test on slow 4G (DevTools network throttling) as well as wifi.
- Ask 2–3 friends to play while you watch them, without explaining anything. You'll learn where the UI is confusing.

### Day 7: fix, write up, update CV

**Tasks**
- [ ] Fix what players report
- [ ] README: architecture diagram, key decisions, user numbers, screenshots
- [ ] 30-second demo GIF
- [ ] Add the live link to your CV

**Keywords**
- README best practices, Mermaid diagrams, Excalidraw
- STAR method (for telling project stories in interviews)

### If you fall behind, cut in this order
1. Rating
2. Daily challenge
3. Quick match

**Never cut:** solo vs bot, room links, deployment.

---

## 5. CI/CD

**What to build**
- [ ] **CI:** on every push, build the backend and run its tests; build the frontend
- [ ] **Container (improve the Day 0 Dockerfile):** multi-stage build, layered jar, non-root user; note the image size before and after
- [ ] **CD:** deploy to Render automatically when `main` passes CI
- [ ] **Secrets:** database URL and other secrets stored in Render/GitHub, never in the repository

**Keywords**
- GitHub Actions: workflow, job, step, `on: push` / `pull_request`, `actions/setup-java`, dependency caching
- GitHub Actions secrets
- Docker multi-stage build, Spring Boot layered jars, `.dockerignore`
- JVM memory flags for small containers (`-Xmx`, `MaxRAMPercentage`)
- Render auto-deploy vs deploy hook, Render health checks
- Branch protection: "require status checks to pass"

**Hints**
- Start CI with only "build + test". Once that's green, add a step that builds the Docker image, then switch Render to deploy only when CI passes.
- The free server has 512 MB RAM. Find out how much memory your app actually uses before setting JVM flags.
- Break the build on purpose once (a failing test) to see CI catch it.

---

## 6. Weeks 2–4 (while job hunting)

- [ ] **Numbers for your CV:** load test (e.g. "500 simultaneous players, under 50 ms per move"). Keywords: *k6 WebSocket load testing*
- [ ] **Integration tests** with Testcontainers. Keywords: *Testcontainers PostgreSQL, @SpringBootTest*
- [ ] **Moderation:** review queue for reported words
- [ ] **Retention:** notifications for friend challenges and the daily word. Keywords: *Web Push API, VAPID*. Ranked seasons.
- [ ] **Next project:** cozy farm game, reusing guest accounts, friends and notifications

---

## 7. Interview talking points checklist

- [ ] Why the server owns the timer and validates every word
- [ ] How Vietnamese text normalization works and why it's needed
- [ ] How the hard bot finds trap words (syllable index + dead ends)
- [ ] How reconnects and dropped mobile connections are handled
- [ ] Why the dictionary lives in memory instead of the database
- [ ] How the CI/CD pipeline works, from push to deploy
- [ ] How the Docker image is built (multi-stage, image size before/after) and how the JVM fits in 512 MB RAM
- [ ] How you'd scale beyond one server
- [ ] Real numbers: players, matches played, next-day return rate, load-test results
