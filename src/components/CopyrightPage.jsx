import { EnvelopeSimple, ShieldCheck, Warning, FileText, ArrowsCounterClockwise, Scales } from "@phosphor-icons/react";
import { CONTACT_EMAIL } from "../data/videos.js";

const UPDATED = "October 28, 2026";

function Section({ icon: Icon, title, children, tone }) {
  return (
    <section className={`rounded-2xl bg-raised/70 p-6 ring-1 backdrop-blur sm:p-8 ${tone === "warn" ? "ring-amber-400/40" : "ring-hairline"}`}>
      <h2 className="flex items-center gap-3 font-display text-xl tracking-display text-ink sm:text-2xl">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${tone === "warn" ? "bg-amber-400/10 text-amber-300 ring-amber-400/40" : "bg-accent/10 text-accent ring-accent/30"}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

const Li = ({ children }) => <li className="pl-1 marker:text-accent">{children}</li>;

export default function CopyrightPage() {
  const mail = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Copyright Notice – SRD Masum")}`;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8 sm:pt-36">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Legal</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-display text-ink sm:text-6xl">Copyright &amp; DMCA Policy</h1>
      <p className="mt-4 text-sm text-faint">Last updated: {UPDATED}</p>
      <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg">
        SRD Masum is a music platform and label. We respect the intellectual property of artists, songwriters, labels and
        publishers, and we expect everyone who uses this site to do the same. This page explains how to report content you
        believe infringes your copyright, and how we protect creators against false or abusive claims.
      </p>

      <div className="mt-10 space-y-5">
        <Section icon={FileText} title="How to submit a copyright notice">
          <p>Send your notice by email to <a href={mail} className="text-accent underline-offset-4 hover:underline">{CONTACT_EMAIL}</a>. To be valid, it must include <strong className="text-ink">all</strong> of the following:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <Li>Identification of the copyrighted work you claim has been infringed (title, artist, release, and owner).</Li>
            <Li>The exact URL(s) on srdmasum.bbroot.com where the allegedly infringing material appears.</Li>
            <Li>Your full legal name, postal address, telephone number and email address.</Li>
            <Li>A statement that you have a good-faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.</Li>
            <Li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or are authorized to act on the owner's behalf.</Li>
            <Li>Your physical or electronic signature.</Li>
          </ol>
          <p className="rounded-xl bg-sunk/70 p-4 text-sm ring-1 ring-hairline">Notices that are missing any of these elements are incomplete and <strong className="text-ink">will not be processed</strong>.</p>
        </Section>

        <Section icon={ShieldCheck} title="How we review notices">
          <ul className="list-disc space-y-2 pl-5">
            <Li>We verify the identity of the claimant and their ownership of, or authority over, the work before taking action.</Li>
            <Li>We may request supporting proof, such as distributor, label or publisher documents, registration records, or licensing agreements.</Li>
            <Li>We may forward the notice, including the claimant's contact details, to the uploader or the relevant rights holder so they can respond.</Li>
            <Li>When a valid, verified notice is received, we will remove or disable access to the material promptly.</Li>
          </ul>
        </Section>

        <Section icon={Warning} title="False and bad-faith claims" tone="warn">
          <p>
            Knowingly submitting a false or misleading notice is a misrepresentation under <strong className="text-ink">17 U.S.C. §512(f)</strong>,
            and the claimant may be held liable for damages, including costs and attorneys' fees, incurred by us, our artists, or the uploader.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <Li>Claims that cannot be verified will not be acted upon.</Li>
            <Li>Repeated unfounded or abusive claims from the same party will be documented, and further notices from that party may be disregarded or referred for legal action.</Li>
            <Li><strong className="text-ink">We never pay for claims.</strong> Any request for payment, "settlement" or fees in exchange for withdrawing a claim will not be honored and may be reported.</Li>
          </ul>
        </Section>

        <Section icon={ArrowsCounterClockwise} title="Counter-notice">
          <p>If your content was removed and you believe this was a mistake or misidentification, you may send a counter-notice to the same address including:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <Li>Identification of the material removed and the URL where it appeared.</Li>
            <Li>A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification.</Li>
            <Li>Your full name, address, telephone number and email, and consent to the jurisdiction of the appropriate court.</Li>
            <Li>Your physical or electronic signature.</Li>
          </ol>
          <p>We may forward the counter-notice to the original claimant and may restore the material unless the claimant notifies us that they have filed a court action.</p>
        </Section>

        <Section icon={Scales} title="Contact">
          <p>All copyright notices and counter-notices should be sent to:</p>
          <a href={mail} className="pro-btn mt-2 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-on-accent">
            <EnvelopeSimple size={18} aria-hidden="true" /> {CONTACT_EMAIL}
          </a>
          <p className="text-sm text-faint">Please write “Copyright Notice” in the subject line. General messages sent to this address are not treated as legal notices.</p>
        </Section>
      </div>

      <p className="mt-10 text-center text-sm"><a href="/" className="text-accent underline-offset-4 hover:underline">← Back to SRD Masum</a></p>
    </div>
  );
}
