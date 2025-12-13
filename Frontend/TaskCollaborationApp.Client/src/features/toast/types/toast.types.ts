// ============================================
// Toast State Types (Task #58)
// ============================================

/**
 * ToastType - Toast 알림의 종류
 *
 * Client 활용:
 * - success: Task 생성 성공 등 (#00875a)
 * - info: Task 업데이트, 할당 등 (#0052cc)
 * - warning: Task 삭제 등 (#ff991f)
 * - error: 오류 발생 시 (#de350b)
 */
export type ToastType = "success" | "info" | "warning" | "error";

/**
 * Toast - 개별 Toast 알림 데이터
 *
 * Client 활용:
 * - ToastItem 컴포넌트에서 렌더링
 * - id로 개별 Toast 식별 및 삭제
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

/**
 * ToastState - Redux store에서 관리하는 Toast 상태
 *
 * Client 활용:
 * - ToastContainer에서 toasts 배열 순회하여 렌더링
 * - addToast로 새 알림 추가, removeToast로 삭제
 */
export interface ToastState {
  toasts: Toast[];
}
