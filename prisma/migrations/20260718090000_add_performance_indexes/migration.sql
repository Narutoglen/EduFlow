-- Performance indexes for hot filter/sort columns.
-- These match the @@index directives added to prisma/schema.prisma. All are
-- non-unique secondary indexes and are safe to apply online; on very large
-- tables consider CREATE INDEX CONCURRENTLY (cannot run inside Prisma's
-- transactional migration wrapper — see REVIEW.md NEEDS HUMAN).

-- Course: lecturer dashboards and category browse
CREATE INDEX "Course_lecturerId_idx" ON "Course"("lecturerId");
CREATE INDEX "Course_categoryId_idx" ON "Course"("categoryId");

-- CourseAssistant: TA course-membership lookups (userId alone; the unique key is courseId-first)
CREATE INDEX "CourseAssistant_userId_idx" ON "CourseAssistant"("userId");

-- Enrollment: "who is enrolled in this course" scans
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- LessonProgress: progress rollups per lesson
CREATE INDEX "LessonProgress_lessonId_idx" ON "LessonProgress"("lessonId");

-- QuizAttempt: student history + per-quiz aggregates
CREATE INDEX "QuizAttempt_studentId_idx" ON "QuizAttempt"("studentId");
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- AssignmentSubmission: student history, per-assignment, and grading queues (status)
CREATE INDEX "AssignmentSubmission_studentId_idx" ON "AssignmentSubmission"("studentId");
CREATE INDEX "AssignmentSubmission_assignmentId_idx" ON "AssignmentSubmission"("assignmentId");
CREATE INDEX "AssignmentSubmission_status_idx" ON "AssignmentSubmission"("status");

-- Notification: user inbox ordered by recency
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- Payment: student/course lookups + idempotency probes by provider reference
CREATE INDEX "Payment_studentId_courseId_idx" ON "Payment"("studentId", "courseId");
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");
