import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { createTask } from "../store/taskThunks";
import { clearError } from "../store/taskSlice";
import { TaskForm } from "../components/TaskForm";
import type { TaskFormData } from "../components/TaskForm";

/**
 * CreateTaskPage - 새 태스크 생성 페이지 (Container)
 *
 * Client 활용:
 * - /tasks/new 경로에서 렌더링
 * - TaskForm을 사용하여 새 태스크 생성
 * - 성공 시 /board로 리다이렉트
 *
 * 데이터 흐름:
 * 1. 사용자가 폼 작성
 * 2. onSubmit → dispatch(createTask(data))
 * 3. fulfilled → navigate("/board")
 * 4. rejected → 에러 메시지 표시
 */
export const CreateTaskPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.task);

  /**
   * handleSubmit - 폼 제출 핸들러
   */
  const handleSubmit = async (data: TaskFormData) => {
    // 이전 에러 초기화
    dispatch(clearError());

    const result = await dispatch(
      createTask({
        title: data.title,
        description: data.description || null,
        status: data.status,
        assignedToId: data.assignedToId,
      })
    );

    // 성공 시 보드로 이동
    if (createTask.fulfilled.match(result)) {
      navigate("/board");
    }
  };

  /**
   * handleCancel - 취소 핸들러
   */
  const handleCancel = () => {
    navigate("/board");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/board" className="hover:text-blue-600">
              Board
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Create Task</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Task Form */}
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
            submitLabel="Create Task"
          />
        </div>
      </main>
    </div>
  );
};
