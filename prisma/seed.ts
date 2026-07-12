import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.passwordReset.deleteMany();
  await prisma.message.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ─────────────────────────────────────────────────────
  const student1 = await prisma.user.create({
    data: {
      id: "u_student_1",
      name: "نیما رستگار",
      email: "student@baseerno.ir",
      passwordHash: "$2b$12$dfTRc448mCD/gx/Cg7vVs.xCPwjY7KiAHPKm/MJkSWILe8PnviaMO",
      role: "STUDENT",
      phone: "09120000001",
      bio: "دانشجوی فن بیان، علاقه‌مند به سخنرانی حرفه‌ای.",
      createdAt: daysAgo(120),
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      id: "u_teacher_1",
      name: "دکتر سارا محمدی",
      email: "teacher@baseerno.ir",
      passwordHash: "$2b$12$zGlwX4M67JYaDXr8IvQyH.4wpcS491t6K9k4qJ7vQh0p.4ikJuO62",
      role: "TEACHER",
      phone: "09120000002",
      bio: "دکترای علوم ارتباطات، مدرس فن بیان با ۱۲ سال تجربه.",
      createdAt: daysAgo(300),
    },
  });

  const admin1 = await prisma.user.create({
    data: {
      id: "u_admin_1",
      name: "مدیر سیستم",
      email: "admin@baseerno.ir",
      passwordHash: "$2b$12$RQ3ygmzWpuOnNVVcjJoczu10T.ye2mChUBDXavzBdqOZrw1Ti.SMW",
      role: "ADMIN",
      phone: "09120000003",
      bio: "مدیریت پلتفرم بصیر نو.",
      createdAt: daysAgo(400),
    },
  });

  const student2 = await prisma.user.create({
    data: {
      id: "u_student_2",
      name: "مریم احمدی",
      email: "maryam@example.com",
      passwordHash: "$2b$12$dfTRc448mCD/gx/Cg7vVs.xCPwjY7KiAHPKm/MJkSWILe8PnviaMO",
      role: "STUDENT",
      phone: "09120000011",
      createdAt: daysAgo(80),
    },
  });

  const student3 = await prisma.user.create({
    data: {
      id: "u_student_3",
      name: "علی کریمی",
      email: "ali@example.com",
      passwordHash: "$2b$12$dfTRc448mCD/gx/Cg7vVs.xCPwjY7KiAHPKm/MJkSWILe8PnviaMO",
      role: "STUDENT",
      phone: "09120000012",
      createdAt: daysAgo(45),
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      id: "u_teacher_2",
      name: "مهندس رضا کریمی",
      email: "reza@example.com",
      passwordHash: "$2b$12$zGlwX4M67JYaDXr8IvQyH.4wpcS491t6K9k4qJ7vQh0p.4ikJuO62",
      role: "TEACHER",
      phone: "09120000022",
      bio: "مدرس ارائه و ارتباطات سازمانی.",
      createdAt: daysAgo(250),
    },
  });

  console.log(`  ✅ Users: ${student1.name}, ${teacher1.name}, ${admin1.name}, ${student2.name}, ${student3.name}, ${teacher2.name}`);

  // ─── Courses ───────────────────────────────────────────────────
  const c1 = await prisma.course.create({
    data: {
      id: "c_fundamentals",
      title: "مبانی فن بیان",
      subtitle: "از صفر تا تسلط بر صحبت کردن در جمع",
      description: "نقطه شروع ایده‌آل برای آشنایی با اصول اولیه فن بیان، تکنیک‌های تنفسی و ساختار ارائه مؤثر.",
      mentorId: teacher1.id,
      price: 850000,
      originalPrice: 1200000,
      level: "مقدماتی",
      category: "speaking",
      durationHours: 18,
      lessons: 64,
      rating: 4.9,
      glyph: "🎤",
      accent: "violet",
      published: true,
      createdAt: daysAgo(200),
    },
  });

  const c2 = await prisma.course.create({
    data: {
      id: "c_presentation",
      title: "استاد ارائه‌دهنده",
      subtitle: "ساخت و اجرای ارائه‌های تأثیرگذار",
      description: "دوره‌ای جامع برای حرفه‌ای شدن در ارائه؛ از طراحی اسلاید تا داستان‌گویی و مدیریت سوالات.",
      mentorId: teacher2.id,
      price: 1200000,
      level: "متوسط",
      category: "presentation",
      durationHours: 24,
      lessons: 82,
      rating: 4.8,
      glyph: "📊",
      accent: "pink",
      published: true,
      createdAt: daysAgo(180),
    },
  });

  const c3 = await prisma.course.create({
    data: {
      id: "c_voice",
      title: "آواسازی حرفه‌ای صدا",
      subtitle: "تکنیک‌های تنفسی و رسایی صدای جذاب",
      description: "تکنیک‌های تخصصی برای زیباسازی، قدرتمندتر کردن و رسایی صدا.",
      mentorId: teacher1.id,
      price: 980000,
      level: "متوسط",
      category: "voice",
      durationHours: 16,
      lessons: 48,
      rating: 4.9,
      glyph: "🎙️",
      accent: "orchid",
      published: true,
      createdAt: daysAgo(160),
    },
  });

  const c4 = await prisma.course.create({
    data: {
      id: "c_leadership",
      title: "سخنوری رهبران",
      subtitle: "هوش هیجانی و اقناع در رهبری",
      description: "برای رهبران و مدیرانی که می‌خواهند کلامشان الهام‌بخش باشد.",
      mentorId: teacher1.id,
      price: 1650000,
      level: "پیشرفته",
      category: "speaking",
      durationHours: 28,
      lessons: 96,
      rating: 5.0,
      glyph: "👑",
      accent: "amber",
      published: true,
      createdAt: daysAgo(90),
    },
  });

  console.log(`  ✅ Courses: ${c1.title}, ${c2.title}, ${c3.title}, ${c4.title}`);

  // ─── Enrollments ───────────────────────────────────────────────
  const e1 = await prisma.enrollment.create({
    data: {
      id: "e_1",
      userId: student1.id,
      courseId: c1.id,
      progress: 100,
      status: "COMPLETED",
      enrolledAt: daysAgo(100),
      completedAt: daysAgo(60),
    },
  });

  await prisma.enrollment.create({
    data: {
      id: "e_2",
      userId: student1.id,
      courseId: c2.id,
      progress: 65,
      status: "ACTIVE",
      enrolledAt: daysAgo(40),
    },
  });

  await prisma.enrollment.create({
    data: {
      id: "e_3",
      userId: student1.id,
      courseId: c3.id,
      progress: 20,
      status: "ACTIVE",
      enrolledAt: daysAgo(10),
    },
  });

  const e4 = await prisma.enrollment.create({
    data: {
      id: "e_4",
      userId: student2.id,
      courseId: c1.id,
      progress: 80,
      status: "ACTIVE",
      enrolledAt: daysAgo(50),
    },
  });

  await prisma.enrollment.create({
    data: {
      id: "e_5",
      userId: student3.id,
      courseId: c3.id,
      progress: 35,
      status: "ACTIVE",
      enrolledAt: daysAgo(30),
    },
  });

  console.log(`  ✅ Enrollments: 5 created`);

  // ─── Grades ────────────────────────────────────────────────────
  await prisma.grade.create({
    data: {
      id: "g_1",
      userId: student1.id,
      courseId: c1.id,
      enrollmentId: e1.id,
      score: 18.5,
      feedback: "پیشرفت عالی در کنترل صدا و زبان بدن.",
      gradedAt: daysAgo(58),
      teacherId: teacher1.id,
    },
  });

  await prisma.grade.create({
    data: {
      id: "g_2",
      userId: student2.id,
      courseId: c1.id,
      enrollmentId: e4.id,
      score: 17,
      feedback: "تمرینات را ادامه بده.",
      gradedAt: daysAgo(20),
      teacherId: teacher1.id,
    },
  });

  console.log(`  ✅ Grades: 2 created`);

  // ─── Certificate ───────────────────────────────────────────────
  await prisma.certificate.create({
    data: {
      id: "cert_1",
      userId: student1.id,
      courseId: c1.id,
      enrollmentId: e1.id,
      certificateNumber: "BN-1403-0001",
      issueDate: daysAgo(58),
    },
  });

  console.log(`  ✅ Certificates: 1 created`);

  // ─── Payments ──────────────────────────────────────────────────
  await prisma.payment.createMany({
    data: [
      { id: "p_1", userId: student1.id, courseId: c1.id, amount: 850000, status: "PAID", method: "زرین‌پال", paidAt: daysAgo(100), createdAt: daysAgo(100) },
      { id: "p_2", userId: student1.id, courseId: c2.id, amount: 1200000, status: "PAID", method: "بانک سامان", paidAt: daysAgo(40), createdAt: daysAgo(40) },
      { id: "p_3", userId: student1.id, courseId: c3.id, amount: 980000, status: "PAID", method: "زرین‌پال", paidAt: daysAgo(10), createdAt: daysAgo(10) },
      { id: "p_4", userId: student2.id, courseId: c1.id, amount: 850000, status: "PAID", method: "زرین‌پال", paidAt: daysAgo(50), createdAt: daysAgo(50) },
      { id: "p_5", userId: student3.id, courseId: c3.id, amount: 980000, status: "PENDING", method: "زرین‌پال", createdAt: daysAgo(5) },
    ],
  });

  console.log(`  ✅ Payments: 5 created`);

  // ─── Messages ──────────────────────────────────────────────────
  await prisma.message.createMany({
    data: [
      { id: "m_1", senderId: teacher1.id, receiverId: student1.id, body: "آفرین! گواهی دوره مبانی برای شما صادر شد. موفق باشی.", read: false, sentAt: daysAgo(57) },
      { id: "m_2", senderId: admin1.id, receiverId: student1.id, body: "به پلتفرم بصیر نو خوش آمدید. در صورت نیاز به راهنمایی در تماس باشید.", read: true, sentAt: daysAgo(100) },
    ],
  });

  console.log(`  ✅ Messages: 2 created`);
  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
