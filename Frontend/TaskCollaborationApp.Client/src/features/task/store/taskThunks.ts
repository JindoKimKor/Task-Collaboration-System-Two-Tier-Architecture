import { createAsyncThunk } from "@reduxjs/toolkit";
import { taskService } from "../services/taskService";
import type { TaskQueryParams } from "../types/api.types";

/**
 * fetchTasks - 태스크 목록 조회 비동기 액션
 *
 * Client 활용:
 * - BoardPage에서 dispatch(fetchTasks()) 호출
 * - pending: 로딩 스피너 표시
 * - fulfilled: Kanban 보드에 태스크 표시
 * - rejected: 에러 메시지 표시 ("Failed to load tasks" 등)
 *
 * 언제 호출되는가:
 * - BoardPage 마운트 시
 * - 필터 변경 시
 * - 태스크 생성/수정/삭제 후 리프레시
 */
export const fetchTasks = createAsyncThunk(
  "task/fetchTasks",
  async (params: TaskQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await taskService.getTasks(params);
      return response;
    } catch (error: unknown) {
      // 서버 에러 메시지 추출하여 반환
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to load tasks"
        );
      }
      return rejectWithValue("Failed to load tasks");
    }
  }
);

/**
 * fetchTaskById - 단일 태스크 조회 비동기 액션
 *
 * Client 활용:
 * - TaskDetailsPage에서 dispatch(fetchTaskById(id)) 호출
 * - pending: 로딩 스피너 표시
 * - fulfilled: 태스크 상세 정보 표시
 * - rejected: 에러 메시지 표시 ("Task not found" 등)
 *
 * 언제 호출되는가:
 * - TaskDetailsPage 마운트 시 (URL에서 id 추출)
 */
export const fetchTaskById = createAsyncThunk(
  "task/fetchTaskById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await taskService.getTaskById(id);
      return response;
    } catch (error: unknown) {
      // 서버 에러 메시지 추출하여 반환
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        if (axiosError.response?.status === 404) {
          return rejectWithValue("Task not found");
        }
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to load task"
        );
      }
      return rejectWithValue("Failed to load task");
    }
  }
);
