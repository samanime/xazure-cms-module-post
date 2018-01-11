/* global modules */
import { formatTime, buildLink, toVueDateTimeFormat } from '../../utils';

const headers = new Headers();
headers.append('Content-Type', 'application/json');

export default async () => {
  const { apiPath } = modules.posts;
  const { apiPath: authApiPath } = modules.auth;

  return {
    async created() {
      await Promise.all([
        this.getPost(),
        this.getAuthors(),
        this.getUser(),
        this.getTypes(),
      ]);
      this.loaded = true;
    },
    data() {
      return {
        loaded: false,
        showConfirmDelete: false,
        user: { },
        authors: [],
        types: [],
        error: null,
        alert: null,
        id: this.$route.params.id,
        authorId: null,
        type: 'post',
        title: '',
        slug: '',
        content: '',
        publishTime: null,
        creationTime: new Date()
      };
    },
    computed: {
      post() {
        const { id: _id, authorId, type, title, slug, content, publishTime, creationTime } = this;
        return { _id, authorId, type, title, slug, content, publishTime, creationTime };
      },
      pointerEvents() {
        return this.showConfirmDelete ? 'auto' : 'none';
      },
      publishStatus() {
        return !this.publishTime ? 'Draft' : (new Date(this.publishTime) <= new Date() ? 'Published' : 'Scheduled');
      }
    },
    methods: {
      buildLink,
      formatTime,
      async getPost() {
        if (this.id) {
          const post = await (await fetch(`${apiPath}/id/${this.id}`)).json();
          const id = post._id;
          delete post._id;
          Object.assign(this, post, {
            id,
            publishTime: post.publishTime ? toVueDateTimeFormat(post.publishTime) : null,
            creationTime: post.creationTime ? toVueDateTimeFormat(post.creationTime) : null
          });
        }
      },
      async getUser() {
        this.user = await (await fetch(`${authApiPath}/user`, { method: 'GET', credentials: 'include' })).json();
        this.authorId = this.authorId || this.user._id;
      },
      async getAuthors() {
        this.authors = await (await fetch(`${authApiPath}/users/author`)).json();
      },
      async getTypes() {
        this.types = await (await fetch(`${apiPath}/types`)).json();
      },
      async onDelete() {
        this.showConfirmDelete = true;
        document.body.classList.add('modal-open');
      },
      async cancelDelete() {
        this.showConfirmDelete = false;
        document.body.classList.remove('modal-open');
      },
      async confirmDelete() {
        this.showConfirmDelete = false;
        document.body.classList.remove('modal-open');
        const status = (await fetch(`${apiPath}/${this.id}`, { method: 'DELETE' })).status;

        if (!/^2..$/.test(status)) {
          this.alert = null;
          this.error = `Failed to save. Server returned ${status}${error ? `: ${error}` : ''}`;
        } else {
          this.error = null;
          this.alert = `Post saved.`;
          this.$router.push({ path: '/posts' });
        }
      },
      afterEnter(el) {
        console.log(el);
        el.classList.add('show');
      },
      async onSubmit() {
        const response = await fetch(`${apiPath}${this.id ? `/${this.id}` : ''}`,
          { method: 'POST', body: JSON.stringify(this.post), headers });
        const { status } = response;

        try {
          const { error, postId } = await response.json();
          if (!/^2..$/.test(status)) {
            this.alert = null;
            this.error = `Failed to save. Server returned ${status}${error ? `: ${error}` : ''}`;
          } else {
            console.log('router');
            this.id = postId;
            this.$router.push({ path: `/posts/${this.id}` });
            this.error = null;
            this.alert = `Post saved.`;
          }
        } catch (e) { }
      }
    },
    watch: {
      async $route() {
        if (this.$route.params.id !== this.id) {
          this.getPost();
        }
      }
    },
    template: `
      <div class="post edit">
        <div class="alert alert-primary" v-if="alert">{{ alert }}</div>
        <div class="alert alert-danger" v-if="error">{{ error }}</div>
        <h1>{{ id ? 'Edit' : 'Create New' }} Post</h1>
        <div class="mb-3">
          Created: {{ id ? formatTime(creationTime) : 'Just now' }}
        </div>
        <form @submit.prevent="onSubmit">
          <div class="form-group mb-3">
            <label for="title">Title:</label>
            <input id="title" type="text" class="form-control form-control-lg" aria-label="Title" v-model="title">
          </div>
          <div class="form-group mb-3">
            <label for="slug">Slug: </label>
            <input id="slug" type="text" class="form-control" placeholder="Slug" aria-label="Slug" v-model="slug">
          </div>
          <div class="form-group mb-3">
            <label for="content">Content: </label>
            <textarea id="content" class="form-control" rows="10" placeholder="Content" aria-label="Content" v-model="content" />
          </div>
          <div class="form-group mb-3">
            <label for="publish-time">Publish Time: {{ publishStatus }}</label>
            <input id="publish-time" type="datetime-local" class="form-control" placeholder="Publish Time" aria-label="Publish Time" v-model="publishTime">
            <small class="form-text text-muted">Will be publicly visible once it's past the publish time. Set to current time to publish immediately.</small>
          </div>
          <div class="form-group mb-3">
            <label id="author">Author: </label>
            <select id="author" class="form-control" v-model="authorId">
              <option value="">-- Author --</option>
              <option v-for="{ displayName, _id } in authors" :value="_id">{{ displayName }}</option>
            </select>
          </div>
          <div class="form-group mb-4">
            <label id="type">Type: </label> 
            <select id="type" class="form-control" v-model="type">
              <option v-for="(display, type) in types" :value="type">{{ display }}</option>
            </select>          
          </div>
          <div class="row">
            <div class="col-md-8">
              <button class="btn btn-primary mr-1" type="submit">Save</button>
              <router-link class="btn btn-secondary" :to="buildLink('/')">Cancel</router-link>
            </div>
            <div v-if="id" class="col-md-4 d-flex">
              <button class="btn btn-danger my-auto ml-auto mr-0" type="button" @click="onDelete">Delete</button>            
            </div>
          </div>
        </form>
        <div class="modal fade d-block" :class="{ 'show': showConfirmDelete }" :style="{ 'pointer-events': pointerEvents }" @click.self="cancelDelete">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Are you sure?</h5>
                <button type="button" class="close" aria-label="Close" @click="cancelDelete">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <p>Are you sure you want to delete this post?</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" @click="confirmDelete">Yes, delete</button>
                <button type="button" class="btn btn-secondary" @click="cancelDelete">No, don't delete</button>
              </div>
            </div>
          </div>
        </div>
        <div :class="{ 'show': showConfirmDelete }" :style="{ 'pointer-events': pointerEvents }" class="modal-backdrop fade"></div>
      </div>
    `
  };
}