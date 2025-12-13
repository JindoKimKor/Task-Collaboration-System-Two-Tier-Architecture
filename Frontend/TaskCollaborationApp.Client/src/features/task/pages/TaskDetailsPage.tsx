import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchTaskById } from "../store/taskThunks";
import { clearSelectedTask } from "../store/taskSlice";
import type { TaskStatus } from "../types/api.types";

/**
 * STATUS_COLORS - 상태별 배지 색상
 *
 * Client 활용:
 * - TaskDetailsPage에서 상태 배지 색상 표시
 * - TaskColumn의 COLUMN_COLORS와 동일한 색상 체계
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
 * - URL 파라미터에서 taskId 추출하여 데이터 로드
 * - Two-column layout: 왼쪽(제목, 설명) / 오른쪽(메타 정보)
 *
 * 데이터 흐름:
 * 1. useParams()로 id 추출
 * 2. dispatch(fetchTaskById(id))
 * 3. selectedTask에서 데이터 읽기
 * 4. unmount 시 clearSelectedTask()
 */
export const TaskDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTask, loading, error } = useAppSelector(
    (state) => state.task
  );

  // 데이터 로드
  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(Number(id)));
    }

    // Cleanup: 페이지 나갈 때 selectedTask 초기화
    return () => {
      dispatch(clearSelectedTask());
    };
  }, [dispatch, id]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading task...</div>
      </div>
    );
  }

  // 에러 상태 (404 포함)
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

  // Task 없음
  if (!selectedTask) {
    return null;
  }

  const statusColor = STATUS_COLORS[selectedTask.status];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/board" className="hover:text-blue-600">
              Board
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Task #{selectedTask.id}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedTask.title}
          </h1>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedTask.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3) */}
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

            {/* Actions Card (Edit/Delete - Future) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Actions
              </h3>
              <div className="space-y-2">
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
    </div>
  );
};
