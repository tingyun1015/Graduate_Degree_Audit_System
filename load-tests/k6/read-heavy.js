import { group, sleep } from "k6";
import exec from "k6/execution";
import { check } from "k6";

import { config, getVuStudentId } from "./lib/config.js";
import {
  deleteRequest,
  expectStatus,
  getJson,
  parseJson,
  postJson,
} from "./lib/http.js";

export const options = {
  scenarios: {
    read_heavy: {
      executor: "shared-iterations",
      vus: 12,
      iterations: 681,
      maxDuration: "3m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<1500", "p(99)<2500"],
  },
};

function maybeDoWrite() {
  const vuStudentId = getVuStudentId(exec.vu.idInTest);

  if (exec.scenario.iterationInTest % 5 !== 0) {
    return;
  }

  expectStatus(
    postJson(`${config.baseUrl}/api/student/enrollments`, {
      student_id: vuStudentId,
      program_id: config.plannedProgramId,
    }),
    201,
    "read-heavy create enrollment",
  );
  expectStatus(
    deleteRequest(
      `${config.baseUrl}/api/student/${vuStudentId}/programs/${config.plannedProgramId}`,
    ),
    200,
    "read-heavy delete enrollment",
  );
}

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

  return { studentId: body.id };
}

export default function (data) {
  group("dominant reads", () => {
    const dashboard = getJson(`${config.baseUrl}/api/student/dashboard-all`, {
      student_id: data.studentId,
    });
    expectStatus(dashboard, 200, "dashboard-all");
    check(parseJson(dashboard), {
      "dashboard contains programs": (body) => body && body.programs.length >= 1,
    });

    expectStatus(
      getJson(`${config.baseUrl}/api/student/credits/summary`, {
        student_id: data.studentId,
      }),
      200,
      "credits summary",
    );

    expectStatus(
      getJson(
        `${config.baseUrl}/api/student/${data.studentId}/programs/${config.auditProgramId}/audit`,
      ),
      200,
      "program audit",
    );

    expectStatus(getJson(`${config.baseUrl}/api/programs`), 200, "GET /api/programs");
  });

  maybeDoWrite();
  sleep(1);
}
