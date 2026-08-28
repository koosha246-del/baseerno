-- Composite indexes for hot dashboard/report queries.
-- Each targets a multi-column filter + sort pattern that a single-column
-- index cannot cover, forcing a sequential scan + sort on every load.

-- Course: list published courses ordered by date; teacher's courses filtered by published state.
CREATE INDEX IF NOT EXISTS "Course_published_createdAt_idx" ON "Course" ("published", "createdAt");
CREATE INDEX IF NOT EXISTS "Course_mentorId_published_idx" ON "Course" ("mentorId", "published");

-- Enrollment: user's enrollment history ordered by date.
CREATE INDEX IF NOT EXISTS "Enrollment_userId_enrolledAt_idx" ON "Enrollment" ("userId", "enrolledAt");

-- Grade: teacher's grading history; student's grades — both ordered by date.
CREATE INDEX IF NOT EXISTS "Grade_userId_gradedAt_idx" ON "Grade" ("userId", "gradedAt");
CREATE INDEX IF NOT EXISTS "Grade_teacherId_gradedAt_idx" ON "Grade" ("teacherId", "gradedAt");

-- Message: inbox (received) and sent — ordered by date.
CREATE INDEX IF NOT EXISTS "Message_senderId_sentAt_idx" ON "Message" ("senderId", "sentAt");
CREATE INDEX IF NOT EXISTS "Message_receiverId_sentAt_idx" ON "Message" ("receiverId", "sentAt");

-- Notification: user's notification feed, optionally filtered by read state — ordered by date.
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification" ("userId", "read", "createdAt");

-- Payment: user's payments filtered by status — ordered by date.
CREATE INDEX IF NOT EXISTS "Payment_userId_status_idx" ON "Payment" ("userId", "status");
