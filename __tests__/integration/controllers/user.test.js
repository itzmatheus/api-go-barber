import request from 'supertest';
import app from '../../../src/app';

describe('User', () => {
  it('shound be able to register', async () => {
    const response = await request(app)
      .post('/barber/api/v1/users')
      .send({
        name: 'Teste Usuario',
        email: 'teste@live.com',
        password: '123456',
      });

    expect(response.body).toHaveProperty('id');
  });
});
