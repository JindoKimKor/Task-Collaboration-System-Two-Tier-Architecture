import { createAsyncThunk } from "@reduxjs/toolkit";
import { taskService } from "../services/taskService";
import type {
  TaskQueryParams,
  CreateTaskRequestDto,
  UpdateTaskRequestDto,
} from "../types/api.types";

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

/**
 * createTask - 새 태스크 생성 비동기 액션
 *
 * Client 활용:
 * - CreateTaskPage에서 dispatch(createTask(data)) 호출
 * - pending: 로딩 스피너 표시
 * - fulfilled: /board로 리다이렉트
 * - rejected: 에러 메시지 표시
 *
 * 언제 호출되는가:
 * - CreateTaskPage에서 폼 제출 시
 */
export const createTask = createAsyncThunk(
  "task/createTask",
  async (data: CreateTaskRequestDto, { rejectWithValue }) => {
    try {
      const response = await taskService.createTask(data);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to create task"
        );
      }
      return rejectWithValue("Failed to create task");
    }
  }
);

/**
 * updateTask - 태스크 수정 비동기 액션
 *
 * Client 활용:
 * - EditTaskPage에서 dispatch(updateTask({ id, data })) 호출
 * - pending: 로딩 스피너 표시
 * - fulfilled: /tasks/:id로 리다이렉트
 * - rejected: 에러 메시지 표시 (403 권한 없음 등)
 *
 * 언제 호출되는가:
 * - EditTaskPage에서 폼 제출 시
 */
export const updateTask = createAsyncThunk(
  "task/updateTask",
  async (
    { id, data }: { id: number; data: UpdateTaskRequestDto },
    { rejectWithValue }
  ) => {
    try {
      const response = await taskService.updateTask(id, data);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        if (axiosError.response?.status === 403) {
          return rejectWithValue("You are not authorized to edit this task");
        }
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to update task"
        );
      }
      return rejectWithValue("Failed to update task");
    }
  }
);

/**
 * deleteTask - 태스크 삭제 비동기 액션
 *
 * Client 활용:
 * - TaskDetailsPage에서 dispatch(deleteTask(id)) 호출
 * - pending: 삭제 버튼 로딩 상태
 * - fulfilled: /board로 리다이렉트
 * - rejected: 에러 메시지 표시 (403 권한 없음 등)
 *
 * 언제 호출되는가:
 * - TaskDetailsPage에서 삭제 확인 후
 */
export const deleteTask = createAsyncThunk(
  "task/deleteTask",
  async (id: number, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(id);
      return id; // 삭제된 ID 반환 (tasks 배열에서 제거용)
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        if (axiosError.response?.status === 403) {
          return rejectWithValue("You are not authorized to delete this task");
        }
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to delete task"
        );
      }
      return rejectWithValue("Failed to delete task");
    }
  }
);

/**
 * fetchMyTasks - 내가 생성한 태스크 조회 비동기 액션
 *
 * Client 활용:
 * - MyTasksPage에서 dispatch(fetchMyTasks()) 호출
 * - pending: 로딩 스피너 표시
 * - fulfilled: Kanban 보드에 내가 생성한 태스크만 표시
 * - rejected: 에러 메시지 표시
 *
 * 언제 호출되는가:
 * - MyTasksPage 마운트 시
 */
export const fetchMyTasks = createAsyncThunk(
  "task/fetchMyTasks",
  async (params: TaskQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await taskService.getMyTasks(params);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to load my tasks"
        );
      }
      return rejectWithValue("Failed to load my tasks");
    }
  }
);

/**
 * fetchAssignedTasks - 나에게 할당된 태스크 조회 비동기 액션
 *
 * Client 활용:
 * - AssignedTasksPage에서 dispatch(fetchAssignedTasks()) 호출
 * - pending: 로딩 스피너 표시
 * - fulfilled: Kanban 보드에 나에게 할당된 태스크만 표시
 * - rejected: 에러 메시지 표시
 *
 * 언제 호출되는가:
 * - AssignedTasksPage 마운트 시
 */
export const fetchAssignedTasks = createAsyncThunk(
  "task/fetchAssignedTasks",
  async (params: TaskQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await taskService.getAssignedTasks(params);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to load assigned tasks"
        );
      }
      return rejectWithValue("Failed to load assigned tasks");
    }
  }
);
