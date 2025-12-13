import { useState, useEffect } from "react";
import type { TaskStatus } from "../types/api.types";
import { userService } from "../../user";
import type { UserListItemDto } from "../../user";

/**
 * TASK_STATUSES - 폼에서 선택 가능한 상태 목록
 */
const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "ToDo", label: "To Do" },
  { value: "Development", label: "Development" },
  { value: "Review", label: "Review" },
  { value: "Merge", label: "Merge" },
  { value: "Done", label: "Done" },
];

/**
 * TaskFormData - 폼 데이터 타입
 */
export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  assignedToId: number | null;
}

/**
 * TaskFormProps - TaskForm 컴포넌트 props
 */
interface TaskFormProps {
  /** 초기값 (Edit 시 기존 데이터) */
  initialValues?: Partial<TaskFormData>;
  /** 폼 제출 핸들러 */
  onSubmit: (data: TaskFormData) => void;
  /** 취소 핸들러 */
  onCancel: () => void;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 제출 버튼 텍스트 */
  submitLabel: string;
}

/**
 * TaskForm - 태스크 생성/수정 공용 폼 컴포넌트
 *
 * Client 활용:
 * - CreateTaskPage: 빈 폼으로 새 태스크 생성
 * - EditTaskPage: 기존 데이터로 태스크 수정
 *
 * 재사용 가능한 Presentational Component
 */
export const TaskForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: TaskFormProps) => {
  // 폼 상태
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(
    initialValues?.description || ""
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialValues?.status || "ToDo"
  );
  const [assignedToId, setAssignedToId] = useState<number | null>(
    initialValues?.assignedToId || null
  );

  // 사용자 목록 상태
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await userService.getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

  // 유효성 검사 에러
  const [errors, setErrors] = useState<{ title?: string }>({});

  /**
   * handleSubmit - 폼 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 200) {
      newErrors.title = "Title cannot exceed 200 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 에러 초기화 후 제출
    setErrors({});
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      assignedToId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter task title"
          maxLength={200}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{title.length}/200</p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task description (optional)"
          maxLength={2000}
        />
        <p className="mt-1 text-xs text-gray-500">{description.length}/2000</p>
      </div>

      {/* Status */}
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee */}
      <div>
        <label
          htmlFor="assignedTo"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Assign to
        </label>
        <select
          id="assignedTo"
          value={assignedToId ?? ""}
          onChange={(e) =>
            setAssignedToId(e.target.value ? Number(e.target.value) : null)
          }
          disabled={usersLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.initials})
            </option>
          ))}
        </select>
        {usersLoading && (
          <p className="mt-1 text-xs text-gray-500">Loading users...</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};
