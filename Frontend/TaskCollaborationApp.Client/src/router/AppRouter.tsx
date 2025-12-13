import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { BoardPage } from "../features/task/pages/BoardPage";
import { TaskDetailsPage } from "../features/task/pages/TaskDetailsPage";
import { CreateTaskPage } from "../features/task/pages/CreateTaskPage";
import { EditTaskPage } from "../features/task/pages/EditTaskPage";
import { MyTasksPage } from "../features/task/pages/MyTasksPage";
import { AssignedTasksPage } from "../features/task/pages/AssignedTasksPage";
import { AdminTasksPage } from "../features/task/pages/AdminTasksPage";

/**
 * ProtectedRoute - 인증된 사용자만 접근 가능한 라우트
 *
 * Client 활용:
 * - 로그인하지 않은 사용자가 /board 접근 시 /login으로 리다이렉트
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * AppRouter - 앱 전체 라우팅 정의
 *
 * Client 활용:
 * - URL 경로에 따라 어떤 컴포넌트를 보여줄지 결정
 * - 새 페이지 추가 시 이 파일에 Route 추가
 *
 * 현재 라우트:
 * - /login: 로그인 페이지
 * - /register: 회원가입 페이지
 * - /board: Kanban 보드 (로그인 필요)
 * - /tasks/:id: 태스크 상세 페이지 (로그인 필요)  // 추가
 * - / : /board로 리다이렉트
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 회원가입 페이지 */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Kanban 보드 (Protected) */}
        <Route
          path="/board"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />

        {/* 태스크 생성 페이지 (Protected) */}
        <Route
          path="/tasks/new"
          element={
            <ProtectedRoute>
              <CreateTaskPage />
            </ProtectedRoute>
          }
        />

        {/* 내가 생성한 태스크 페이지 (Protected) */}
        <Route
          path="/tasks/my"
          element={
            <ProtectedRoute>
              <MyTasksPage />
            </ProtectedRoute>
          }
        />

        {/* 나에게 할당된 태스크 페이지 (Protected) */}
        <Route
          path="/tasks/assigned"
          element={
            <ProtectedRoute>
              <AssignedTasksPage />
            </ProtectedRoute>
          }
        />

        {/* 태스크 상세 페이지 (Protected) */}
        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute>
              <TaskDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* 태스크 수정 페이지 (Protected) */}
        <Route
          path="/tasks/:id/edit"
          element={
            <ProtectedRoute>
              <EditTaskPage />
            </ProtectedRoute>
          }
        />

        {/* Admin 전용 - 모든 태스크 (Protected) */}
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute>
              <AdminTasksPage />
            </ProtectedRoute>
          }
        />

        {/* 홈 - /board로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
