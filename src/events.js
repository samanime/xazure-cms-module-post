import { Schema } from 'mongoose';
import Post from './models/Post';
import { findModule } from 'xazure-cms-utils';

export const MODEL_POST = 'Post';

export default ({ config: { modules }, module: { path, publicPath }, eventManager, mongoose }) => ({
  init: async previous => {
    await previous;
    const { name, model } = await eventManager.apply('createModel',
      { model: Object.assign({}, Post), name: MODEL_POST });

    mongoose.model(name, new Schema(model, {
      toObject: {
        transform: (doc, ret) => {
          delete ret.__v;
        }
      }
    }));
  },
  getTypes: async previous => {
    const args = await previous;
    const { types = {} } = args;
    return Object.assign(args, { types: Object.assign(types, {
      post: 'Post',
      page: 'Page'
    }) });
  },
  getAdminScripts: async previous => {
    const args = await previous;
    const { scripts = [], req } = args;

    return Object.assign(args, { scripts: scripts.concat(Object.assign(`${publicPath}/admin/index.js`, { module: true })) });
  },
  getAdminStyles: async previous => {
    const args = await previous;
    const { styles = [], req } = args;
    return Object.assign(args, { styles: styles.concat(`${publicPath}/admin/index.css`)})
  },
  getAdminNavItems: async previous => {
    const args = await previous;
    const { navItems = [], req } = args;

    return Object.assign(args, { navItems:
      navItems.concat({ display: 'Posts', url: `${findModule(modules, 'admin').path}/posts`.replace(/\/+/g, '/') })
    });
  },
  savePost: async previous => {
    try {
      const args = await previous;
      const { postId: _id, post } = args;
      const Post = mongoose.model(MODEL_POST);

      const result = await (_id ? Post.update({ _id }, post).exec() : new Post(post).save());
      return Object.assign(args, { saved: true, postId: _id ? _id : result._id });
    } catch (error) {
      return Object.assign(args, { saved: false, error });
    }
  },
  getPost: async previous => {
    const args = await previous;
    const { postId: _id, slug, post } = args;

    const mongoPost = (_id || slug)
      ? await mongoose.model(MODEL_POST).findOne(Object.assign({}, _id && { _id }, slug && { slug })) : null;

    return Object.assign(args, { post: (mongoPost || post)
      && Object.assign(mongoPost || {}, post || {}, mongoPost ? mongoPost.toObject() : {}) });
  },
  getPosts: async previous => {
    const args = await previous;
    const { posts = [], type } = args;

    return Object.assign(args, {
      posts: posts.concat(await mongoose.model(MODEL_POST).find(Object.assign({}, type && { type })))
    });
  },
  deletePost: async previous => {
    const args = await previous;
    const { postId: _id } = args;

    try {
      const post = await mongoose.model(MODEL_POST).findOne({ _id });

      if (post) {
        await post.remove();
      }

      return Object.assign(args, { deleted: !!post });
    } catch (error) {
      return Object.assign(args, { deleted: false, error });
    }
  }
});