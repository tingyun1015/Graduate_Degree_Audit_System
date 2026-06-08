import http from "k6/http";
import { check } from "k6";

export function jsonHeaders(extra = {}) {
  return {
    headers: {
      "Content-Type": "application/json",
      ...extra,
    },
  };
}

export function withQuery(path, params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return query ? `${path}?${query}` : path;
}

export function parseJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

export function expectStatus(response, expected, label) {
  return check(response, {
    [`${label} status is ${expected}`]: (r) => r.status === expected,
  });
}

export function expectAnyStatus(response, expectedStatuses, label) {
  return check(response, {
    [`${label} status is one of ${expectedStatuses.join("/")}`]: (r) =>
      expectedStatuses.includes(r.status),
  });
}

export function logUnexpectedResponse(response, expectedStatuses, label) {
  if (expectedStatuses.includes(response.status)) {
    return;
  }

  const body =
    typeof response.body === "string" && response.body.length > 0
      ? response.body
      : "<empty>";
  console.error(
    `${label} unexpected status=${response.status} body=${body}`,
  );
}

export function getJson(url, params = {}) {
  return http.get(withQuery(url, params));
}

export function postJson(url, payload, params = {}) {
  return http.post(
    withQuery(url, params),
    JSON.stringify(payload),
    jsonHeaders(),
  );
}

export function putJson(url, payload, params = {}) {
  return http.put(
    withQuery(url, params),
    JSON.stringify(payload),
    jsonHeaders(),
  );
}

export function deleteRequest(url, params = {}) {
  return http.del(withQuery(url, params));
}
