import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, setToken, clearToken, getToken } from '../../api/client';

/**
 * Creates the account but deliberately does NOT start a session.
 * The token the server returns is ignored so the person lands on the
 * log in form and signs in with the credentials they just chose.
 */
export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    await api.post('/auth/register', payload);
    return payload.email;
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await api.post('/auth/login', payload);
    setToken(data.token);
    return data.user;
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

/** Runs once on page load to turn a stored token back into a session. */
export const loadSession = createAsyncThunk('auth/loadSession', async (_, { rejectWithValue }) => {
  if (!getToken()) return rejectWithValue(null);
  try {
    const { user } = await api.get('/auth/me');
    return user;
  } catch (e) {
    clearToken();
    return rejectWithValue(null);
  }
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { user } = await api.put('/users/profile', payload);
      return user;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    registeredEmail: null, // set after a successful sign up, consumed by AuthPage
    status: 'idle', // idle | loading | ready
    booted: false, // becomes true once loadSession has settled
    error: null,
  },
  reducers: {
    logout(state) {
      clearToken();
      state.user = null;
      state.status = 'idle';
    },
    clearError(state) {
      state.error = null;
    },
    clearRegistered(state) {
      state.registeredEmail = null;
    },
    /**
     * Bug fix: following someone changes YOUR following count.
     * The follow thunk dispatches this so the number on your own
     * profile updates immediately instead of staying stale.
     */
    setMyFollowingCount(state, action) {
      if (state.user) state.user.followingCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'loading';
      state.error = null;
    };
    const rejected = (state, action) => {
      state.status = 'idle';
      state.error = action.payload || null;
    };
    const fulfilled = (state, action) => {
      state.status = 'ready';
      state.user = action.payload;
      state.error = null;
    };

    builder
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = null;
        state.error = null;
        state.registeredEmail = action.payload;
      })
      .addCase(register.rejected, rejected)
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload || null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.booted = true;
      })
      .addCase(loadSession.rejected, (state) => {
        state.booted = true;
      });
  },
});

export const { logout, clearError, clearRegistered, setMyFollowingCount } = authSlice.actions;
export default authSlice.reducer;
