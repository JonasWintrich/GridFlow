import type { LegalDoc } from './product.config';
import { SITE } from './product.config';

const HOME = import.meta.env.BASE_URL;

/** Shared shell for every hash sub-page: brand + back link, dark background. */
function SubpageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="subpage">
      <header className="subpage-bar">
        <a className="brand" href={HOME}>{SITE.brand}</a>
        <a className="subpage-back" href={HOME}>← Back to {SITE.brand}</a>
      </header>
      <main className="subpage-body">{children}</main>
      <footer className="subpage-foot">
        <a href="#terms">Terms</a><a href="#privacy">Privacy</a><a href="#refund">Refunds</a>
        <a href={`mailto:${SITE.contactEmail}`}>Email us</a>
      </footer>
    </div>
  );
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <SubpageShell>
      <article className="legal">
        <h1>{doc.title}</h1>
        <p className="legal-updated">Last updated {doc.updated}</p>
        <p className="legal-disclaimer">
          This is a starting template, not legal advice — have it reviewed by a professional
          before you rely on it.
        </p>
        {doc.sections.map((s, i) => (
          <section key={i}>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </section>
        ))}
      </article>
    </SubpageShell>
  );
}

// A Tally URL that still contains the setup placeholder isn't connected yet.
const isPlaceholder = (src: string) => !/^https?:\/\//.test(src) || /XXXXXX|YYYYYY/.test(src);

export function FormPage({
  title, lead, src, fallbackNote, mailtoSubject,
}: {
  title: string; lead: string; src: string; fallbackNote: string; mailtoSubject: string;
}) {
  const mailto = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(mailtoSubject)}`;
  return (
    <SubpageShell>
      <div className="form-intro">
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
      {isPlaceholder(src) ? (
        <div className="form-fallback">
          <p>{fallbackNote}</p>
          <a className="cta" href={mailto}>Email us</a>
        </div>
      ) : (
        <iframe className="embed" title={title} src={src} loading="lazy" />
      )}
    </SubpageShell>
  );
}
