/* global modules, routeManager */
import Post from './components/Post';

routeManager.add({ path: '/post/:slug', component: Post });