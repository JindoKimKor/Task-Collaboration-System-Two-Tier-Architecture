import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import type { RootState, AppDispatch } from "./store";

/**
 * useAppDispatch - 타입이 적용된 dispatch 훅
 *
 * Client 활용:
 * - 컴포넌트에서 thunk 액션을 타입 안전하게 dispatch
 * - 예: const dispatch = useAppDispatch();
 *       dispatch(register(formData)); // thunk도 타입 안전
 *
 * Why: 매번 useDispatch<AppDispatch>() 작성 불필요
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * useAppSelector - 타입이 적용된 selector 훅
 *
 * Client 활용:
 * - 컴포넌트에서 Redux 상태를 타입 안전하게 읽기
 * - 예: const { user, loading } = useAppSelector(state => state.auth);
 *
 * Why: state 자동완성, 타입 에러 방지
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
