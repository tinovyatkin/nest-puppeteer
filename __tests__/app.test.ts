import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "./test-server/app.module.js";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("/ (GET)", async () => {
    const response = await request(app.getHttpServer()).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World!");
  });

  it("/crawler/ (POST)", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/crawler")
      .send({ url: `http://localhost:${app.getHttpServer().address().port}/` });

    expect(body.content).toBe("<html><head></head><body>Hello World!</body></html>");
  });

  it("/crawler/context (GET)", async () => {
    const { body } = await request(app.getHttpServer()).get("/crawler/context");
    expect(body.incognito).toBe(true);
  });
});
