import { Router } from 'express';
import apiController from './api';

export default ({ a, module: { normalApiPath } }) => Router()
  .use(normalApiPath, apiController({ a }))
  .use(async (req, res, next) => {
    const { post } = await a('findPost', { req });
    post ? res.send(post) : next();
  });