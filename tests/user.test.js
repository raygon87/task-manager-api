const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const {userOneId, userOne, setupDatabase} = require('./fixtures/db');

beforeEach(setupDatabase)

test('Should signup a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'Ray',
    email: 'ray@example.com',
    password: 'mypass123'
  }).expect(201)

  // Assert tha the database was changed correctly.
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull()

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Ray',
      email: 'ray@example.com'
    },
    token: user.tokens[0].token
  });

  // Assertions if the password is hashed
  expect(user.password).not.toBe('mypass123')
})

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)

  const user = await User.findById(response.body.user._id);
  expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
  await request(app).post('/users/login').send({
    email: userOne.email,
    password: 'password123'
  }).expect(400)
})

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete account for user', async () => {
  const response = await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  
  const user = await User.findById(userOneId);
  expect(user).toBeNull()
})

test('Should not delete account for unathenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/myPhoto.jpg')
    .expect(200)
  
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should upadate valid user fields', async () => {
  const response = await request(app)
    .patch('/users/me')
    .send({name: 'John'})
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200)
  
  const user = await User.findById(userOneId);
  expect(user.name).toBe('John')
})

test('Should not upadate invalid user fields', async () => {
  const response = await request(app)
    .patch('/users/me')
    .send({location: 'Calgary'})
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(400)
})