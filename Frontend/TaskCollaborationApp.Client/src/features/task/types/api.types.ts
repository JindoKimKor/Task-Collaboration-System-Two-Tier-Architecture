/**
 * TaskStatus - 태스크 상태 (Kanban 컬럼)
 *
 * Backend TaskStatus enum과 1:1 매핑
 */
export type TaskStatus = "ToDo" | "Development" | "Review" | "Merge" | "Done";

/**
 * UserSummaryDto - 태스크에 포함되는 유저 요약 정보
 *
 * 전체 User 정보가 아닌 필요한 필드만 포함
 */
export interface UserSummaryDto {
  id: number;
  name: string;
  email: string;
}

/**
 * TaskResponseDto - 단일 태스크 응답
 *
 * GET /api/tasks/{id} 응답 형태
 */
export interface TaskResponseDto {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: UserSummaryDto;
  assignedTo: UserSummaryDto | null;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

/**
 * TaskListResponseDto - 페이지네이션된 태스크 목록 응답
 *
 * GET /api/tasks 응답 형태
 */
export interface TaskListResponseDto {
  data: TaskResponseDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * TaskQueryParams - 태스크 조회 시 필터 파라미터
 *
 * GET /api/tasks?status=ToDo&assignedTo=1&includeArchived=true 등
 */
export interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  assignedTo?: number;
  createdBy?: number;
  search?: string;
  includeArchived?: boolean;
}

/**
 * CreateTaskRequestDto - 태스크 생성 요청
 *
 * POST /api/tasks 요청 body
 */
export interface CreateTaskRequestDto {
  title: string;
  description?: string | null;
  status: TaskStatus;
  assignedToId?: number | null;
}

/**
 * UpdateTaskRequestDto - 태스크 수정 요청
 *
 * PUT /api/tasks/{id} 요청 body
 */
export interface UpdateTaskRequestDto {
  title: string;
  description?: string | null;
  status: TaskStatus;
  assignedToId?: number | null;
}
