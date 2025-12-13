import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store/authSlice";
import taskReducer from "../features/task/store/taskSlice";
import toastReducer from "../features/toast/store/toastSlice";

/**
 * store - Redux 전역 상태 저장소
 *
 * Client 활용:
 * - 앱 전체의 상태를 한 곳에서 관리
 * - 모든 컴포넌트가 useSelector로 상태 읽기 가능
 * - dispatch로 상태 변경 가능
 *
 * 새 feature 추가 시 reducer에 추가 (예: task: taskReducer)
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    task: taskReducer,
    toast: toastReducer,
    // user: userReducer, (Phase 3에서 추가)
  },
});

/**
 * RootState - 전체 Redux 상태의 타입
 *
 * Client 활용:
 * - useSelector에서 타입 안전하게 상태 접근
 * - 예: useSelector((state: RootState) => state.auth.user)
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch - dispatch 함수의 타입
 *
 * Client 활용:
 * - useDispatch에 타입 적용하여 thunk 액션도 타입 안전하게 dispatch
 * - 예: const dispatch = useDispatch<AppDispatch>()
 */
export type AppDispatch = typeof store.dispatch;
