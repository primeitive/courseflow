 
/**
 * Seed script for the course platform.
 * Creates: 1 admin, 3 instructors, 5 students, 9 courses with full metadata,
 * 1 sample transaction + enrollment, and 1 sample comment.
 *
 * Run with: `bun run db:seed`
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const db = new PrismaClient();

// Deterministic password hash using sha256 (good enough for sandbox demo).
// In production use bcrypt or argon2.
function hashPassword(p: string) {
  return "sha256$" + createHash("sha256").update(p).digest("hex");
}

function avatar(seed: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=0f766e,155e50,134e4a,047857,065f46&textColor=ffffff`;
}

function thumbnail(seed: number) {
  // Use picsum for stable placeholder thumbnails
  return `https://picsum.photos/seed/course-${seed}/640/360`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin ─────────────────────────────────────────────────────────────
  const admin = await db.profile.upsert({
    where: { email: "admin@courseflow.dev" },
    update: {},
    create: {
      email: "admin@courseflow.dev",
      fullName: "Admin Courseflow",
      role: "admin",
      avatarUrl: avatar("Admin Courseflow"),
      passwordHash: hashPassword("admin123"),
    },
  });

  // ── Instructors ───────────────────────────────────────────────────────
  const instructors = await Promise.all(
    [
      { email: "sarah.chen@courseflow.dev", fullName: "Sarah Chen" },
      { email: "marcus.rivera@courseflow.dev", fullName: "Marcus Rivera" },
      { email: "amelia.putri@courseflow.dev", fullName: "Amelia Putri" },
    ].map(async (i) =>
      db.profile.upsert({
        where: { email: i.email },
        update: {},
        create: {
          ...i,
          role: "instructor",
          avatarUrl: avatar(i.fullName),
          passwordHash: hashPassword("instructor123"),
        },
      })
    )
  );

  // ── Students ──────────────────────────────────────────────────────────
  const students = await Promise.all(
    [
      { email: "alex@student.dev", fullName: "Alex Johnson" },
      { email: "maya@student.dev", fullName: "Maya Sari" },
      { email: "tom@student.dev", fullName: "Tom Walker" },
      { email: "nina@student.dev", fullName: "Nina Kovač" },
      { email: "demo@student.dev", fullName: "Demo Student" },
    ].map(async (s) =>
      db.profile.upsert({
        where: { email: s.email },
        update: {},
        create: {
          ...s,
          role: "student",
          avatarUrl: avatar(s.fullName),
          passwordHash: hashPassword("student123"),
        },
      })
    )
  );

  // ── Courses ───────────────────────────────────────────────────────────
  const courseData = [
    {
      instructor: instructors[0],
      title: "Modern React from First Principles",
      subtitle:
        "Build production-grade interfaces with React 19, hooks, suspense, and server components",
      description:
        "A deep, ground-up exploration of modern React. We start with first principles — what is a component, what is a tree, what is rendering — and build all the way up to advanced patterns: suspense boundaries, server components, optimistic UI, and concurrent features. Every section ships with a hands-on lab and a refactored production code sample.",
      price: 49.0,
      status: "published",
      thumbnail: thumbnail(1),
      learnings: [
        "Reason about the React rendering pipeline from commit to paint",
        "Compose hooks without leaking state or causing stale closures",
        "Implement suspense boundaries for data and streaming SSR",
        "Architect feature-scale apps with server and client components",
        "Diagnose and fix performance regressions with the profiler",
        "Ship a production-grade dashboard with optimistic mutations",
      ],
      prerequisites: [
        "Comfortable with modern JavaScript (ES2020+)",
        "Understand HTML, CSS, and the DOM",
        "Some exposure to a frontend framework is helpful but not required",
      ],
      targetAudiences: [
        "Frontend developers with 1+ year of experience",
        "Engineers migrating from Vue, Svelte, or Angular",
        "Backend developers who want to write credible UIs",
      ],
      videos: [
        { title: "Course intro and how to get the most out of it", durationSeconds: 312 },
        { title: "Lesson 1 — What is a component, really?", durationSeconds: 1247 },
        { title: "Lesson 2 — The render commit cycle", durationSeconds: 1893 },
        { title: "Lesson 3 — Effects, layouts, and why order matters", durationSeconds: 2104 },
        { title: "Lesson 4 — Suspense and streaming", durationSeconds: 1654 },
        { title: "Lesson 5 — Server components in practice", durationSeconds: 2387 },
      ],
    },
    {
      instructor: instructors[0],
      title: "TypeScript at Scale: Patterns That Survive",
      subtitle:
        "Type design, variance, generics, and architectural patterns for 100k+ LOC codebases",
      description:
        "Most TypeScript tutorials stop at 'add types to your function'. This course is what comes after. We cover variance, conditional types, template literal types, brand types, and the architectural decisions that keep a 100k-line codebase refactorable three years in.",
      price: 59.0,
      status: "published",
      thumbnail: thumbnail(2),
      learnings: [
        "Model domain types with branded primitives and smart constructors",
        "Use variance and conditional types to encode business rules",
        "Design plugin systems that survive a major version bump",
        "Refactor typesafe code without breaking runtime",
        "Avoid the type-test pyramid of doom",
      ],
      prerequisites: [
        "Comfortable with TypeScript basics (interfaces, generics)",
        "At least 6 months of full-time TS in production",
      ],
      targetAudiences: [
        "Senior engineers and tech leads",
        "Library and platform maintainers",
      ],
      videos: [
        { title: "Why most TS codebases rot", durationSeconds: 824 },
        { title: "Branded types and smart constructors", durationSeconds: 1456 },
        { title: "Variance, finally explained", durationSeconds: 1872 },
        { title: "Conditional types that read like prose", durationSeconds: 2103 },
        { title: "Designing a plugin system", durationSeconds: 2456 },
      ],
    },
    {
      instructor: instructors[0],
      title: "CSS Layouts: From Float to Container Queries",
      subtitle:
        "A no-fluff tour of every layout system CSS has ever had, and when to reach for each",
      description:
        "CSS layout is a 25-year-old archaeology dig. This course walks through each layer — float, position, table, flexbox, grid, subgrid, container queries — and tells you honestly when each one is still the right tool. No 'flexbox for everything' propaganda.",
      price: 39.0,
      status: "published",
      thumbnail: thumbnail(3),
      learnings: [
        "Pick the right layout system for a given UI",
        "Use container queries without polyfills in 2025",
        "Build accessible, responsive navigation from scratch",
        "Debug layout with the DevTools layers panel",
      ],
      prerequisites: ["HTML and CSS fundamentals", "Familiarity with the box model"],
      targetAudiences: [
        "Frontend developers of any level",
        "Designers who want to write their own prototypes",
      ],
      videos: [
        { title: "The layout landscape", durationSeconds: 602 },
        { title: "Floats are still useful", durationSeconds: 871 },
        { title: "Position: the underrated tool", durationSeconds: 1042 },
        { title: "Flexbox, properly", durationSeconds: 1567 },
        { title: "Grid for the hard problems", durationSeconds: 1892 },
        { title: "Container queries in production", durationSeconds: 1342 },
      ],
    },
    {
      instructor: instructors[1],
      title: "PostgreSQL Internals for App Developers",
      subtitle:
        "What actually happens when you run a query, and how to make it 100× faster",
      description:
        "You don't need to be a DBA to write fast Postgres queries — but you do need to know what the planner is doing under the hood. This course covers B-trees, hash indexes, the MVCC model, EXPLAIN ANALYZE, and the most common performance footguns in app code.",
      price: 69.0,
      status: "published",
      thumbnail: thumbnail(4),
      learnings: [
        "Read EXPLAIN ANALYZE output like a profiler",
        "Choose between B-tree, GIN, GiST, and BRIN indexes",
        "Diagnose and fix N+1 queries at the ORM layer",
        "Use partial and expression indexes effectively",
        "Reason about MVCC, vacuum, and bloat",
      ],
      prerequisites: [
        "Comfortable with SQL basics (SELECT, JOIN, GROUP BY)",
        "Some experience with any ORM",
      ],
      targetAudiences: [
        "Full-stack and backend developers",
        "Engineers scaling a Postgres-backed app",
      ],
      videos: [
        { title: "The query lifecycle", durationSeconds: 1102 },
        { title: "B-trees and why they matter", durationSeconds: 1456 },
        { title: "Hash, GIN, GiST, BRIN", durationSeconds: 1789 },
        { title: "EXPLAIN ANALYZE, line by line", durationSeconds: 2034 },
        { title: "MVCC, vacuum, and bloat", durationSeconds: 2245 },
        { title: "Killing the N+1", durationSeconds: 1567 },
      ],
    },
    {
      instructor: instructors[1],
      title: "Designing REST APIs That Don't Suck",
      subtitle:
        "Resources, status codes, idempotency, pagination, and the boring parts that matter",
      description:
        "A practical, opinionated guide to REST API design. We cover resource modeling, status codes, error envelopes, pagination, idempotency keys, versioning, and the dozen small decisions that separate an API people love from one they tolerate.",
      price: 45.0,
      status: "published",
      thumbnail: thumbnail(5),
      learnings: [
        "Model resources and sub-resources clearly",
        "Pick the right status code (and stop using 200 for everything)",
        "Implement idempotency keys for safe retries",
        "Paginate with cursors, not offsets",
        "Version APIs without breaking clients",
      ],
      prerequisites: [
        "Some experience building or consuming HTTP APIs",
        "Familiarity with JSON",
      ],
      targetAudiences: [
        "Backend engineers",
        "Full-stack developers who ship APIs",
      ],
      videos: [
        { title: "REST, honestly", durationSeconds: 892 },
        { title: "Resource modeling", durationSeconds: 1456 },
        { title: "Status codes that mean something", durationSeconds: 1234 },
        { title: "Idempotency, the right way", durationSeconds: 1567 },
        { title: "Cursor pagination", durationSeconds: 1342 },
        { title: "Versioning without tears", durationSeconds: 1124 },
      ],
    },
    {
      instructor: instructors[1],
      title: "Docker, Compose, and the Local Dev Environment",
      subtitle:
        "Stop debugging 'works on my machine' — reproducible dev environments with Docker",
      description:
        "A pragmatic course on using Docker for local development. Not a Kubernetes course. We focus on the day-to-day: Dockerfiles that don't suck, Compose for multi-service apps, volume strategies, hot reload, and keeping your laptop fan off.",
      price: 35.0,
      status: "published",
      thumbnail: thumbnail(6),
      learnings: [
        "Write Dockerfiles that build fast and cache well",
        "Compose multi-service apps with healthchecks",
        "Use volumes for hot reload without rebuilds",
        "Keep images small and secure",
      ],
      prerequisites: [
        "Comfortable on the command line",
        "Some exposure to Docker is helpful",
      ],
      targetAudiences: [
        "Any developer shipping to production",
        "Engineers setting up team dev environments",
      ],
      videos: [
        { title: "Why Docker for dev?", durationSeconds: 612 },
        { title: "Anatomy of a good Dockerfile", durationSeconds: 1789 },
        { title: "Compose, the right way", durationSeconds: 2034 },
        { title: "Volumes and hot reload", durationSeconds: 1456 },
        { title: "Slimming your images", durationSeconds: 1234 },
      ],
    },
    {
      instructor: instructors[2],
      title: "UI Motion Design with Framer Motion",
      subtitle:
        "Subtle, performant, accessible animations that improve UX instead of distracting",
      description:
        "Motion is a design tool, not decoration. This course covers when to animate, how to keep animations 60fps, how to respect prefers-reduced-motion, and the patterns that make interfaces feel alive without being annoying.",
      price: 42.0,
      status: "published",
      thumbnail: thumbnail(7),
      learnings: [
        "Decide when (and when not) to animate",
        "Use spring physics without making users dizzy",
        "Respect prefers-reduced-motion properly",
        "Build layout animations that don't jank",
        "Ship page transitions that feel native",
      ],
      prerequisites: ["Comfortable with React", "Some CSS animation experience"],
      targetAudiences: ["Frontend developers", "Designers who code"],
      videos: [
        { title: "Motion principles", durationSeconds: 824 },
        { title: "Spring physics in practice", durationSeconds: 1567 },
        { title: "Accessibility and reduced motion", durationSeconds: 1124 },
        { title: "Layout animations", durationSeconds: 1789 },
        { title: "Page transitions", durationSeconds: 1342 },
      ],
    },
    {
      instructor: instructors[2],
      title: "Design Systems from Zero",
      subtitle:
        "Tokens, components, documentation, and governance for a design system people actually use",
      description:
        "Most design systems die in the gap between Figma and code. This course is about bridging that gap: tokens, naming conventions, component APIs, theming, deprecations, and the organizational work of keeping a system alive.",
      price: 55.0,
      status: "published",
      thumbnail: thumbnail(8),
      learnings: [
        "Design a token taxonomy that scales",
        "Write component APIs that don't change every sprint",
        "Theme a system for multiple brands",
        "Deprecate components without breaking consumers",
        "Measure adoption and act on it",
      ],
      prerequisites: [
        "Some experience with a component library",
        "Familiarity with Figma or similar",
      ],
      targetAudiences: [
        "Design system maintainers",
        "Senior frontend engineers",
        "Designers who care about implementation",
      ],
      videos: [
        { title: "Why most design systems fail", durationSeconds: 967 },
        { title: "Token taxonomy", durationSeconds: 1456 },
        { title: "Component API design", durationSeconds: 1892 },
        { title: "Theming for multiple brands", durationSeconds: 1567 },
        { title: "Deprecation as a feature", durationSeconds: 1234 },
        { title: "Measuring adoption", durationSeconds: 1124 },
      ],
    },
    {
      instructor: instructors[2],
      title: "Accessibility for Real Product Teams",
      subtitle:
        "WCAG, ARIA, keyboard patterns, and the org work of shipping accessible software",
      description:
        "Accessibility is not a checklist at the end of the sprint. This course covers the WCAG success criteria that actually matter, ARIA patterns that don't backfire, keyboard navigation, focus management, and the organizational rituals that keep a product accessible over time.",
      price: 49.0,
      status: "published",
      thumbnail: thumbnail(9),
      learnings: [
        "Audit a page against WCAG 2.2 AA",
        "Use ARIA only when HTML isn't enough",
        "Manage focus in SPAs without breaking screen readers",
        "Set up automated a11y tests in CI",
        "Build a11y rituals your team will actually follow",
      ],
      prerequisites: ["Solid HTML knowledge", "Some frontend experience"],
      targetAudiences: ["Frontend developers", "QA engineers", "Product designers"],
      videos: [
        { title: "The state of a11y in 2025", durationSeconds: 824 },
        { title: "WCAG 2.2 AA, decoded", durationSeconds: 1789 },
        { title: "ARIA, the right way", durationSeconds: 2034 },
        { title: "Focus management in SPAs", durationSeconds: 1567 },
        { title: "Automated a11y in CI", durationSeconds: 1342 },
        { title: "Org rituals that stick", durationSeconds: 1124 },
      ],
    },
  ];

  // Clean previous courses (cascade will handle children)
  await db.course.deleteMany({});
  await db.transaction.deleteMany({});

  for (const [idx, c] of courseData.entries()) {
    const course = await db.course.create({
      data: {
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        price: c.price,
        status: c.status,
        thumbnailUrl: c.thumbnail,
        instructorId: c.instructor.id,
        learnings: {
          create: c.learnings.map((content, i) => ({ content, sortOrder: i })),
        },
        prerequisites: {
          create: c.prerequisites.map((content, i) => ({ content, sortOrder: i })),
        },
        targetAudiences: {
          create: c.targetAudiences.map((content, i) => ({ content, sortOrder: i })),
        },
        videos: {
          create: c.videos.map((v, i) => ({
            title: v.title,
            videoUrl: `https://cdn.courseflow.dev/sample-${idx}-${i}.mp4`,
            durationSeconds: v.durationSeconds,
            sortOrder: i,
          })),
        },
      },
    });
    console.log(`  ✓ Created course: ${course.title}`);
  }

  // ── Sample enrollment + transaction (demo student buys course 1) ──────
  const demoStudent = students[4];
  const firstCourse = await db.course.findFirst({
    where: { title: courseData[0].title },
  });
  if (firstCourse) {
    const txn = await db.transaction.create({
      data: {
        userId: demoStudent.id,
        totalAmount: firstCourse.price,
        xenditInvoiceId: "demo-inv-" + randomBytes(6).toString("hex"),
        xenditPaymentMethod: "EWALLET",
        xenditStatus: "PAID",
        paidAt: new Date(),
        items: {
          create: {
            courseId: firstCourse.id,
            instructorId: firstCourse.instructorId,
            priceAtPurchase: firstCourse.price,
          },
        },
      },
    });
    await db.enrollment.create({
      data: {
        userId: demoStudent.id,
        courseId: firstCourse.id,
      },
    });
    await db.comment.create({
      data: {
        userId: demoStudent.id,
        courseId: firstCourse.id,
        content:
          "Honestly the clearest explanation of the render commit cycle I've ever seen. Worth every cent.",
      },
    });
    console.log(
      `  ✓ Created sample transaction ${txn.id} and enrollment for ${demoStudent.fullName}`
    );
  }

  // ── Add a couple of items to demo student's cart ───────────────────────
  if (firstCourse) {
    const otherCourse = await db.course.findFirst({
      where: { title: courseData[3].title },
    });
    if (otherCourse) {
      await db.cartItem.create({
        data: {
          userId: demoStudent.id,
          courseId: otherCourse.id,
        },
      });
      console.log(`  ✓ Added course to demo cart: ${otherCourse.title}`);
    }
  }

  console.log("\n✅ Seed complete.");
  console.log("  Admin:        admin@courseflow.dev / admin123");
  console.log("  Instructor:   sarah.chen@courseflow.dev / instructor123");
  console.log("  Student:      demo@student.dev / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
