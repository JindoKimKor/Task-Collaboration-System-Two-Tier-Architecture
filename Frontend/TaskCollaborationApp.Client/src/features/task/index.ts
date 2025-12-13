// ============================================
// Components (Task #34)
// ============================================

/**
 * TaskCard - 개별 태스크 카드 컴포넌트
 * Client 활용: TaskColumn에서 각 태스크 렌더링
 */
export { TaskCard } from "./components/TaskCard";

/**
 * TaskColumn - Kanban 컬럼 컴포넌트
 * Client 활용: KanbanBoard에서 각 상태별 컬럼 렌더링
 */
export { TaskColumn } from "./components/TaskColumn";

/**
 * KanbanBoard - Kanban 보드 컴포넌트
 * Client 활용: BoardPage에서 렌더링
 */
export { KanbanBoard } from "./components/KanbanBoard";

// ============================================
// Pages (Task #34, #36)
// ============================================

/**
 * BoardPage - Kanban 보드 페이지 (Container)
 * Client 활용: /board 경로에서 렌더링
 */
export { BoardPage } from "./pages/BoardPage";

/**
 * TaskDetailsPage - 태스크 상세 페이지 (Container)
 * Client 활용: /tasks/:id 경로에서 렌더링
 */
export { TaskDetailsPage } from "./pages/TaskDetailsPage";

// ============================================
// Store (Task #33)
// ============================================

/**
 * taskReducer - Redux store에 등록할 task reducer
 * Client 활용: app/store.ts에서 configureStore에 등록
 */
export { default as taskReducer } from "./store/taskSlice";

/**
 * fetchTasks - 태스크 목록 조회 async thunk
 * Client 활용: BoardPage에서 dispatch(fetchTasks())
 */
export { fetchTasks } from "./store/taskThunks";

/**
 * fetchTaskById - 단일 태스크 조회 async thunk
 * Client 활용: TaskDetailsPage에서 dispatch(fetchTaskById(id))
 */
export { fetchTaskById } from "./store/taskThunks";

/**
 * clearError - 에러 메시지 초기화 액션
 * Client 활용: 에러 발생 후 재시도 전
 */
export { clearError } from "./store/taskSlice";

/**
 * clearSelectedTask - 선택된 태스크 초기화 액션
 * Client 활용: TaskDetailsPage에서 나갈 때
 */
export { clearSelectedTask } from "./store/taskSlice";

// ============================================
// Services (Task #33)
// ============================================

/**
 * taskService - Task API 호출 서비스
 * Client 활용: 주로 taskSlice thunk에서 사용
 */
export { taskService } from "./services/taskService";

// ============================================
// Types (Task #33)
// ============================================

/**
 * API Types - API 요청/응답 관련 타입
 * Client 활용: taskService, taskSlice thunk, components
 */
export type {
  TaskStatus,
  UserSummaryDto,
  TaskResponseDto,
  TaskListResponseDto,
  TaskQueryParams,
} from "./types/api.types";

/**
 * State Types - Redux 상태 관련 타입
 * Client 활용: taskSlice, useAppSelector
 */
export type { TaskState } from "./types/state.types";
