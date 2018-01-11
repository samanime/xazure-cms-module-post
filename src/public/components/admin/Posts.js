/* global modules */
import { formatTime, buildLink } from '../../utils';

export default async () => {
  const { apiPath } = modules.posts;
  const { apiPath: authApiPath } = modules.auth;

  return {
    async created() {
      await Promise.all([
        this.getAuthors(),
        this.getPosts(),
        this.getTypes()
      ]);
      this.loaded = true;
    },
    data: () => ({
      posts: [],
      authors: [],
      types: [],
      loaded: false
    }),
    methods: {
      buildLink,
      formatTime,
      getAuthorById(id) {
        return this.authors.find(a => a._id === id).displayName;
      },
      getTypeDisplay(type) {
        return this.types[type];
      },
      async getTypes() {
        this.types = await (await fetch(`${apiPath}/types`)).json();
      },
      async getAuthors() {
        this.authors = await (await fetch(`${authApiPath}/users/author`)).json();
      },
      async getPosts() {
        this.posts = await (await fetch(`${apiPath}/posts`)).json();
      }
    },
    template: `
      <div class="post posts">
        <div class="row">
          <h1 class="col-md-10">Posts</h1>
          <div class="col-md-2 d-flex">
            <router-link class="btn btn-primary my-auto ml-auto mr-0" :to="buildLink('/new')">New Post</router-link>
          </div>
        </div>
        <div v-if="!loaded" class="row">
          Loading        
        </div>
        <div v-if="loaded" class="row">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Name</th>    
                <th scope="col">Type</th>        
                <th scope="col">Status</th>            
                <th scope="col">Publish Date</th>            
                <th scope="col">Creation Date</th>            
                <th scope="col">Author</th>            
              </tr>           
            </thead>
            <tbody>
                <tr v-for="{ title, type, slug, _id, authorId, publishTime, creationTime } in posts">
                  <td>
                    <router-link :to="buildLink('/' + _id)">{{title}}</router-link>
                  </td>
                  <td>{{ getTypeDisplay(type) }}</td>
                  <td>
                    <span v-if="!publishTime">Draft</span>
                    <span v-else-if="publishTime && new Date(publishTime) <= new Date()">Published</span>
                    <span v-else>Scheduled</span>                
                  </td>              
                  <td>{{ publishTime ? formatTime(publishTime) : '-' }}</td>
                  <td>{{ creationTime ? formatTime(creationTime) : '-' }}</td>
                  <td>{{ getAuthorById(authorId) }}</td>
                </tr>          
            </tbody>
          </table>
        </div>
      </div>
    `
  };
}