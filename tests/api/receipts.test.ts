import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { __setTestOverrides } from "@/lib/container";
import { FakeReceiptRepository } from "../helpers/fake-receipt-repository";
import { FakeAIProvider } from "../helpers/fake-ai-provider";

import * as receiptsRoute from "@/app/api/receipts/route";
import * as receiptByIdRoute from "@/app/api/receipts/[id]/route";
import * as extractRoute from "@/app/api/receipts/extract/route";
import * as estimateRoute from "@/app/api/receipts/estimate/route";
import * as settingsRoute from "@/app/api/settings/route";

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  __setTestOverrides({
    aiProvider: new FakeAIProvider(),
    receiptRepository: new FakeReceiptRepository(),
  });
});

describe("GET/POST /api/receipts", () => {
  it("lists no receipts initially", async () => {
    const res = await receiptsRoute.GET(
      new NextRequest("http://localhost/api/receipts"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.receipts).toEqual([]);
  });

  it("rejects a create request missing required fields with the standard error shape", async () => {
    const res = await receiptsRoute.POST(
      jsonRequest("http://localhost/api/receipts", "POST", { store: "" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates a receipt and then lists it", async () => {
    const createRes = await receiptsRoute.POST(
      jsonRequest("http://localhost/api/receipts", "POST", {
        store: "Trader Joe's",
        date: "2026-03-15",
        items: [
          { name: "GF Bread", price: 6.49, isGlutenFree: true, regularPrice: 3.29 },
        ],
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.receipt.store).toBe("Trader Joe's");

    const listRes = await receiptsRoute.GET(
      new NextRequest("http://localhost/api/receipts?year=2026"),
    );
    const listed = await listRes.json();
    expect(listed.receipts).toHaveLength(1);
  });

  it("rejects a malformed JSON body", async () => {
    const req = new NextRequest("http://localhost/api/receipts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await receiptsRoute.POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_JSON");
  });
});

describe("DELETE /api/receipts/[id]", () => {
  it("deletes an existing receipt", async () => {
    const createRes = await receiptsRoute.POST(
      jsonRequest("http://localhost/api/receipts", "POST", {
        store: "Sprouts",
        date: "2026-01-05",
        items: [{ name: "GF Pasta", price: 4, isGlutenFree: true, regularPrice: 2 }],
      }),
    );
    const { receipt } = await createRes.json();

    const deleteRes = await receiptByIdRoute.DELETE(
      new NextRequest(`http://localhost/api/receipts/${receipt.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: receipt.id }) },
    );
    expect(deleteRes.status).toBe(200);
  });

  it("returns a 404 with the standard error shape for an unknown id", async () => {
    const res = await receiptByIdRoute.DELETE(
      new NextRequest("http://localhost/api/receipts/does-not-exist", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "does-not-exist" }) },
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("POST /api/receipts/extract", () => {
  it("rejects a request with no image field", async () => {
    const req = new NextRequest("http://localhost/api/receipts/extract", {
      method: "POST",
      body: new FormData(),
    });
    const res = await extractRoute.POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("MISSING_IMAGE");
  });

  it("rejects a non-image file", async () => {
    const formData = new FormData();
    formData.append("image", new File(["not an image"], "receipt.txt", { type: "text/plain" }));
    const req = new NextRequest("http://localhost/api/receipts/extract", {
      method: "POST",
      body: formData,
    });
    const res = await extractRoute.POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_IMAGE");
  });

  it("rejects a file over the 10MB limit", async () => {
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append("image", new File([big], "receipt.jpg", { type: "image/jpeg" }));
    const req = new NextRequest("http://localhost/api/receipts/extract", {
      method: "POST",
      body: formData,
    });
    const res = await extractRoute.POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_IMAGE");
    expect(body.error.message).toMatch(/10MB/);
  });

  it("returns extracted items for a valid image, using the mocked AIProvider", async () => {
    const formData = new FormData();
    formData.append("image", new File(["fake bytes"], "receipt.jpg", { type: "image/jpeg" }));
    const req = new NextRequest("http://localhost/api/receipts/extract", {
      method: "POST",
      body: formData,
    });
    const res = await extractRoute.POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([
      { name: "GF Sandwich Bread", price: 6.49, likelyGlutenFree: true },
    ]);
  });
});

describe("POST /api/receipts/estimate", () => {
  it("rejects an empty items array", async () => {
    const res = await estimateRoute.POST(
      jsonRequest("http://localhost/api/receipts/estimate", "POST", { items: [] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns estimates for valid items, using the mocked AIProvider", async () => {
    const res = await estimateRoute.POST(
      jsonRequest("http://localhost/api/receipts/estimate", "POST", {
        items: [{ name: "GF Bread", purchasedPrice: 6.49 }],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([
      { name: "GF Bread", estimatedRegularPrice: 3.49 },
    ]);
  });
});

describe("GET/PUT /api/settings", () => {
  it("returns 0 AGI for a year with no setting yet", async () => {
    const res = await settingsRoute.GET(
      new NextRequest("http://localhost/api/settings?year=2026"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ year: 2026, agi: 0 });
  });

  it("rejects a negative AGI", async () => {
    const res = await settingsRoute.PUT(
      jsonRequest("http://localhost/api/settings", "PUT", { year: 2026, agi: -100 }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("saves and then returns the AGI for a year", async () => {
    const putRes = await settingsRoute.PUT(
      jsonRequest("http://localhost/api/settings", "PUT", { year: 2026, agi: 60000 }),
    );
    expect(putRes.status).toBe(200);

    const getRes = await settingsRoute.GET(
      new NextRequest("http://localhost/api/settings?year=2026"),
    );
    const body = await getRes.json();
    expect(body).toEqual({ year: 2026, agi: 60000 });
  });
});
