import { group, sleep } from "k6";
import exec from "k6/execution";

import { config, getVuStudentId } from "./lib/config.js";
import {
  deleteRequest,
  expectStatus,
  getJson,
  parseJson,
  postJson,
  putJson,
} from "./lib/http.js";

export const options = {
  scenarios: {
    write_heavy: {
      executor: "per-vu-iterations",
      vus: 4,
      iterations: 94,
      maxDuration: "10m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1800", "p(99)<3000"],
  },
};

function uniqueProgramTitle() {
  return `k6-wh-${exec.vu.idInTest}-${exec.vu.iterationInScenario}-${Date.now()}`;
}

export function setup() {
  expectStatus(
    postJson(`${config.baseUrl}/api/login`, {
      email: config.studentEmail,
      password: config.studentPassword,
    }),
    200,
    "setup student login",
  );
  expectStatus(
    postJson(`${config.baseUrl}/api/admin/login`, {
      email: config.adminEmail,
      password: config.adminPassword,
    }),
    200,
    "setup admin login",
  );
}

export default function () {
  const vuStudentId = getVuStudentId(exec.vu.idInTest);

  group("dominant writes", () => {
    expectStatus(
      postJson(`${config.baseUrl}/api/student/enrollments`, {
        student_id: vuStudentId,
        program_id: config.plannedProgramId,
      }),
      201,
      "create enrollment",
    );

    expectStatus(
      postJson(`${config.baseUrl}/api/student/${vuStudentId}/courses`, {
        course_id: config.plannedCourseId,
      }),
      201,
      "add planned course",
    );

    const create = postJson(
      `${config.baseUrl}/api/admin/departments/${config.adminDeptId}/programs`,
      {
        title: uniqueProgramTitle(),
        type: "Minor",
      },
      { user_id: config.adminUserId },
    );
    expectStatus(create, 201, "create admin program");

    const programId = parseJson(create)?.data?.program?.id;
    if (!programId) {
      throw new Error("Program ID missing after create");
    }

    expectStatus(
      putJson(
        `${config.baseUrl}/api/admin/programs/${programId}/publish`,
        { is_published: true },
        { user_id: config.adminUserId },
      ),
      200,
      "publish program",
    );

    expectStatus(
      deleteRequest(
        `${config.baseUrl}/api/student/${vuStudentId}/courses/${config.plannedCourseId}`,
      ),
      200,
      "delete planned course",
    );

    expectStatus(
      deleteRequest(
        `${config.baseUrl}/api/student/${vuStudentId}/programs/${config.plannedProgramId}`,
      ),
      200,
      "delete enrollment",
    );

    expectStatus(
      deleteRequest(
        `${config.baseUrl}/api/admin/programs/${programId}`,
        { user_id: config.adminUserId },
      ),
      200,
      "delete admin program",
    );
  });

  group("light reads", () => {
    expectStatus(
      getJson(`${config.baseUrl}/api/student/dashboard-all`, {
        student_id: config.studentId,
      }),
      200,
      "write-heavy dashboard",
    );
  });

  sleep(1);
}
