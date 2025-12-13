import api from "../../../services/api";
import type {
  TaskResponseDto,
  TaskListResponseDto,
  TaskQueryParams,
} from "../types/api.types";

/**
 * taskService - Task 관련 API 호출을 담당
 *
 * Client 활용:
 * - taskSlice의 createAsyncThunk에서 호출
 * - 실제 HTTP 요청을 보내고 응답을 반환
 * - 에러 처리는 호출하는 쪽(thunk)에서 담당
 */
export const taskService = {
  /**
   * getTasks - 태스크 목록 조회 (페이지네이션, 필터 지원)
   *
   * Client 활용:
   * - BoardPage에서 dispatch(fetchTasks()) 호출
   * - thunk가 이 함수를 호출하여 서버에 요청
   * - 성공 시 TaskListResponseDto 반환 → thunk가 Redux store 업데이트
   *
   * @param params - 필터 옵션 (status, assignedTo, search 등)
   */
  getTasks: async (params?: TaskQueryParams): Promise<TaskListResponseDto> => {
    const response = await api.get<TaskListResponseDto>("/tasks", { params });
    return response.data;
  },

  /**
   * getTaskById - 단일 태스크 조회
   *
   * Client 활용:
   * - TaskDetailsPage에서 dispatch(fetchTaskById(id)) 호출
   * - thunk가 이 함수를 호출하여 서버에 요청
   * - 성공 시 TaskResponseDto 반환 → thunk가 selectedTask 업데이트
   *
   * @param id - 조회할 태스크 ID
   */
  getTaskById: async (id: number): Promise<TaskResponseDto> => {
    const response = await api.get<TaskResponseDto>(`/tasks/${id}`);
    return response.data;
  },

  /**
   * getMyTasks - 내가 생성한 태스크 목록
   *
   * Client 활용:
   * - MyTasksPage에서 dispatch(fetchMyTasks()) 호출
   * - 현재 로그인 유저가 CreatedBy인 태스크만 조회
   *
   * @param params - 페이지네이션 옵션
   */
  getMyTasks: async (
    params?: TaskQueryParams
  ): Promise<TaskListResponseDto> => {
    const response = await api.get<TaskListResponseDto>("/tasks/my", {
      params,
    });
    return response.data;
  },

  /**
   * getAssignedTasks - 나에게 할당된 태스크 목록
   *
   * Client 활용:
   * - AssignedTasksPage에서 dispatch(fetchAssignedTasks()) 호출
   * - 현재 로그인 유저가 AssignedTo인 태스크만 조회
   *
   * @param params - 페이지네이션 옵션
   */
  getAssignedTasks: async (
    params?: TaskQueryParams
  ): Promise<TaskListResponseDto> => {
    const response = await api.get<TaskListResponseDto>("/tasks/assigned", {
      params,
    });
    return response.data;
  },
};
