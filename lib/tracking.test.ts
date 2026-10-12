import { beforeEach, expect, test } from "bun:test";
import { captureTrackingParams, readStoredParams } from "./tracking";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
  get length() { return this.data.size; }
  key() { return null; }
}

function install(search = "") {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const location = new URL(`https://book.stance.health/stance-health${search}`);
  Object.assign(globalThis, {
    window: { location, localStorage: local, sessionStorage: session },
    localStorage: local,
    sessionStorage: session,
    document: { referrer: "" },
  });
}

function seed(data: Record<string, string>) {
  window.localStorage.setItem("stance_tracking", JSON.stringify(data));
}

beforeEach(() => install());

test("google plus cta plus gclid is stored as cpc", () => {
  install("?utm_source=google&utm_medium=cta&gclid=gclid-1&utm_campaign=BD_SH_PMax_Blr");
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cpc");
  expect(stored.utm_source).toBe("google");
  expect(stored.utm_campaign).toBe("BD_SH_PMax_Blr");
  expect(stored.gclid).toBe("gclid-1");
});

test("a direct book click with no click id stays cta", () => {
  install("?utm_source=website&utm_medium=cta");
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cta");
  expect(stored.utm_source).toBe("website");
});

test("an incoming cpc stays cpc", () => {
  install("?utm_source=google&utm_medium=cpc&gclid=gclid-1");
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cpc");
  expect(stored.utm_source).toBe("google");
});

test("gbraid with cta and no source becomes cpc and google", () => {
  install("?utm_medium=cta&gbraid=gb-1");
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cpc");
  expect(stored.utm_source).toBe("google");
  expect(stored.gbraid).toBe("gb-1");
});

test("wbraid with cta becomes cpc", () => {
  install("?utm_medium=cta&utm_source=website&wbraid=wb-1");
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cpc");
  expect(stored.utm_source).toBe("google");
});

test("organic with no click id stays organic", () => {
  install("?utm_source=google&utm_medium=organic");
  captureTrackingParams();
  expect(readStoredParams().utm_medium).toBe("organic");
});

test("a later cta link does not erase a stored cpc", () => {
  install("?utm_source=website&utm_medium=cta");
  seed({ utm_source: "google", utm_medium: "cpc", utm_campaign: "BD_SH_PMax_Blr" });
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cpc");
  expect(stored.utm_source).toBe("google");
  expect(stored.utm_campaign).toBe("BD_SH_PMax_Blr");
});

test("a later website source does not erase a stored facebook source", () => {
  install("?utm_source=website&utm_medium=cta");
  seed({ utm_source: "facebook", utm_medium: "paid" });
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("paid");
  expect(stored.utm_source).toBe("facebook");
});

test("cta plus gclid corrects storage that had no medium yet", () => {
  install("?utm_medium=cta&gclid=gclid-1");
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cpc");
  expect(stored.utm_source).toBe("google");
});

test("a stored cta with no new params stays cta", () => {
  seed({ utm_source: "website", utm_medium: "cta" });
  captureTrackingParams();
  const stored = readStoredParams();
  expect(stored.utm_medium).toBe("cta");
  expect(stored.utm_source).toBe("website");
});
