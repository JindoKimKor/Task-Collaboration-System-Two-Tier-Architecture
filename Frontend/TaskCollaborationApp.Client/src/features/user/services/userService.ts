import api from "../../../services/api";
import type { UserListItemDto } from "../types/api.types";

/**
 * userService - User 관련 API 호출을 담당
 *
 * Client 활용:
 * - TaskForm에서 Assignee 드롭다운 데이터 로드
 * - 실제 HTTP 요청을 보내고 응답을 반환
 */
export const userService = {
  /**
   * getAllUsers - 전체 사용자 목록 조회
   *
   * Client 활용:
   * - TaskForm에서 컴포넌트 마운트 시 호출
   * - Assignee 드롭다운 옵션으로 사용
   *
   * @returns 사용자 목록 (id, name, initials)
   */
  getAllUsers: async (): Promise<UserListItemDto[]> => {
    const response = await api.get<UserListItemDto[]>("/users");
    return response.data;
  },
};
