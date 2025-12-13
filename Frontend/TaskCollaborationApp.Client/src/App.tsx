import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { fetchCurrentUser } from "./features/auth";
import { AppRouter } from "./router/AppRouter";

/**
 * App - 애플리케이션 루트 컴포넌트
 *
 * Client 활용:
 * - main.tsx의 Provider 내부에서 렌더링
 * - AppRouter를 통해 모든 페이지 라우팅 처리
 */
function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
  }, []);

  return <AppRouter />;
}

export default App;
