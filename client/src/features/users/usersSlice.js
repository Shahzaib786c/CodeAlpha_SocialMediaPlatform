import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { setMyFollowingCount } from '../auth/authSlice';
import { removeAuthorFromExplore } from '../posts/postsSlice';

export const fetchProfile = createAsyncThunk(
  'users/fetchProfile',
  async (username, { rejectWithValue }) => {
    try {
      const { profile } = await api.get(`/users/${username}`);
      return profile;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/search',
  async (query, { rejectWithValue }) => {
    try {
      const { users } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return users;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  'users/suggestions',
  async (_, { rejectWithValue }) => {
    try {
      const { users } = await api.get('/users/suggestions');
      return users;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchConnections = createAsyncThunk(
  'users/connections',
  async ({ username, kind }, { rejectWithValue }) => {
    try {
      const { users } = await api.get(`/users/${username}/${kind}`);
      return { kind, username, users };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

/**
 * Follow / unfollow.
 *
 * This is where the original bug lived. The old code wrote the TARGET's
 * follower count into whatever followers element was on screen — even when
 * you were looking at your own profile. Now the server returns both numbers
 * and each one is routed to the right place:
 *   followersCount   -> the profile being viewed, only if it IS the target
 *   myFollowingCount -> the logged-in user in authSlice
 */
export const toggleFollow = createAsyncThunk(
  'users/toggleFollow',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      dispatch(setMyFollowingCount(res.myFollowingCount));
      if (res.following) dispatch(removeAuthorFromExplore(userId));
      return { userId, ...res };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    profile: null,
    profileStatus: 'idle',
    search: [],
    searching: false,
    suggestions: [],
    connections: { open: false, kind: 'followers', users: [], loading: false },
    error: null,
  },
  reducers: {
    clearSearch(state) {
      state.search = [];
      state.searching = false;
    },
    openConnections(state, action) {
      state.connections = { open: true, kind: action.payload, users: [], loading: true };
    },
    closeConnections(state) {
      state.connections.open = false;
    },
    clearProfile(state) {
      state.profile = null;
      state.profileStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (s) => {
        s.profileStatus = 'loading';
        s.error = null;
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.profile = a.payload;
        s.profileStatus = 'ready';
      })
      .addCase(fetchProfile.rejected, (s, a) => {
        s.profileStatus = 'error';
        s.error = a.payload;
      })

      .addCase(searchUsers.pending, (s) => {
        s.searching = true;
      })
      .addCase(searchUsers.fulfilled, (s, a) => {
        s.search = a.payload;
        s.searching = false;
      })
      .addCase(searchUsers.rejected, (s) => {
        s.searching = false;
      })

      .addCase(fetchSuggestions.fulfilled, (s, a) => {
        s.suggestions = a.payload;
      })

      .addCase(fetchConnections.fulfilled, (s, a) => {
        s.connections.users = a.payload.users;
        s.connections.loading = false;
      })
      .addCase(fetchConnections.rejected, (s) => {
        s.connections.loading = false;
      })

      .addCase(toggleFollow.fulfilled, (s, a) => {
        const { userId, following, followersCount } = a.payload;

        // Only touch the viewed profile's follower count when that profile
        // is the person who was just followed.
        if (s.profile && s.profile._id === userId) {
          s.profile.isFollowing = following;
          s.profile.followersCount = followersCount;
        }

        const patch = (list) => {
          const u = list.find((x) => x._id === userId);
          if (u) {
            u.isFollowing = following;
            u.followersCount = followersCount;
          }
        };
        patch(s.search);
        patch(s.connections.users);

        // A followed person no longer belongs in "who to follow"
        s.suggestions = following
          ? s.suggestions.filter((u) => u._id !== userId)
          : s.suggestions;
      });
  },
});

export const { clearSearch, openConnections, closeConnections, clearProfile } = usersSlice.actions;
export default usersSlice.reducer;
