import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';

export const fetchFeed = createAsyncThunk('posts/fetchFeed', async (_, { rejectWithValue }) => {
  try {
    const { posts } = await api.get('/posts/feed');
    return posts;
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

export const fetchExplore = createAsyncThunk(
  'posts/fetchExplore',
  async (_, { rejectWithValue }) => {
    try {
      const { posts } = await api.get('/posts/explore');
      return posts;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchProfilePosts = createAsyncThunk(
  'posts/fetchProfilePosts',
  async (username, { rejectWithValue }) => {
    try {
      const { posts } = await api.get(`/users/${username}`);
      return posts;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ content, image }, { rejectWithValue }) => {
    try {
      const { post } = await api.post('/posts', { content, image });
      return post;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.del(`/posts/${postId}`);
      return postId;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId, { rejectWithValue }) => {
    try {
      const { isLiked, likesCount } = await api.post(`/posts/${postId}/like`);
      return { postId, isLiked, likesCount };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchComments = createAsyncThunk(
  'posts/fetchComments',
  async (postId, { rejectWithValue }) => {
    try {
      const { comments } = await api.get(`/posts/${postId}/comments`);
      return { postId, comments };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const { comment, commentCount } = await api.post(`/posts/${postId}/comments`, { text });
      return { postId, comment, commentCount };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      await api.del(`/posts/comments/${commentId}`);
      return { postId, commentId };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const initialState = {
  feed: [],
  explore: [],
  profile: [],
  comments: {}, // postId -> array of comments
  openThreads: {}, // postId -> bool
  status: { feed: 'idle', explore: 'idle', profile: 'idle' },
  error: null,
};

/** Applies a change to whichever lists contain that post. */
const updateEverywhere = (state, postId, patch) => {
  ['feed', 'explore', 'profile'].forEach((list) => {
    const post = state[list].find((p) => p._id === postId);
    if (post) Object.assign(post, patch);
  });
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    toggleThread(state, action) {
      const id = action.payload;
      state.openThreads[id] = !state.openThreads[id];
    },
    /** When you follow someone from Explore, their posts leave the discover list. */
    removeAuthorFromExplore(state, action) {
      state.explore = state.explore.filter((p) => p.author._id !== action.payload);
    },
    resetProfilePosts(state) {
      state.profile = [];
      state.status.profile = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (s) => {
        s.status.feed = 'loading';
      })
      .addCase(fetchFeed.fulfilled, (s, a) => {
        s.feed = a.payload;
        s.status.feed = 'ready';
      })
      .addCase(fetchFeed.rejected, (s, a) => {
        s.status.feed = 'error';
        s.error = a.payload;
      })

      .addCase(fetchExplore.pending, (s) => {
        s.status.explore = 'loading';
      })
      .addCase(fetchExplore.fulfilled, (s, a) => {
        s.explore = a.payload;
        s.status.explore = 'ready';
      })
      .addCase(fetchExplore.rejected, (s, a) => {
        s.status.explore = 'error';
        s.error = a.payload;
      })

      .addCase(fetchProfilePosts.pending, (s) => {
        s.status.profile = 'loading';
      })
      .addCase(fetchProfilePosts.fulfilled, (s, a) => {
        s.profile = a.payload;
        s.status.profile = 'ready';
      })
      .addCase(fetchProfilePosts.rejected, (s, a) => {
        s.status.profile = 'error';
        s.error = a.payload;
      })

      .addCase(createPost.fulfilled, (s, a) => {
        s.feed.unshift(a.payload);
        s.profile.unshift(a.payload);
      })

      .addCase(deletePost.fulfilled, (s, a) => {
        const id = a.payload;
        s.feed = s.feed.filter((p) => p._id !== id);
        s.explore = s.explore.filter((p) => p._id !== id);
        s.profile = s.profile.filter((p) => p._id !== id);
        delete s.comments[id];
        delete s.openThreads[id];
      })

      .addCase(toggleLike.fulfilled, (s, a) => {
        const { postId, isLiked, likesCount } = a.payload;
        updateEverywhere(s, postId, { isLiked, likesCount });
      })

      .addCase(fetchComments.fulfilled, (s, a) => {
        s.comments[a.payload.postId] = a.payload.comments;
      })

      .addCase(addComment.fulfilled, (s, a) => {
        const { postId, comment, commentCount } = a.payload;
        if (!s.comments[postId]) s.comments[postId] = [];
        s.comments[postId].push(comment);
        updateEverywhere(s, postId, { commentCount });
      })

      .addCase(deleteComment.fulfilled, (s, a) => {
        const { postId, commentId } = a.payload;
        s.comments[postId] = (s.comments[postId] || []).filter((c) => c._id !== commentId);
        const post =
          s.feed.find((p) => p._id === postId) ||
          s.explore.find((p) => p._id === postId) ||
          s.profile.find((p) => p._id === postId);
        if (post) updateEverywhere(s, postId, { commentCount: Math.max(0, post.commentCount - 1) });
      });
  },
});

export const { toggleThread, removeAuthorFromExplore, resetProfilePosts } = postsSlice.actions;
export default postsSlice.reducer;
