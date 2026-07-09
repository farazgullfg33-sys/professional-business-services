import { Reveal } from "@/components/motion/MotionScenes";
import { company } from "@/lib/company";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms governing the use of Professional Business Services' website and UAE PRO, visa, and business setup services."
};

export default function TermsAndConditionsPage() {
  return (
    <main className="bg-panel py-20">
      <Reveal as="div" className="glass-panel section-shell max-w-4xl rounded-lg p-8 shadow-soft">
        <h1 className="font-heading text-4xl font-bold text-heading">Terms & Conditions</h1>
        <p className="mt-5 leading-8 text-body">
          These terms apply to the use of this website and services requested from Professional Business Services, including PRO services, visa processing, company formation, document attestation, licensing, compliance, and related support.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-heading">Service Scope</h2>
        <p className="mt-3 leading-8 text-body">
          Service timelines, approvals, government fees, and document requirements depend on UAE authority rules, applicant eligibility, activity type, emirate, and third-party processing schedules. Final approval remains with the relevant authority.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-heading">Client Responsibilities</h2>
        <p className="mt-3 leading-8 text-body">
          Clients must provide accurate information, valid documents, required originals where applicable, timely payments, and prompt responses to document or authority requests.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-heading">Fees and Payments</h2>
        <p className="mt-3 leading-8 text-body">
          Quotes may include government fees, third-party charges, service fees, deposits, and renewal costs. Government and third-party fees can change without notice and may be payable before submission.
        </p>
        <h2 className="mt-8 text-2xl font-semibold text-heading">Contact</h2>
        <p className="mt-3 leading-8 text-body">
          For service questions, contact {company.name} at {company.phone} or visit our office at {company.address}.
        </p>
      </Reveal>
    </main>
  );
}
