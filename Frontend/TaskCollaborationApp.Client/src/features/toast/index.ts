// ============================================
// Store (Task #58)
// ============================================

/**
 * toastReducer - Redux store에 등록할 toast reducer
 * Client 활용: app/store.ts에서 configureStore에 등록
 */
export { default as toastReducer } from "./store/toastSlice";

/**
 * addToast - 새 Toast 알림 추가 액션
 * Client 활용: SignalR 이벤트 수신 시 dispatch(addToast({ type, message }))
 */
export { addToast } from "./store/toastSlice";

/**
 * removeToast - 개별 Toast 삭제 액션
 * Client 활용: ToastItem의 X 버튼 클릭 시 dispatch(removeToast(id))
 */
export { removeToast } from "./store/toastSlice";

/**
 * clearAllToasts - 모든 Toast 삭제 액션
 * Client 활용: "Clear All" 버튼 클릭 시 dispatch(clearAllToasts())
 */
export { clearAllToasts } from "./store/toastSlice";

// ============================================
// Components (Task #59)
// ============================================

/**
 * ToastContainer - Toast 목록 렌더링 컨테이너
 * Client 활용: App.tsx에서 렌더링
 */
export { ToastContainer } from "./components/ToastContainer";

/**
 * ToastItem - 개별 Toast 컴포넌트
 * Client 활용: ToastContainer 내부에서 사용
 */
export { ToastItem } from "./components/ToastItem";

// ============================================
// Types (Task #58)
// ============================================

/**
 * State Types - Redux 상태 관련 타입
 * Client 활용: toastSlice, useAppSelector, ToastContainer, ToastItem
 */
export type { Toast, ToastType, ToastState } from "./types/toast.types";
