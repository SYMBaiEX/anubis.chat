'use client';

import Link from 'next/link';
import { LogoWithText } from '@/components/ui/logo';

export default function SiteLinksSection() {
  return (
    <section className="relative border-border/40 border-t bg-background">
      {/* Neutral cover to mask any preceding section gradients */}
      <div
        aria-hidden
        className="-top-8 pointer-events-none absolute inset-x-0 h-8 bg-background"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <LogoWithText size="md" textVariant="gradient" />
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Wallet-native AI chat built for the decentralized web.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-sm">Product</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-primary" href="#features">
                  Features
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="#pricing">
                  Pricing
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="#faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-sm">Company</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-primary" href="/referral-info">
                  Referral Program
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/roadmap">
                  Roadmap
                </Link>
              </li>
              <li>
                <a
                  className="hover:text-primary"
                  href="mailto:hello@anubis.chat"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-sm">Legal</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-primary" href="/legal/terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/legal/privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/legal/cookies">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        {/* Final separator to match the section width */}
        <div className="mt-8 h-px w-full bg-border/40" />
      </div>
    </section>
  );
}
