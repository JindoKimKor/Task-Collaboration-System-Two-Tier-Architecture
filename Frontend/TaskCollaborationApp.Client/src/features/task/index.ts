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

/**
 * TaskForm - 태스크 생성/수정 폼 컴포넌트
 * Client 활용: CreateTaskPage, EditTaskPage에서 렌더링
 */
export { TaskForm } from "./components/TaskForm";

// ============================================
// Pages (Task #34, #35, #38, #39, #41)
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

/**
 * CreateTaskPage - 태스크 생성 페이지 (Container)
 * Client 활용: /tasks/new 경로에서 렌더링
 */
export { CreateTaskPage } from "./pages/CreateTaskPage";

/**
 * EditTaskPage - 태스크 수정 페이지 (Container)
 * Client 활용: /tasks/:id/edit 경로에서 렌더링
 */
export { EditTaskPage } from "./pages/EditTaskPage";

/**
 * MyTasksPage - 내가 생성한 태스크 페이지 (Container)
 * Client 활용: /tasks/my 경로에서 렌더링
 */
export { MyTasksPage } from "./pages/MyTasksPage";

/**
 * AssignedTasksPage - 나에게 할당된 태스크 페이지 (Container)
 * Client 활용: /tasks/assigned 경로에서 렌더링
 */
export { AssignedTasksPage } from "./pages/AssignedTasksPage";

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
 * createTask - 태스크 생성 async thunk
 * Client 활용: CreateTaskPage에서 dispatch(createTask(data))
 */
export { createTask } from "./store/taskThunks";

/**
 * updateTask - 태스크 수정 async thunk
 * Client 활용: EditTaskPage에서 dispatch(updateTask({ id, data }))
 */
export { updateTask } from "./store/taskThunks";

/**
 * deleteTask - 태스크 삭제 async thunk
 * Client 활용: TaskDetailsPage에서 dispatch(deleteTask(id))
 */
export { deleteTask } from "./store/taskThunks";

/**
 * fetchMyTasks - 내가 생성한 태스크 조회 async thunk
 * Client 활용: MyTasksPage에서 dispatch(fetchMyTasks())
 */
export { fetchMyTasks } from "./store/taskThunks";

/**
 * fetchAssignedTasks - 나에게 할당된 태스크 조회 async thunk
 * Client 활용: AssignedTasksPage에서 dispatch(fetchAssignedTasks())
 */
export { fetchAssignedTasks } from "./store/taskThunks";

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
  CreateTaskRequestDto,
  UpdateTaskRequestDto,
} from "./types/api.types";

/**
 * State Types - Redux 상태 관련 타입
 * Client 활용: taskSlice, useAppSelector
 */
export type { TaskState } from "./types/state.types";
