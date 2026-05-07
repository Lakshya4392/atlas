import request from 'supertest';
import app from '../index';

describe('Alta Daily API Tests', () => {
  it('should return health check status', async () => {
    const res = await request(app).get('/api/test');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should fail login with non-existent user', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nonexistent@example.com' });
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('success', false);
  });
});
