import { Router } from 'express';
import { isEmptyObject } from 'xazure-cms-utils';
import { Schema } from "mongoose";

export default ({ a, module: { apiPath = '/api/post', path } }) => Router()
  .get(`${apiPath}/id/:id`, async (req, res) => {
    const { post } = await a('getPost', { postId: req.params.id });

    post ? res.send(post) : res.status(404).end();
  }).get(`${apiPath}/posts/:type?`, async (req, res) => {
    res.send((await a('getPosts', { req, type: req.params.type })).posts);
  }).get(`${apiPath}/types`, async (req, res) => {
    res.send((await a('getTypes', { req })).types);
  }).get(`${apiPath}/slug/:slug`, async (req, res) => {
    const { post } = await a('getPost', { slug: req.params.slug });

    post ? res.send(post) : res.status(404).end();
  }).post(`${apiPath}/:id?`, async (req, res) => {
    if (!req.header('Content-Type') || req.header('Content-Type') !== 'application/json') {
      res.status(400).send({ error: 'Content-Type must be application/json' });
    } else if (!req.body || isEmptyObject(req.body)) {
      res.status(400).send({ error: 'No post body provided.' });
    } else {
      const missing = ['title', 'content', 'type', 'slug', 'authorId'].filter(key => !req.body.hasOwnProperty(key));

      if (missing.length) {
        res.status(400).send({ error: `Missing required fields: ${missing.join(', ')}` });
      } else {
        const { saved, postId, error } = await a('savePost', { postId: req.params.id, post: req.body });
        saved ? res.status(req.params.id ? 204 : 201).send({ postId }) : res.status(500).send({ error });
      }
    }
  }).delete(`${apiPath}/:id`, async (req, res) => {
    const { deleted, error } = await a('deletePost', { postId: req.params.id });
    error ? res.status(500).send({ error }) : res.status(deleted ? 204 : 404).end();
  });