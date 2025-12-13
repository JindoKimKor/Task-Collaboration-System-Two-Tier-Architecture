import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchMyTasks } from "../store/taskThunks";
import { KanbanBoard } from "../components/KanbanBoard";

/**
 * MyTasksPage - 내가 생성한 태스크 페이지 (Container)
 *
 * Client 활용:
 * - /tasks/my 경로에서 렌더링
 * - 현재 로그인 유저가 CreatedBy인 태스크만 표시
 *
 * Container Component 역할:
 * - Redux 연결 (useAppDispatch, useAppSelector)
 * - 데이터 fetch (fetchMyTasks)
 * - KanbanBoard에 props 전달
 */
export const MyTasksPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { tasks, loading, error } = useAppSelector((state) => state.task);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMyTasks({ pageSize: 100 }));
  }, [dispatch]);

  const handleTaskClick = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/login");
    window.location.reload();
  };

  // Navigation tab helper
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
            {/* Navigation Tabs */}
            <nav className="flex gap-1">
              <button
                onClick={() => navigate("/board")}
                className={`px-3 py-1 text-sm rounded ${
                  isActive("/board")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => navigate("/tasks/my")}
                className={`px-3 py-1 text-sm rounded ${
                  isActive("/tasks/my")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => navigate("/tasks/assigned")}
                className={`px-3 py-1 text-sm rounded ${
                  isActive("/tasks/assigned")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Assigned to Me
              </button>
            </nav>
            <button
              onClick={() => navigate("/tasks/new")}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              + Create Task
            </button>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                Welcome, {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main>
        <KanbanBoard
          tasks={tasks}
          loading={loading}
          error={error}
          onTaskClick={handleTaskClick}
        />
      </main>
    </div>
  );
};
