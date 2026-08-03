-- CreateTable
CREATE TABLE "CourseSearch" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "searchVector" tsvector,

    CONSTRAINT "CourseSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_search_gin_idx" ON "CourseSearch" USING GIN ("searchVector");
