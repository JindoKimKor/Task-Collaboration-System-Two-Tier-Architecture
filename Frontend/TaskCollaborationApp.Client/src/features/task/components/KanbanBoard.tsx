import { TaskColumn } from "./TaskColumn";
import type { TaskStatus, TaskResponseDto } from "../types/api.types";

/**
 * STATUSES - Kanban 컬럼 순서 정의
 *
 * 이 순서대로 컬럼이 렌더링됨
 */
const STATUSES: TaskStatus[] = [
  "ToDo",
  "Development",
  "Review",
  "Merge",
  "Done",
];

/**
 * KanbanBoardProps - KanbanBoard 컴포넌트 props
 */
interface KanbanBoardProps {
  /** 전체 태스크 목록 */
  tasks: TaskResponseDto[];
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 태스크 카드 클릭 시 호출되는 콜백 */
  onTaskClick: (taskId: number) => void;
}

/**
 * KanbanBoard - Kanban 보드 컴포넌트
 *
 * Client 활용:
 * - BoardPage에서 렌더링
 * - 태스크를 상태별로 그룹화하여 5개 컬럼으로 표시
 *
 * 구조:
 * - 5개 컬럼: ToDo → Development → Review → Merge → Done
 * - 각 컬럼에 해당 상태의 태스크 표시
 *
 * Presentational Component:
 * - Redux 연결 없음
 * - 모든 데이터/핸들러는 props로 받음
 */
export const KanbanBoard = ({
  tasks,
  loading,
  error,
  onTaskClick,
}: KanbanBoardProps) => {
  /**
   * groupTasksByStatus - 태스크를 상태별로 그룹화
   *
   * Input: [task1, task2, task3, ...]
   * Output: { ToDo: [...], Development: [...], ... }
   */
  const groupTasksByStatus = (
    tasks: TaskResponseDto[]
  ): Record<TaskStatus, TaskResponseDto[]> => {
    const grouped: Record<TaskStatus, TaskResponseDto[]> = {
      ToDo: [],
      Development: [],
      Review: [],
      Merge: [],
      Done: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const groupedTasks = groupTasksByStatus(tasks || []);

  return (
    <div className="flex gap-4 overflow-x-auto p-4 min-h-[calc(100vh-120px)]">
      {STATUSES.map((status) => (
        <TaskColumn
          key={status}
          status={status}
          tasks={groupedTasks[status]}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
};
