/* global Vue, routeManager */
import Post from '../components/admin/Post';
import Posts from '../components/admin/Posts';

routeManager.add([
  { path: '/posts', component: Posts },
  { path: '/posts/new', component: Post },
  { path: '/posts/:id', component: Post }
]);