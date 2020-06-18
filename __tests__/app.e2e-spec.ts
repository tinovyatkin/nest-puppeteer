import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './test-server/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/crawler/ (POST)', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/crawler')
      .send({ url: `http://localhost:${app.getHttpServer().address().port}/` })
      .expect(201);
    expect(body).toMatchInlineSnapshot(`
      Object {
        "content": "<html><head></head><body>Hello World!</body></html>",
      }
    `);
  }, 30000);
});
