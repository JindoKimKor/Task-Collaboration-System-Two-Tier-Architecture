import type { TaskResponseDto } from "../types/api.types";

/**
 * TaskCardProps - TaskCard 컴포넌트 props
 */
interface TaskCardProps {
  /** 표시할 태스크 데이터 */
  task: TaskResponseDto;
  /** 카드 클릭 시 호출되는 콜백 */
  onClick: () => void;
}

/**
 * TaskCard - 개별 태스크 카드 컴포넌트
 *
 * Client 활용:
 * - TaskColumn에서 각 태스크를 카드 형태로 렌더링
 * - 클릭 시 태스크 상세 페이지로 이동
 *
 * 표시 정보:
 * - Task ID (배지)
 * - Title
 * - Assignee (이니셜 아바타)
 */
export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  /**
   * getInitials - 이름에서 이니셜 추출
   *
   * 예: "John Doe" → "JD", "Alice" → "A"
   */
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer 
               hover:shadow-md hover:border-gray-300 transition-all duration-200
               ${task.isArchived ? "opacity-50" : ""}`}
    >
      {/* Task ID Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          #{task.id}
        </span>
        {task.isArchived && (
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            Archived
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Assignee Avatar */}
      {task.assignedTo && (
        <div className="flex items-center justify-end">
          <div
            className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs 
                       flex items-center justify-center font-medium"
            title={task.assignedTo.name}
          >
            {getInitials(task.assignedTo.name)}
          </div>
        </div>
      )}
    </div>
  );
};
