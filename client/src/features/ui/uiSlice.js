import { createSlice } from '@reduxjs/toolkit';

let nextId = 0;

/** Small global slice for toast messages. */
const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare(message, tone = 'info') {
        return { payload: { id: ++nextId, message, tone } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
