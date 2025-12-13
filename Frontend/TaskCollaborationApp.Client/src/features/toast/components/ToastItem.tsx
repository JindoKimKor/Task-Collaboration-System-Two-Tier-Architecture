import type { Toast } from "../types/toast.types";
import { useAppDispatch } from "../../../app/hooks";
import { removeToast } from "../store/toastSlice";

/**
 * Toast 타입별 배경색
 */
const toastColors: Record<Toast["type"], string> = {
  success: "#00875a",
  info: "#0052cc",
  warning: "#ff991f",
  error: "#de350b",
};

interface ToastItemProps {
  toast: Toast;
}

/**
 * ToastItem - 개별 Toast 알림 컴포넌트
 *
 * Client 활용:
 * - ToastContainer에서 각 Toast 렌더링
 * - X 버튼 클릭 시 해당 Toast 삭제
 */
export const ToastItem = ({ toast }: ToastItemProps) => {
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch(removeToast(toast.id));
  };

  return (
    <div
      style={{
        backgroundColor: toastColors[toast.type],
        color: "white",
        padding: "12px 16px",
        borderRadius: "4px",
        marginBottom: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minWidth: "300px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <span>{toast.message}</span>
      <button
        onClick={handleClose}
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: "18px",
          marginLeft: "12px",
          padding: "0 4px",
        }}
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
};
