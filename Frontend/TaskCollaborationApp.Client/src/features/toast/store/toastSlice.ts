import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Toast, ToastState, ToastType } from "../types/toast.types";

/**
 * initialState - 앱 시작 시 toast 상태의 초기값
 *
 * Client 활용:
 * - 앱 로드 시 빈 toasts 배열로 시작
 * - SignalR 이벤트 수신 시 addToast로 알림 추가
 */
const initialState: ToastState = {
  toasts: [],
};

/**
 * toastSlice - Toast 상태 관리의 핵심
 *
 * Client 활용:
 * - addToast: 새 Toast 알림 추가
 * - removeToast: 개별 Toast 삭제 (X 버튼 클릭)
 * - clearAllToasts: 모든 Toast 삭제
 */
const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    /**
     * addToast - 새 Toast 알림 추가
     *
     * Client 활용:
     * - SignalR 이벤트 수신 시 dispatch(addToast({ type, message }))
     * - crypto.randomUUID()로 고유 ID 생성
     */
    addToast: (
      state,
      action: PayloadAction<{ type: ToastType; message: string }>
    ) => {
      const newToast: Toast = {
        id: crypto.randomUUID(),
        type: action.payload.type,
        message: action.payload.message,
        createdAt: Date.now(),
      };
      state.toasts.push(newToast);
    },

    /**
     * removeToast - 개별 Toast 삭제
     *
     * Client 활용:
     * - ToastItem의 X 버튼 클릭 시 dispatch(removeToast(id))
     */
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    /**
     * clearAllToasts - 모든 Toast 삭제
     *
     * Client 활용:
     * - "Clear All" 버튼 클릭 시 dispatch(clearAllToasts())
     */
    clearAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearAllToasts } = toastSlice.actions;
export default toastSlice.reducer;
