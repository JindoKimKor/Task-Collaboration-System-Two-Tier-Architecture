import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../app/hooks";
import { googleLogin } from "../store/authThunks";

/**
 * GoogleSignInButton - Google 로그인 버튼 컴포넌트
 *
 * Client 활용:
 * - LoginPage에서 일반 로그인 폼 아래에 렌더링
 * - Google Sign-In 팝업을 통해 인증
 * - 성공 시 credential(ID Token)을 백엔드로 전송
 * - 로그인 성공 후 /board로 이동
 */
export const GoogleSignInButton = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /**
   * handleSuccess - Google 로그인 성공 시 호출
   *
   * @param credential - Google에서 받은 ID Token (JWT)
   */
  const handleSuccess = async (credential: string | undefined) => {
    if (!credential) {
      console.error("No credential received from Google");
      return;
    }

    try {
      await dispatch(googleLogin(credential)).unwrap();
      navigate("/board");
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  /**
   * handleError - Google 로그인 실패 시 호출
   */
  const handleError = () => {
    console.error("Google Sign-In failed");
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(response) => handleSuccess(response.credential)}
        onError={handleError}
      />
    </div>
  );
};
