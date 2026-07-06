import { company } from "@/lib/company";

export const metadata = {
  title: "Privacy Policy"
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-mist py-20">
      <article className="section-shell max-w-4xl rounded-lg bg-white p-8 shadow-soft">
        <h1 className="text-4xl font-bold text-navy">Privacy Policy</h1>
        <p className="mt-5 leading-8 text-ink/70">
          Professional Business Services respects client privacy and handles personal, business, and document information with care for PRO services, company formation, visa processing, attestation, compliance, and related UAE government liaison work.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-navy">Information We Collect</h2>
        <p className="mt-3 leading-8 text-ink/70">
          We may collect name, phone number, email address, company details, service interest, message content, submitted documents, communication records, quote requests, and case status information needed to respond to inquiries or deliver services.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-navy">How We Use Information</h2>
        <p className="mt-3 leading-8 text-ink/70">
          Information is used to contact clients, prepare applications, coordinate with UAE authorities, maintain client records, send service updates, prepare quotes or invoices, and improve internal follow-up and support workflows.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-navy">Sharing and Security</h2>
        <p className="mt-3 leading-8 text-ink/70">
          Client information may be shared with relevant government departments, typing centers, legal processors, payment providers, or service partners only when required for the requested work. We use reasonable administrative and technical controls to protect submitted information.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-navy">Contact</h2>
        <p className="mt-3 leading-8 text-ink/70">
          For privacy questions, contact {company.name} at {company.phone} or visit our office at {company.address}.
        </p>
      </article>
    </main>
  );
}
