import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchTasks } from "../store/taskThunks";
import { KanbanBoard } from "../components/KanbanBoard";

/**
 * BoardPage - Kanban 보드 페이지 (Container)
 *
 * Client 활용:
 * - /board 경로에서 렌더링
 * - Redux store와 연결하여 데이터 관리
 * - 페이지 마운트 시 태스크 목록 조회
 *
 * Container Component 역할:
 * - Redux 연결 (useAppDispatch, useAppSelector)
 * - 데이터 fetch (useEffect에서 dispatch)
 * - 이벤트 핸들러 정의 (handleTaskClick)
 * - Presentational Component에 props 전달
 */
export const BoardPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state에서 task 데이터 가져오기
  const { tasks, loading, error } = useAppSelector((state) => state.task);

  // 현재 로그인한 사용자 정보 (헤더 표시용)
  const { user } = useAppSelector((state) => state.auth);

  /**
   * 페이지 마운트 시 태스크 목록 조회
   *
   * pageSize: 100 - Kanban은 전체 태스크를 한 번에 로드
   */
  useEffect(() => {
    dispatch(fetchTasks({ pageSize: 100 }));
  }, [dispatch]);

  /**
   * handleTaskClick - 태스크 카드 클릭 핸들러
   *
   * 태스크 상세 페이지로 이동 (Story #35에서 구현 예정)
   */
  const handleTaskClick = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  /**
   * handleLogout - 로그아웃 핸들러
   */
  const handleLogout = () => {
    // TODO: dispatch(logout()) 후 /login으로 이동
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/login");
    window.location.reload(); // Redux state 초기화
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
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
