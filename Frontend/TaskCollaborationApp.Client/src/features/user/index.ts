// ============================================
// Services (Task #49)
// ============================================

/**
 * userService - User API 호출 서비스
 * Client 활용: TaskForm에서 Assignee 드롭다운 데이터 로드
 */
export { userService } from "./services/userService";

// ============================================
// Types (Task #49)
// ============================================

/**
 * UserListItemDto - 사용자 목록 아이템 타입
 * Client 활용: userService 응답, TaskForm 드롭다운 옵션
 */
export type { UserListItemDto } from "./types/api.types";
