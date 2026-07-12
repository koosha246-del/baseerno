import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";
import { ContactForm } from "./ContactForm";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  MessageCircle,
  Youtube,
} from "lucide-react";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: `ارتباط با آکادمی ${siteConfig.name} — ${siteConfig.contact.address}`,
};

export default function ContactPage() {
  return (
    <main className="pb-20 pt-[calc(var(--header-h)+2rem)]">
      <Container width="page">
        <div className="mb-12 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg-primary sm:text-4xl">
            تماس با ما
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-fg-secondary">
            ما اینجا هستیم تا به شما کمک کنیم. با ما در تماس باشید.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Contact info */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Mail className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-fg-primary">ایمیل</h3>
                <p className="mt-1 text-sm text-fg-secondary" dir="ltr">{siteConfig.contact.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Phone className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-fg-primary">تلفن</h3>
                <p className="mt-1 text-sm text-fg-secondary" dir="ltr">{siteConfig.contact.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-app-border-subtle bg-surface p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <MapPin className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-fg-primary">آدرس</h3>
                <p className="mt-1 text-sm text-fg-secondary">{siteConfig.contact.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={siteConfig.social.instagram}
                aria-label="اینستاگرام"
                className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent hover:bg-accent-softHover"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href={siteConfig.social.telegram}
                aria-label="تلگرام"
                className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent hover:bg-accent-softHover"
              >
                <MessageCircle className="size-5" />
              </a>
              <a
                href={siteConfig.social.youtube}
                aria-label="یوتیوب"
                className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent hover:bg-accent-softHover"
              >
                <Youtube className="size-5" />
              </a>
            </div>
          </div>

          {/* Contact form */}
          <ContactForm />
        </div>
      </Container>
    </main>
  );
}
