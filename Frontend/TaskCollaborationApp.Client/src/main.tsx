// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App.tsx";
import "./index.css";

/**
 * Provider - Redux store를 앱 전체에 주입
 *
 * Client 활용:
 * - Provider 하위의 모든 컴포넌트에서 useSelector, useDispatch 사용 가능
 * - store를 prop으로 전달하여 어떤 store를 사용할지 지정
 * - 앱 최상단에 위치해야 모든 컴포넌트가 접근 가능
 */
createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <Provider store={store}>
    <App />
  </Provider>
  // </StrictMode>
);
