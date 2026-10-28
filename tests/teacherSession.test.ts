import { test } from "node:test";
import assert from "node:assert/strict";
import { createTeacherToken, validTeacherToken } from "@/lib/server/teacherSession";

test("teacher password session is signed for one account and expires", () => {
  process.env.TEACHER_DASHBOARD_PASSWORD = "unit-test-password";
  process.env.TEACHER_DASHBOARD_SECRET = "unit-test-secret";
  const now = Date.now();
  const t = createTeacherToken("teacher-id", now);
  assert.equal(validTeacherToken(t.value, "teacher-id", now), true);
  assert.equal(validTeacherToken(t.value, "student-id", now), false, "a cookie cannot be reused by another account");
  assert.equal(validTeacherToken(t.value.replace(/.$/, (c) => (c === "a" ? "b" : "a")), "teacher-id", now), false, "a changed cookie is refused");
  assert.equal(validTeacherToken(t.value, "teacher-id", now + 7 * 3600 * 1000), false, "expires after 6 hours");
  assert.equal(validTeacherToken(undefined, "teacher-id", now), false);
  process.env.TEACHER_DASHBOARD_PASSWORD = "a-new-password";
  assert.equal(validTeacherToken(t.value, "teacher-id", now), false, "changing the password signs everybody out");
});
