import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchTaskById, updateTask } from "../store/taskThunks";
import { clearSelectedTask, clearError } from "../store/taskSlice";
import { TaskForm } from "../components/TaskForm";
import type { TaskFormData } from "../components/TaskForm";

/**
 * EditTaskPage - 태스크 수정 페이지 (Container)
 *
 * Client 활용:
 * - /tasks/:id/edit 경로에서 렌더링
 * - 기존 태스크 데이터를 불러와 TaskForm에 전달
 * - 성공 시 /tasks/:id로 리다이렉트
 *
 * 데이터 흐름:
 * 1. 페이지 마운트 시 fetchTaskById(id)
 * 2. selectedTask로 폼 초기화
 * 3. onSubmit → dispatch(updateTask({ id, data }))
 * 4. fulfilled → navigate("/tasks/:id")
 * 5. rejected → 에러 메시지 표시 (403 등)
 */
export const EditTaskPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTask, loading, error } = useAppSelector(
    (state) => state.task
  );
  const { user } = useAppSelector((state) => state.auth);

  // 태스크 데이터 로드
  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(Number(id)));
    }

    return () => {
      dispatch(clearSelectedTask());
    };
  }, [dispatch, id]);

  /**
   * handleSubmit - 폼 제출 핸들러
   */
  const handleSubmit = async (data: TaskFormData) => {
    if (!id) return;

    dispatch(clearError());

    const result = await dispatch(
      updateTask({
        id: Number(id),
        data: {
          title: data.title,
          description: data.description || null,
          status: data.status,
          assignedToId: data.assignedToId,
        },
      })
    );

    // 성공 시 상세 페이지로 이동
    if (updateTask.fulfilled.match(result)) {
      navigate(`/tasks/${id}`);
    }
  };

  /**
   * handleCancel - 취소 핸들러
   */
  const handleCancel = () => {
    navigate(`/tasks/${id}`);
  };

  // 로딩 상태
  if (loading && !selectedTask) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading task...</div>
      </div>
    );
  }

  // 태스크 없음 (404)
  if (!selectedTask && !loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">Task not found</div>
        <button
          onClick={() => navigate("/board")}
          className="text-blue-600 hover:underline"
        >
          Back to Board
        </button>
      </div>
    );
  }

  // 권한 체크 (Creator 또는 Admin만 수정 가능)
  const canEdit =
    user?.id === selectedTask?.createdBy.id || user?.role === "Admin";

  if (!canEdit && selectedTask) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">
          You are not authorized to edit this task
        </div>
        <button
          onClick={() => navigate(`/tasks/${id}`)}
          className="text-blue-600 hover:underline"
        >
          Back to Task
        </button>
      </div>
    );
  }

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
            <Link to={`/tasks/${id}`} className="hover:text-blue-600">
              Task #{id}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Edit</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
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

          {/* Task Form with initial values */}
          {selectedTask && (
            <TaskForm
              initialValues={{
                title: selectedTask.title,
                description: selectedTask.description || "",
                status: selectedTask.status,
                assignedToId: selectedTask.assignedTo?.id || null,
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={loading}
              submitLabel="Save Changes"
            />
          )}
        </div>
      </main>
    </div>
  );
};
