import { describe, it, expect } from "vitest";
import { withUtcSession } from "../conn";

describe("withUtcSession", () => {
  it("appends the UTC timezone option to a plain URL", () => {
    const url = "postgresql://user:pass@host:5432/db";
    expect(withUtcSession(url)).toBe(
      "postgresql://user:pass@host:5432/db?options=-c%20timezone%3DUTC",
    );
  });

  it("appends to the query string when params already exist", () => {
    const url = "postgresql://user:pass@host:5432/db?sslmode=require";
    expect(withUtcSession(url)).toBe(
      "postgresql://user:pass@host:5432/db?sslmode=require&options=-c%20timezone%3DUTC",
    );
  });

  it("merges with an existing options param instead of overwriting it", () => {
    const url = "postgresql://user:pass@host:5432/db?options=-c%20statement_timeout%3D30000";
    const merged = withUtcSession(url);
    expect(merged).toContain("statement_timeout%3D30000");
    expect(merged).toContain("-c%20timezone%3DUTC");
    expect(merged).not.toContain("options=-c%20timezone");
  });

  it("is a no-op when the timezone is already pinned", () => {
    const url = "postgresql://user:pass@host:5432/db?options=-c%20timezone%3DUTC";
    expect(withUtcSession(url)).toBe(url);
  });

  it("keeps the password and host untouched", () => {
    const url = "postgresql://postgres:secret@db.internal:5432/railway";
    const out = withUtcSession(url);
    expect(out).toContain("postgres:secret@db.internal");
    expect(out).toContain("/railway?options=");
  });
});
