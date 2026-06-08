import { group, sleep } from "k6";
import { check } from "k6";

import { config } from "./lib/config.js";
import {
  expectStatus,
  getJson,
  parseJson,
  postJson,
} from "./lib/http.js";

export const options = {
  scenarios: {
    pure_read: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 15 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1200", "p(99)<2000"],
  },
};

export function setup() {
  const login = postJson(`${config.baseUrl}/api/login`, {
    email: config.studentEmail,
    password: config.studentPassword,
  });
  expectStatus(login, 200, "setup student login");

  const body = parseJson(login);
  if (!body || body.success !== true) {
    throw new Error("Student login failed in setup()");
  }

  return {
    studentId: body.id,
    auditProgramId: config.auditProgramId,
  };
}

export default function (data) {
  group("student read APIs", () => {
    const dashboard = getJson(`${config.baseUrl}/api/student/dashboard-all`, {
      student_id: data.studentId,
    });
    expectStatus(dashboard, 200, "dashboard-all");
    check(parseJson(dashboard), {
      "dashboard contains programs": (body) => body && body.programs.length >= 1,
    });

    const summary = getJson(`${config.baseUrl}/api/student/credits/summary`, {
      student_id: data.studentId,
    });
    expectStatus(summary, 200, "credits summary");

    const courses = getJson(`${config.baseUrl}/api/student/courses`, {
      student_id: data.studentId,
    });
    expectStatus(courses, 200, "student courses");

    const enrollments = getJson(`${config.baseUrl}/api/student/enrollments`, {
      student_id: data.studentId,
    });
    expectStatus(enrollments, 200, "student enrollments");

    const audit = getJson(
      `${config.baseUrl}/api/student/${data.studentId}/programs/${data.auditProgramId}/audit`,
    );
    expectStatus(audit, 200, "student program audit");
  });

  group("catalog reads", () => {
    expectStatus(getJson(`${config.baseUrl}/api/programs`), 200, "GET /api/programs");
    expectStatus(getJson(`${config.baseUrl}/api/departments`), 200, "GET /api/departments");
    expectStatus(
      getJson(`${config.baseUrl}/api/courses`, { name: "Data" }),
      200,
      "GET /api/courses?name=Data",
    );
  });

  sleep(1);
}
