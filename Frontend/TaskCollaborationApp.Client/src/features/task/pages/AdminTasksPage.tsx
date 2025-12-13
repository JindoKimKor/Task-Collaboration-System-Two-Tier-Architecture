import { useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAppSelector } from "../../../app/hooks";
import { taskService } from "../services/taskService";
import { userService } from "../../user/services/userService";
import type { TaskResponseDto, TaskStatus } from "../types/api.types";
import type { UserListItemDto } from "../../user/types/api.types";

/**
 * AdminTasksPage - Admin 전용 모든 태스크 조회 페이지
 *
 * Client 활용:
 * - /admin/tasks 경로에서 렌더링
 * - Admin 역할만 접근 가능
 * - 테이블 뷰로 모든 태스크 표시 (아카이브 포함)
 * - 필터링, 검색, 페이지네이션 지원
 */
export const AdminTasksPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  // Local state for tasks and filters
  const [tasks, setTasks] = useState<TaskResponseDto[]>([]);
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Fetch users for assignee filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch tasks when filters or page change
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await taskService.getTasks({
          page,
          pageSize,
          status: statusFilter || undefined,
          assignedTo: assigneeFilter || undefined,
          search: searchQuery || undefined,
          includeArchived,
        });
        setTasks(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (err) {
        setError("Failed to fetch tasks");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [page, statusFilter, assigneeFilter, searchQuery, includeArchived]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, assigneeFilter, searchQuery, includeArchived]);

  // Clear all filters
  const handleClear = () => {
    setStatusFilter("");
    setAssigneeFilter("");
    setSearchQuery("");
    setIncludeArchived(false);
    setPage(1);
  };

  // Admin이 아니면 /board로 리다이렉트
  if (user?.role !== "Admin") {
    return <Navigate to="/board" replace />;
  }

  // Navigation helpers
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/login");
    window.location.reload();
  };

  // Status badge colors
  const getStatusColor = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      ToDo: "bg-gray-100 text-gray-700",
      Development: "bg-blue-100 text-blue-700",
      Review: "bg-yellow-100 text-yellow-700",
      Merge: "bg-purple-100 text-purple-700",
      Done: "bg-green-100 text-green-700",
    };
    return colors[status];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
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
              {user?.role === "Admin" && (
                <button
                  onClick={() => navigate("/admin/tasks")}
                  className={`px-3 py-1 text-sm rounded ${
                    isActive("/admin/tasks")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All Tasks (Admin)
                </button>
              )}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
          <span className="px-2 py-0.5 text-sm font-medium bg-gray-200 text-gray-700 rounded">
            {totalCount}
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TaskStatus | "")
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ToDo">To-Do</option>
              <option value="Development">Development</option>
              <option value="Review">Review</option>
              <option value="Merge">Merge</option>
              <option value="Done">Done</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) =>
                setAssigneeFilter(e.target.value ? Number(e.target.value) : "")
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Include Archived */}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Include Archived
            </label>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No tasks found
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`hover:bg-gray-50 ${
                          task.isArchived ? "opacity-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-500">
                          #{task.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {task.title}
                            </span>
                            {task.isArchived && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                Archived
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {task.assignedTo?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {task.createdBy.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(task.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(task.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/tasks/${task.id}`)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="View"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => navigate(`/tasks/${task.id}/edit`)}
                              className="p-1 text-gray-400 hover:text-yellow-600"
                              title="Edit"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
