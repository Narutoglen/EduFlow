import { notFound } from "next/navigation";
import { Award, CheckCircle2, Download } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel } from "@/components/ui";
import { getCertificate, getCourseById, getInstructor, getUser } from "@/lib/eduflow";
import { userForRole } from "@/lib/mock-data";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const certificate = getCertificate(certificateId);
  if (!certificate) notFound();

  const course = getCourseById(certificate.courseId);
  const student = getUser(certificate.studentId);
  if (!course || !student) notFound();

  const lecturer = getInstructor(course);
  const viewer = userForRole("STUDENT");

  return (
    <PageShell user={viewer}>
      <PageTitle
        eyebrow="Certificate verification"
        title="Verified EduFlow certificate"
        body="Public verification confirms the learner, course, lecturer, completion date, and unique certificate identifier."
      />

      <Panel className="mx-auto max-w-4xl overflow-hidden p-0">
        <div className="bg-zinc-950 p-8 text-white">
          <div className="flex items-center gap-3">
            <Award size={32} className="text-amber-300" />
            <div>
              <p className="text-sm uppercase tracking-normal text-zinc-300">
                Certificate of completion
              </p>
              <h2 className="text-3xl font-semibold tracking-normal">
                {course.title}
              </h2>
            </div>
          </div>
        </div>
        <div className="grid gap-6 p-8 md:grid-cols-[1fr_260px]">
          <div>
            <Badge tone="green">
              <CheckCircle2 size={14} />
              Valid certificate
            </Badge>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-zinc-500">Student</dt>
                <dd className="font-semibold">{student.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Lecturer</dt>
                <dd className="font-semibold">{lecturer.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Completed</dt>
                <dd className="font-semibold">{certificate.issuedAt}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Verification ID</dt>
                <dd className="font-semibold">{certificate.verificationId}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg bg-stone-100 p-5 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Download a shareable certificate record for learner portfolios,
              employer checks, or course completion files.
            </p>
            <div className="mt-4">
              <ButtonLink
                href={`/api/certificates?studentId=${student.id}&courseId=${course.id}`}
                variant="secondary"
              >
                <Download size={16} />
                Download record
              </ButtonLink>
            </div>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
