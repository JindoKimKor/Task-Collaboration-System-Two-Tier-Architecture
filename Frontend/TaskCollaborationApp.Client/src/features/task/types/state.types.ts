import { type TaskResponseDto } from "./api.types";

/**
 * TaskState - Redux store에서 관리하는 Task 상태
 *
 * authSlice의 AuthState 패턴을 따름
 */
export interface TaskState {
  /** 현재 로드된 태스크 목록 */
  tasks: TaskResponseDto[];

  /** 상세 페이지에서 선택된 단일 태스크 */
  selectedTask: TaskResponseDto | null;

  /** 캐시 상태 (X-Cache 헤더 값) - TaskDetailsPage에서 배지 표시용 */
  cacheStatus: "HIT" | "MISS" | null;

  /** 전체 태스크 개수 (페이지네이션용) */
  totalCount: number;

  /** 현재 페이지 번호 */
  page: number;

  /** 페이지당 아이템 수 */
  pageSize: number;

  /** API 호출 중 로딩 상태 */
  loading: boolean;

  /** 에러 메시지 */
  error: string | null;
}
