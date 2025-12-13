import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { fetchCurrentUser } from "./features/auth";
import { AppRouter } from "./router/AppRouter";
import { signalRService } from "./services/signalRService";
import {
  taskCreatedFromSignalR,
  taskUpdatedFromSignalR,
  taskDeletedFromSignalR,
} from "./features/task/store/taskSlice";

/**
 * App - 애플리케이션 루트 컴포넌트
 *
 * Client 활용:
 * - main.tsx의 Provider 내부에서 렌더링
 * - GoogleOAuthProvider로 Google Sign-In 기능 제공
 * - AppRouter를 통해 모든 페이지 라우팅 처리
 */
function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
  }, []);

  // SignalR connection lifecycle - 로그인 상태에 따라 연결/해제
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const connectSignalR = async () => {
      try {
        await signalRService.start();
        await signalRService.joinBoard();

        // Register global event handlers
        signalRService.onTaskCreated((data) => {
          dispatch(taskCreatedFromSignalR(data.task));
        });

        signalRService.onTaskUpdated((data) => {
          dispatch(taskUpdatedFromSignalR(data.task));
        });

        signalRService.onTaskDeleted((data) => {
          dispatch(taskDeletedFromSignalR(data.taskId));
        });
      } catch (error) {
        console.error("SignalR connection failed:", error);
      }
    };

    connectSignalR();

    // Cleanup on logout
    return () => {
      signalRService.offTaskCreated();
      signalRService.offTaskUpdated();
      signalRService.offTaskDeleted();

      const disconnectSignalR = async () => {
        try {
          await signalRService.leaveBoard();
          await signalRService.stop();
        } catch (error) {
          console.error("SignalR disconnect failed:", error);
        }
      };
      disconnectSignalR();
    };
  }, [isAuthenticated, dispatch]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppRouter />
    </GoogleOAuthProvider>
  );
}

export default App;
