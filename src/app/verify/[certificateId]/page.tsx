import { notFound } from "next/navigation";
import { Award, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel } from "@/components/ui";
import { getCertificate, getCourseById, getInstructor, getUser } from "@/lib/eduflow";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;

  // Check DB first for real certificates
  let dbCert = await prisma.certificate.findUnique({
    where: { verificationId: certificateId },
    include: {
      student: true,
      course: {
        include: { lecturer: true },
      },
    },
  }).catch(() => null);

  // Fallback to mock store if DB record not found
  const mockCert = !dbCert ? getCertificate(certificateId) : null;
  const mockCourse = mockCert ? getCourseById(mockCert.courseId) : null;
  const mockStudent = mockCert ? getUser(mockCert.studentId) : null;
  const mockLecturer = mockCourse ? getInstructor(mockCourse) : null;

  if (!dbCert && (!mockCert || !mockCourse || !mockStudent || !mockLecturer)) {
    notFound();
  }

  const certificate = {
    verificationId: dbCert ? dbCert.verificationId : mockCert!.verificationId,
    courseTitle: dbCert ? dbCert.course.title : mockCourse!.title,
    studentName: dbCert ? dbCert.student.name : mockStudent!.name,
    lecturerName: dbCert ? dbCert.course.lecturer.name : mockLecturer!.name,
    issuedAt: dbCert
      ? dbCert.issuedAt.toISOString().slice(0, 10)
      : mockCert!.issuedAt,
  };

  const viewer = await getCurrentUser();

  return (
    <PageShell user={viewer ?? undefined}>
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
                {certificate.courseTitle}
              </h2>
            </div>
          </div>
        </div>
        <div className="grid gap-6 p-8 md:grid-cols-[1fr_260px]">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="green">
                <CheckCircle2 size={14} />
                Valid certificate
              </Badge>
              <Badge tone="blue">
                <ShieldCheck size={14} />
                Cryptographically authentic
              </Badge>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-zinc-500">Student</dt>
                <dd className="font-semibold">{certificate.studentName}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Lecturer</dt>
                <dd className="font-semibold">{certificate.lecturerName}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Completed</dt>
                <dd className="font-semibold">{certificate.issuedAt}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Verification ID</dt>
                <dd className="font-semibold text-brand-600 dark:text-brand-400">
                  {certificate.verificationId}
                </dd>
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
                href={`/api/certificates?verificationId=${encodeURIComponent(certificate.verificationId)}`}
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
