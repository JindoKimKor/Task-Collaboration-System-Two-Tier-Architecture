import { useAppSelector } from "../../../app/hooks";
import { ToastItem } from "./ToastItem";

/**
 * ToastContainer - Toast 목록을 렌더링하는 컨테이너
 *
 * Client 활용:
 * - App.tsx에서 렌더링
 * - 화면 우측 상단에 fixed 배치
 * - Redux store의 toasts 배열 순회
 */
export const ToastContainer = () => {
  const { toasts } = useAppSelector((state) => state.toast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
