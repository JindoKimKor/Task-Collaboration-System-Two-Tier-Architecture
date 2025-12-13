import { TaskCard } from "./TaskCard";
import type { TaskStatus, TaskResponseDto } from "../types/api.types";

/**
 * COLUMN_COLORS - 상태별 컬럼 색상 정의
 *
 * 요구사항에서 지정된 색상:
 * - header: 컬럼 헤더 배경색
 * - text: 컬럼 헤더 텍스트 색상
 * - label: 사용자에게 표시할 상태 이름
 */
const COLUMN_COLORS: Record<
  TaskStatus,
  { header: string; text: string; label: string }
> = {
  ToDo: { header: "#dfe1e6", text: "#5e6c84", label: "To Do" },
  Development: { header: "#deebff", text: "#0052cc", label: "Development" },
  Review: { header: "#fff0b3", text: "#ff991f", label: "Review" },
  Merge: { header: "#eae6ff", text: "#6554c0", label: "Merge" },
  Done: { header: "#e3fcef", text: "#00875a", label: "Done" },
};

/**
 * TaskColumnProps - TaskColumn 컴포넌트 props
 */
interface TaskColumnProps {
  /** 컬럼의 상태 (ToDo, Development, etc.) */
  status: TaskStatus;
  /** 이 컬럼에 표시할 태스크 목록 */
  tasks: TaskResponseDto[];
  /** 태스크 카드 클릭 시 호출되는 콜백 */
  onTaskClick: (taskId: number) => void;
}

/**
 * TaskColumn - Kanban 보드의 단일 컬럼 컴포넌트
 *
 * Client 활용:
 * - KanbanBoard에서 각 상태별로 렌더링
 * - 색상 코딩으로 상태 구분
 * - 태스크 개수 배지 표시
 *
 * 구조:
 * - Header: 상태 이름 + 태스크 개수
 * - Body: TaskCard 목록 (스크롤 가능)
 */
export const TaskColumn = ({ status, tasks, onTaskClick }: TaskColumnProps) => {
  const colors = COLUMN_COLORS[status];

  return (
    <div className="flex flex-col bg-gray-50 rounded-lg min-w-[280px] max-w-[280px]">
      {/* Column Header */}
      <div
        className="px-3 py-2 rounded-t-lg flex items-center justify-between"
        style={{ backgroundColor: colors.header }}
      >
        <span className="font-semibold text-sm" style={{ color: colors.text }}>
          {colors.label}
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: colors.text, color: "white" }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
          />
        ))}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-4">No tasks</div>
        )}
      </div>
    </div>
  );
};
