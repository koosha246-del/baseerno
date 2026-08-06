/**
 * Translation messages for بصیر نو (Baseer No).
 *
 * Currently supports: Persian (fa) — default
 * English (en) — ready for future expansion.
 *
 * Usage:
 * ```ts
 * import { t } from "@/lib/i18n";
 * const msg = t("home.hero.title"); // "انگلیسی را ساده و قدم‌به‌قدم یاد بگیر"
 * ```
 */

export const messages = {
  fa: {
    home: {
      hero: {
        badge: "یادگیری انگلیسی، آسان و شاد",
        title: "انگلیسی را ساده و قدم‌به‌قدم یاد بگیر",
        description:
          "اینجا برای دانش‌آموزان است. درس‌های کوتاه، تمرین‌های آسان و مسیر روشن — تا بدون استرس انگلیسی را یاد بگیری.",
        primaryCta: "درس‌ها را ببین",
        secondaryCta: "چطور کار می‌کند؟",
      },
      welcome: {
        badge: "خوش اومدی به {name}",
        title: "ما انگلیسی رو ساده یاد می‌دیم",
        description:
          "{name} یک آکادمی زبان انگلیسیه. کار ما فقط یه چیزه: کمکت کنیم انگلیسی رو قدم به قدم، با کتاب‌های استاندارد و روش درست یاد بگیری. بدون حاشیه، بدون ادعای بزرگ — فقط یادگیری.",
      },
      stats: {
        students: "دانش‌آموز فعال",
        books: "کتاب استاندارد بین‌المللی",
        satisfaction: "رضایت والدین",
      },
      books: {
        eyebrow: "کتاب‌های آموزشی",
        title: "با کتاب‌های استاندارد دنیا یاد بگیر",
        description:
          "مجموعه Milestones، Genius، Ace it!‌، Smart English و Smart plus از انتشارات Setayesh — کتاب‌های استاندارد آموزش زبان انگلیسی.",
      },
      courses: {
        eyebrow: "دوره‌های زبان انگلیسی",
        title: "مهارت‌هایی که واقعاً یاد می‌دی",
        description:
          "گرامر، واژگان، شنیدن، خواندن، نوشتن و آیلتس — هر دوره روی یک مهارت مشخص تمرکز دارد.",
        searchPlaceholder: "جستجوی درس...",
        allCourses: "همه درس‌ها",
        emptyTitle: "درسی در این بخش پیدا نشد",
        emptyDesc: "به‌زودی درس‌های جدید می‌آیند.",
      },
      why: {
        eyebrow: "چرا بصیر نو",
        title: "۴ دلیل که ما فرق داریم",
        description: "ما فقط آموزش نمی‌دهیم — روش یادگیری را طراحی کرده‌ایم.",
        reasons: {
          books: {
            title: "کتاب‌های استاندارد جهانی",
            desc: "از کتاب‌های استاندارد Setayesh (Milestones، Genius، Ace it!‌، Smart English، Smart plus) استفاده می‌کنیم — منابع معتبر آموزش زبان انگلیسی.",
          },
          teachers: {
            title: "اساتید متخصص زبان",
            desc: "مدرس‌های ما مدرک بین‌المللی TESOL/TEFL دارند و حداقل ۵ سال سابقه تدریس به فارسی‌زبانان.",
          },
          skills: {
            title: "تمرین هر ۴ مهارت",
            desc: "در هر دوره، reading, writing, listening, speaking هر چهار مهارت به طور متعادل تقویت می‌شود.",
          },
          feedback: {
            title: "تمرین + آزمون + بازخورد",
            desc: "هر درس شامل تمرین، آزمون کوتاه و بازخورد شخصی مدرس است. فقط فیلم نمی‌بینی — یاد می‌گیری.",
          },
        },
      },
      cta: {
        badge: "اولین درس رایگان",
        title: "آماده‌ای شروع کنی؟",
        description:
          "ثبت‌نام کمتر از ۳۰ ثانیه طول می‌کشه. اولین درس رایگانه. بدون تعهد، بدون کارت.",
        register: "ثبت‌نام رایگان",
        question: "سوالی دارم",
      },
    },
    common: {
      loading: "در حال بارگذاری...",
      error: "خطایی رخ داد",
      retry: "تلاش مجدد",
      cancel: "انصراف",
      save: "ذخیره",
      delete: "حذف",
      edit: "ویرایش",
      create: "ایجاد",
      search: "جستجو",
      noResults: "نتیجه‌ای یافت نشد",
      back: "بازگشت",
      viewAll: "مشاهده همه",
      free: "رایگان",
      toman: "تومان",
      readMore: "بیشتر بخوانید",
      showLess: "نمایش کمتر",
    },
    auth: {
      login: "ورود",
      register: "ثبت‌نام",
      logout: "خروج",
      email: "ایمیل",
      password: "رمز عبور",
      name: "نام",
      forgotPassword: "رمز عبور را فراموش کرده‌ام",
      loginTitle: "به {name} خوش آمدید",
      registerTitle: "ایجاد حساب کاربری",
      loginDescription: "برای دسترسی به دوره‌های خود وارد شوید.",
      registerDescription: "ثبت‌نام کمتر از ۳۰ ثانیه طول می‌کشد.",
    },
    dashboard: {
      title: "پنل کاربری",
      courses: "دوره‌های من",
      messages: "پیام‌ها",
      notifications: "اعلان‌ها",
      settings: "تنظیمات",
      grades: "نمرات",
      certificates: "گواهی‌نامه‌ها",
      finance: "مالی",
      reports: "گزارش‌ها",
      users: "کاربران",
      content: "مدیریت محتوا",
      search: "جستجو در داشبورد...",
    },
    errors: {
      notFound: "صفحه مورد نظر یافت نشد",
      notFoundDesc: "متأسفیم، صفحه‌ای که به دنبال آن هستید وجود ندارد.",
      serverError: "خطای داخلی سرور",
      serverErrorDesc: "لطفاً بعداً تلاش کنید.",
      unauthorized: "احراز هویت نشده",
      forbidden: "دسترسی غیرمجاز",
      rateLimited: "درخواست بیش از حد مجاز. لطفاً کمی صبر کنید.",
      invalidInput: "ورودی نامعتبر",
    },
  },

  // ─── English translations (ready for future expansion) ────────
  en: {
    home: {
      hero: {
        badge: "Learn English, Easy & Fun",
        title: "Learn English Simply, Step by Step",
        description:
          "Short lessons, easy exercises, and a clear path — so you can learn English without stress.",
        primaryCta: "View Lessons",
        secondaryCta: "How It Works",
      },
      welcome: {
        badge: "Welcome to {name}",
        title: "We Teach English Simply",
        description:
          "An English language academy helping you learn step by step with standard books and the right method. No fluff, no big claims — just learning.",
      },
      stats: {
        students: "Active Students",
        books: "Standard International Books",
        satisfaction: "Parent Satisfaction",
      },
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      noResults: "No results found",
      back: "Back",
      viewAll: "View All",
      free: "Free",
      toman: "Toman",
    },
    auth: {
      login: "Login",
      register: "Register",
      logout: "Logout",
      email: "Email",
      password: "Password",
      name: "Name",
    },
    dashboard: {
      title: "Dashboard",
      courses: "My Courses",
      messages: "Messages",
      notifications: "Notifications",
      settings: "Settings",
    },
    errors: {
      notFound: "Page Not Found",
      serverError: "Internal Server Error",
      unauthorized: "Unauthorized",
    },
  },
} as const;

export type Locale = keyof typeof messages;
export type Messages = typeof messages;
export type MessagePath = RecursiveKeyOf<typeof messages.fa>;

/** Utility type: extracts all dot-notation keys from a nested object. */
type RecursiveKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${RecursiveKeyOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;
