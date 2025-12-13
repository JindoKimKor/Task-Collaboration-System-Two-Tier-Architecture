import { createSlice } from "@reduxjs/toolkit";
import { fetchTasks, fetchTaskById } from "./taskThunks";
import type { TaskState } from "../types/state.types";

/**
 * initialState - 앱 시작 시 task 상태의 초기값
 *
 * Client 활용:
 * - 앱 로드 시 빈 태스크 목록으로 시작
 * - BoardPage에서 fetchTasks() 호출 후 데이터 로드
 */
const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  totalCount: 0,
  page: 1,
  pageSize: 100, // Kanban은 전체 로드
  loading: false,
  error: null,
};

/**
 * taskSlice - Task 상태 관리의 핵심
 *
 * Client 활용:
 * - reducers: 동기 액션 (clearError, clearSelectedTask)
 * - extraReducers: 비동기 액션의 상태 변화 처리 (pending/fulfilled/rejected)
 *
 * Slice vs Thunk:
 * - Slice: 상태 정의 + 상태 변경 방법 (순수 함수)
 * - Thunk: 비동기 작업 수행 (API 호출)
 */
const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    /**
     * clearError - 에러 메시지 초기화
     *
     * Client 활용:
     * - 에러 발생 후 재시도 전 에러 메시지 제거
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * clearSelectedTask - 선택된 태스크 초기화
     *
     * Client 활용:
     * - TaskDetailsPage에서 나갈 때 이전 태스크 정보 제거
     * - 다른 태스크 상세 페이지로 이동 시 이전 데이터 깜빡임 방지
     */
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // FetchTasks Thunk (Task #33)
      // ============================================
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.data;
        state.totalCount = action.payload.totalCount;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ============================================
      // FetchTaskById Thunk (Task #33)
      // ============================================
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.selectedTask = null;
      });
  },
});

export const { clearError, clearSelectedTask } = taskSlice.actions;
export default taskSlice.reducer;
