import { Schema } from 'mongoose';
import Post from './models/Post';
import { findModule } from 'xazure-cms-utils';
import { normalizePostTypes } from './utils';

export const MODEL_POST = 'Post';

const defaultPostTypes = {
  post: { name: 'Post', path: '/post' },
  page: { name: 'Page', path: '/' }
};

export default ({ config: { modules }, module: { publicPath, postTypes }, a, mongoose }) => ({
  init: async previous => {
    await previous;
    const { name, model } = await a('createModel',
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
    return Object.assign(args, { types: Object.assign(types, normalizePostTypes(postTypes || defaultPostTypes)) });
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
  getScripts: async previous => {
    const args = await previous;
    const { scripts = [], req } = args;

    return Object.assign(args, { scripts: scripts.concat(Object.assign(`${publicPath}/index.js`, { module: true })) });
  },
  getStyles: async previous => {
    const args = await previous;
    const { styles = [], req } = args;

    return Object.assign(args, { scripts: styles.concat(Object.assign(`${publicPath}/index.css`, { module: true })) });
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
  findPost: async previous => {
    const args = await previous;
    const { url } = args;
    const { types } = await a('getTypes');
    const [type, { path } = {}] = Object.entries(types).filter(([, { path }]) => (new RegExp(`^${path}`)).test(url))
      .sort(([, { path: a }], [, { path: b }]) => b.length - a.length);

    if (type) {
      const slug = url.replace(new RegExp(`^${path}\/`), '');
      const post = await mongoose.model(MODEL_POST).findOne({ slug, type });

      if (post) {
        return Object.assign(args, { post: await a('getPost', { post }) });
      }
    }

    return Object.assign(args);
  },
  getPost: async previous => {
    const args = await previous;
    const { postId: _id, slug, post, req } = args;

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