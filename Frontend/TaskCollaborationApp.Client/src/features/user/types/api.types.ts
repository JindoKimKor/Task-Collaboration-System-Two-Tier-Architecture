/**
 * UserListItemDto - 사용자 목록 아이템
 *
 * GET /api/users 응답의 배열 요소
 * Task 생성/수정 시 Assignee 드롭다운에서 사용
 */
export interface UserListItemDto {
  id: number;
  name: string;
  initials: string;
}
