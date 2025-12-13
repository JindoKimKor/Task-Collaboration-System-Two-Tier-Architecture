import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchTaskById, deleteTask } from "../store/taskThunks";
import { clearSelectedTask } from "../store/taskSlice";
import type { TaskStatus } from "../types/api.types";

/**
 * STATUS_COLORS - 상태별 배지 색상
 */
const STATUS_COLORS: Record<
  TaskStatus,
  { bg: string; text: string; label: string }
> = {
  ToDo: { bg: "#dfe1e6", text: "#5e6c84", label: "To Do" },
  Development: { bg: "#deebff", text: "#0052cc", label: "Development" },
  Review: { bg: "#fff0b3", text: "#ff991f", label: "Review" },
  Merge: { bg: "#eae6ff", text: "#6554c0", label: "Merge" },
  Done: { bg: "#e3fcef", text: "#00875a", label: "Done" },
};

/**
 * TaskDetailsPage - 태스크 상세 페이지 (Container)
 *
 * Client 활용:
 * - /tasks/:id 경로에서 렌더링
 * - Edit/Delete 버튼 (권한 있을 때만 표시)
 * - 삭제 확인 모달
 * - 캐시 상태 배지 표시 (Task #64)
 */
export const TaskDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTask, loading, error, cacheStatus } = useAppSelector(
    (state) => state.task
  );
  const { user } = useAppSelector((state) => state.auth);

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(Number(id)));
    }

    return () => {
      dispatch(clearSelectedTask());
    };
  }, [dispatch, id]);

  // 권한 체크 (Creator 또는 Admin)
  const canModify =
    user?.id === selectedTask?.createdBy.id || user?.role === "Admin";

  /**
   * handleDelete - 삭제 실행
   */
  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    const result = await dispatch(deleteTask(Number(id)));

    if (deleteTask.fulfilled.match(result)) {
      navigate("/board");
    } else {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // 로딩 상태
  if (loading && !selectedTask) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading task...</div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/board")}
          className="text-blue-600 hover:underline"
        >
          Back to Board
        </button>
      </div>
    );
  }

  if (!selectedTask) {
    return null;
  }

  const statusColor = STATUS_COLORS[selectedTask.status];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/board" className="hover:text-blue-600">
              Board
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Task #{selectedTask.id}</span>
            {/* Cache Status Badge (Task #64) */}
            {cacheStatus && (
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  cacheStatus === "HIT"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                Cache: {cacheStatus}
              </span>
            )}
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedTask.title}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedTask.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: statusColor.bg,
                  color: statusColor.text,
                }}
              >
                {statusColor.label}
              </span>
            </div>

            {/* Assignee Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Assignee
              </h3>
              {selectedTask.assignedTo ? (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium mr-2">
                    {selectedTask.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedTask.assignedTo.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedTask.assignedTo.email}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">Unassigned</span>
              )}
            </div>

            {/* Reporter Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Reporter
              </h3>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium mr-2">
                  {selectedTask.createdBy.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedTask.createdBy.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedTask.createdBy.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">
                    {new Date(selectedTask.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="text-gray-900">
                    {new Date(selectedTask.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                {/* Edit Button (권한 있을 때만) */}
                {canModify && (
                  <button
                    onClick={() => navigate(`/tasks/${id}/edit`)}
                    className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Edit Task
                  </button>
                )}

                {/* Delete Button (권한 있을 때만) */}
                {canModify && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Delete Task
                  </button>
                )}

                <button
                  onClick={() => navigate("/board")}
                  className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Back to Board
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Task
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedTask.title}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
