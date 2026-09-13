# Decisions

This is my honest account of how this project was built. The workflow below is what works for me
today — it may not be the best one for everyone, or for every scale of software, but it is what I
actually did here, not a cleaned-up version of it.

---

## 1. What did AI generate, and what did you write or modify yourself?

The short version: **I made the decisions, the AI wrote the code.** I deliberately did not type
code by hand during implementation, and I explain why below.

I use AI differently in each phase of the SDLC, so I will go phase by phase.

### Planning — HI leads, AI fills gaps

- I did the analysis of the task and of each entity myself (HI — human intelligence). What the
  system is, who uses it, what an artist / track / DSP / distribution really means in a music
  distribution business.
- I used AI for two things here:
  - **collecting domain knowledge where I had unknowns** — ISRC structure and validity rules, how
    DSP delivery normally behaves, what a real distribution pipeline tracks;
  - **asking for a good description and the usual properties of each entity** — not to replace my
    own model, but to complete what I had already derived from brainstorming and to avoid
    reinventing the wheel. This is how I strengthen my business mentality about a domain I am new
    to.
- I defined the features and functionality I thought were needed myself.
- Then I **audited that list with AI**: is there any functionality worth adding? is anything in
  this list conflicting with something else? The same for rules and validations.

In this phase **I am the orchestrator and the AI is my strongest source of the latest
specifications and technology** — it knows more than I do about what the current tooling can do; it
does not know more than I do about what I am trying to build.

Output of this phase: a solid SRS and a first version of the data model.

### System design — a long discussion, then a written architecture

- This phase is about user flows, user needs, edge cases and the solution for each one, plus the
  business rules.
- I did the heavy brainstorming here with my own system design skills: the useful solution for
  every problem, and every edge case I could think of.
- The AI's role was to push on that: are there other solutions? did I miss an edge case? what are
  the common trade-offs of this pattern? This phase was mostly **discussion**, not generation.
- I also fixed the specifications I want the code to respect — clean code, security, validation,
  structure, patterns, naming and conventions — before any code existed.
- Only then did I ask the AI to produce the overall architecture document: folder structure, the
  chosen solution for every case, and everything about the system. Then I audited and edited it
  until it was in good shape. It took three passes (`architecture-v1`, `v2`, final).
- After that, an implementation plan split into phases, produced in plan mode with strict
  instructions: **no migrations and no commits until I approve, and no decision taken silently** —
  if something is ambiguous, stop and ask me, do not choose for me.

Decisions that came out of this phase and are mine, not the AI's:

- going beyond the four required entities — `Genre` as a real table instead of a free-text column,
  `TrackMetadata`, status history for both tracks and distributions, `User` / `RefreshToken`;
- soft delete plus auditing (`CreatedBy` / `UpdatedBy` / `DeletedBy`) on every business entity;
- the allowed track status transitions and who is allowed to make them;
- Arabic-aware genre normalization, so `شعبي` / `شعبى` / `طَرب` do not fragment the catalogue —
  including the call **not** to fold `ة` into `ه`;
- roles (`Distributor` / `Viewer`) and fail-closed authorization;
- refresh token rotation with reuse detection.

The AI implemented all of those. It did not choose any of them.

### Implementation — phase by phase, agent writes, I review

This is my strategy for an app at this scale:

- The agent implements the backend plan **one phase at a time**.
- To be honest: I never write code myself during this stage, and that is on purpose — so the
  agent's context stays the single source of truth and does not drift from the real state of the
  repo. A hand edit the agent does not know about is exactly how an agent starts producing code
  that no longer fits.
- For each phase I accept or reject the changes, review the code, test it, then **run the
  migrations and make the commit myself** — those two were never delegated.
- If something needs changing, I tell the agent and it changes it. Phase done, next phase.
- After the backend was finished, the client side followed the same strategy.

The commit history maps one-to-one to those phases, so what happened in each phase is visible.

### So, concretely

**Written by AI:** effectively all of the C# and TypeScript — MediatR handlers and validators, EF
Core configurations and migrations, the JWT/refresh token implementation, controllers, the Angular
components, stores and interceptor, the seed data, and the first drafts of `README.md`,
`docs/architecture.md` and `docs/api-contract.md` from my outlines.

**Written or decided by me:** the requirements and the SRS, the data model and every extension to
it, the user flows, business rules and edge cases, the non-functional specifications the code had
to meet, the phase plan and the rules the agent worked under, every review and accept/reject, all
migrations and commits, and the corrections in sections 2 and 3 below.

---

## 2. What security issues did you find (or introduce) in the AI-generated code? How did you handle them?

To be honest: **I did not introduce a security issue into this codebase, and that is not luck — it
is because security was part of the specification before a single line of code was generated.** In
the system design phase I wrote down what the code must do about authentication, authorization,
secrets, tokens and error responses, and the agent implemented against that list. An agent that is
told the rules up front does not have to be corrected afterwards.

### The security specification I gave before implementation

- **Authorization is fail-closed.** A fallback policy requires an authenticated user on *every*
  endpoint; public access must be an explicit `[AllowAnonymous]` — which only login, refresh and
  health have. A new controller cannot be forgotten into being public.
- **Role-based access on every write.** `Distributor` creates artists and tracks, distributes and
  changes status; `Viewer` reads. No write endpoint is left on the default policy.
- **No signing key in the repository.** `appsettings.json` ships `Jwt:SigningKey` empty,
  `JwtOptions.Validate()` **fails startup** if the configured key is shorter than 32 bytes, and the
  development key lives in `appsettings.Development.json` clearly labelled
  `dev-only-key-not-for-any-real-deployment`. A real deployment supplies it through user-secrets or
  the `Jwt__SigningKey` environment variable. `.gitignore` covers `secrets.json`, `*.db` and local
  settings overrides.
- **Passwords are never handled by my own code.** ASP.NET Core's `PasswordHasher<T>` (PBKDF2,
  per-password salt, versioned format) behind an `IPasswordHasher` seam — no hand-rolled hashing,
  no plain text anywhere, and the Application layer never learns the algorithm.
- **Refresh tokens: 256 bits of cryptographic randomness, stored only as a SHA-256 hash**, shown
  raw exactly once, rotated on every use, revocation chained through `ReplacedByTokenId` — and
  **presenting an already-rotated token revokes every live session for that user**, because the
  only way to see one is a leak.
- **Short-lived access tokens** (15 minutes) with issuer, audience, lifetime and signature all
  validated, and clock skew cut from the 5-minute default to 30 seconds — 5 minutes of grace on a
  15-minute token is a third of its life.
- **Claims are read under the names they are written with** (`MapInboundClaims = false`). Without
  it the handler silently rewrites `sub` and `role` into long URIs, role checks stop matching, and
  nothing fails loudly — reads keep returning 200 while authorization quietly stops meaning
  anything.
- **Authentication responses must not leak account existence.** Unknown username and wrong password
  raise the same exception and return the same 401; logout does not reveal whether the token was
  valid.
- **One place turns an exception into a response, and unexpected failures tell the caller
  nothing** — no stack trace, no SQL, no type name, no internal namespace. Logged in full, returned
  as a bare 500 with a fixed message.
- **All input is validated before it reaches a handler** — FluentValidation in a MediatR pipeline
  behaviour, with model-binding failures shaped into the same response format, so there is no path
  into the domain that skipped validation.
- **CORS is an explicit origin allow-list**, never `AllowAnyOrigin`; Swagger is Development-only;
  seeding is Development-only; paging is clamped to 100 rows so one request cannot ask for the
  whole table.
- **No raw SQL anywhere** — everything goes through EF Core with parameterised queries, so
  injection has no surface to work with.
- **Nothing is hard-deleted.** Soft delete plus `CreatedBy` / `UpdatedBy` / `DeletedBy` auditing
  and status history, so every state change is attributable to a user.

### What I found during review

One thing, and it came from a framework default rather than from a security decision:

**Internal type names leaking through error responses.** The API used the built-in
`JsonStringEnumConverter`. I found this while testing `PATCH /api/tracks/{id}/status` with a bad
value: the 400 body echoed back the CLR type name of the request object — internal namespaces
handed to any caller who sends garbage — and it still did not tell the client which values were
valid. System.Text.Json also appends `Path: $.status | LineNumber: 0 | BytePositionInLine: 21` to
those messages. Since my specification already said unexpected failures must reveal nothing about
the inside of the system, this was a violation of a rule that was already written, so it was fixed
rather than argued about: `StrictEnumConverter` plus a `ModelStateProblemFactory` that strips the
path/offset suffix, so an invalid enum now returns a consistent 400 naming only the allowed values.
Commit `388090b`.

While fixing it I also closed a second hole in the same place: the first version used
`Enum.TryParse`, which happily accepts `"7"` and `"Live,Blocked"` — flag-style combinations on an
enum that is not a flags enum, and out-of-range numbers that produce a value no switch statement
handles. `Enum.IsDefined` is what actually rejects them, and a raw JSON number is now refused
outright instead of being bound to an undefined ordinal.

The duplicate-artist-email problem in section 3 belongs to the same family — a rule that lived in
one place while the database was free to disagree with it — though it is an integrity issue rather
than a security one.

### Known and accepted, not hidden

- **The refresh token is in `localStorage`.** The access token is held in memory only and is never
  written anywhere, so a successful XSS cannot simply lift a live bearer token out of storage — it
  would have to wait for and win a refresh. But the refresh token has to survive a page reload, and
  the API returns it in a response body rather than an httpOnly cookie, so `localStorage` is the
  only option without putting a BFF in front of the API. That is a real trade-off, and it is
  written down in `client/src/app/core/auth/token-storage.ts` rather than left implied.
- **There is no rate limiting or lockout on `/api/auth/login`.** For a task-scale app I left it
  out, but it is the first thing I would add before this went anywhere real, together with HSTS and
  moving off a SQLite file.

---

## 3. One thing the AI got wrong that you had to fix — what was it, and why was it wrong?

**It let two artists have the same email address.**

The task sheet says `Artist — id, name, email, country` and nothing more, so the generated
`CreateArtist` handler took the three fields, validated that the email was well-formed and the
country code was real, and inserted the row. Posting the same email twice gave two `201`s and two
artists. The AI had done exactly what the specification said, and nothing the specification did not
say.

I told it to make the artist email unique, and it was fixed in two places — which is the actual
point:

1. **In the handler** — a `ConflictException` returning `409` with a message a client can act on,
   on create *and* on update, where the check has to exclude the artist's own id or saving an
   artist without changing their email would collide with itself.
2. **In the database** — a unique index on `Artists.Email`, filtered on `IsDeleted = 0` so a
   soft-deleted artist does not reserve their email address forever.

I also required the email to be trimmed and lower-cased before both the comparison and the insert,
otherwise `Amr@Example.com` and `amr@example.com` are two different rows and the uniqueness rule is
theatre.

**Why it was wrong:** email is the natural identity of an artist in a distribution system.
Duplicates there are not cosmetic — royalties, payout accounts and DSP delivery all key off the
artist record, and once two rows exist for one human being, every downstream number is split
between them and nothing reconciles. Worse, it is silent: nothing fails, the data is simply wrong,
and you find out at payout time.

There is a second lesson in it that I only caught later. When I asked for the fix, the agent added
the unique index to the EF `ArtistConfiguration` but did not generate a migration — the model said
the index existed and the actual database had never heard of it. It stayed that way from phase 8
until I caught the drift at phase 12 and generated `AddArtistEmailUniqueIndex`. This is exactly why
migrations were on my "never delegate, I run them myself" list, and why *reading the diff* is not
the same as *verifying the state*.

The general shape of the mistake: **the AI implements the specification it was given, completely
and literally. It does not ask what the data means.** Constraints that come from understanding the
business — not from the field list — are mine to supply. That is the part of the job the tool does
not do for me, and it is why planning and system design are where I spend my own thinking.
