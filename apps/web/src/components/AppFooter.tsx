import { type FormEvent, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { WAITLIST_ENDPOINT } from '@clearpick/shared';
import type { TranslationCopy } from '../copy';
import { Input } from './ui/input';

interface AppFooterProps {
  copy: TranslationCopy['footer'];
  homeLinkLabel?: string;
  showPrivacyPolicyLink?: boolean;
}

const WAITLIST_SESSION_KEY = 'clearpick:pro-waitlist-submitted';

const linkClass = 'text-base text-muted-foreground hover:text-foreground transition-colors';

export function AppFooter({
  copy,
  homeLinkLabel,
  showPrivacyPolicyLink = true,
}: AppFooterProps) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'succeeded' | 'error'>(() =>
    sessionStorage.getItem(WAITLIST_SESSION_KEY) ? 'succeeded' : 'idle'
  );
  const [errorMsg, setErrorMsg] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === 'succeeded') return;

    const trimmed = email.trim();
    const input = e.currentTarget.querySelector('input[type="email"]') as HTMLInputElement | null;

    if (!trimmed || !input?.validity.valid) {
      setStatus('error');
      setErrorMsg(copy.waitlistInvalidEmail);
      input?.focus();
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        body: JSON.stringify({ email: trimmed, website }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) throw new Error();

      try {
        sessionStorage.setItem(WAITLIST_SESSION_KEY, 'true');
      } catch {
        // In-memory status still prevents duplicate submits this session.
      }
      setStatus('succeeded');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg(copy.waitlistSubmitError);
    }
  };

  return (
    <footer className="border-t border-border pt-14 pb-10">
      <div className="grid grid-cols-1 gap-y-12 gap-x-10 sm:grid-cols-[2fr_1fr_2fr] sm:items-start">
        {/* Left: logo + tagline note + copyright + privacy */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <img
              alt=""
              aria-hidden="true"
              className="size-14 shrink-0 rounded-xl"
              src="/favicon.svg"
            />
            <p className="text-3xl font-bold tracking-tight text-foreground">{copy.productLabel}</p>
          </div>
          <div className="mt-5">
            <p className="text-xs text-muted-foreground">{copy.copyright}</p>
            {showPrivacyPolicyLink ? (
              <a
                className="mt-1 block text-xs text-muted-foreground hover:text-foreground transition-colors"
                href="/privacy-policy"
              >
                {copy.privacyPolicy}
              </a>
            ) : null}
          </div>
        </div>

        {/* Centre: navigation */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-4">
            {copy.navigationLabel}
          </p>
          <ul className="flex flex-col gap-2">
            {homeLinkLabel ? (
              <li>
                <a className={linkClass} href="/">
                  ← {homeLinkLabel}
                </a>
              </li>
            ) : (
              <>
                <li>
                  <a className={linkClass} href="/how-it-works">
                    {copy.howItWorks}
                  </a>
                </li>
                <li>
                  <a className={linkClass} href="/how-it-works#faq-heading">
                    {copy.faq}
                  </a>
                </li>
                <li>
                  <a className={linkClass} href={`mailto:${copy.contactEmail}`}>
                    {copy.contactCta}
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Right: waitlist form */}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground mb-4">
            {copy.waitlistLabel}
          </p>
          {status === 'succeeded' ? (
            <p className="text-sm text-muted-foreground">{copy.waitlistSuccess}</p>
          ) : (
            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              {/* Honeypot */}
              <input
                aria-hidden="true"
                autoComplete="off"
                className="hidden"
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                type="text"
                value={website}
              />
              <div className="relative">
                <Input
                  autoComplete="email"
                  className="peer ps-9 pe-10 caret-cyan-600 placeholder:text-foreground/45 focus:border-cyan-600/60 focus:ring-4 focus:ring-cyan-600/15 focus-visible:border-cyan-600/60 focus-visible:ring-4 focus-visible:ring-cyan-600/15"
                  disabled={status === 'submitting'}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') {
                      setStatus('idle');
                      setErrorMsg('');
                    }
                  }}
                  placeholder={copy.waitlistEmailPlaceholder}
                  required
                  type="email"
                  value={email}
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <Mail aria-hidden="true" size={16} strokeWidth={2} />
                </div>
                <button
                  className="absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  disabled={!isValidEmail || status === 'submitting'}
                  type="submit"
                >
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
                </button>
              </div>
              {status === 'error' && errorMsg ? (
                <p className="text-xs text-destructive">{errorMsg}</p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </footer>
  );
}
