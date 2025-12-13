import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";
import type { TaskResponseDto } from "../features/task/types/api.types";

/**
 * SignalR Service - 실시간 통신을 위한 SignalR 클라이언트
 *
 * Client 활용:
 * - BoardPage에서 실시간 태스크 업데이트 수신
 * - 연결/해제는 페이지 lifecycle에 맞춰 관리
 * - JWT 토큰으로 인증된 연결
 *
 * 사용 흐름:
 * 1. BoardPage mount → start() → joinBoard()
 * 2. 실시간 이벤트 수신 (on 메서드로 등록)
 * 3. BoardPage unmount → leaveBoard() → stop()
 */

const HUB_URL =
  import.meta.env.VITE_SIGNALR_URL || "https://localhost:5001/hubs/tasks";

let connection: HubConnection | null = null;

/**
 * getConnection - HubConnection 인스턴스 반환 (싱글톤)
 *
 * 연결이 없으면 새로 생성, 있으면 기존 반환
 */
const getConnection = (): HubConnection => {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();
  }
  return connection;
};

/**
 * start - SignalR 연결 시작
 *
 * BoardPage 진입 시 호출
 */
const start = async (): Promise<void> => {
  const conn = getConnection();

  if (conn.state === HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log("SignalR connected");
    } catch (error) {
      console.error("SignalR connection failed:", error);
      throw error;
    }
  }
};

/**
 * stop - SignalR 연결 종료
 *
 * BoardPage 떠날 때 호출
 */
const stop = async (): Promise<void> => {
  if (connection && connection.state === HubConnectionState.Connected) {
    try {
      await connection.stop();
      console.log("SignalR disconnected");
    } catch (error) {
      console.error("SignalR disconnect failed:", error);
    }
  }
};

/**
 * joinBoard - TaskBoard 그룹 참가
 *
 * 연결 후 호출하여 태스크 업데이트 수신 시작
 */
const joinBoard = async (): Promise<void> => {
  const conn = getConnection();

  if (conn.state === HubConnectionState.Connected) {
    try {
      await conn.invoke("JoinBoard");
      console.log("Joined TaskBoard group");
    } catch (error) {
      console.error("Failed to join board:", error);
      throw error;
    }
  }
};

/**
 * leaveBoard - TaskBoard 그룹 탈퇴
 *
 * 페이지 떠나기 전 호출
 */
const leaveBoard = async (): Promise<void> => {
  const conn = getConnection();

  if (conn.state === HubConnectionState.Connected) {
    try {
      await conn.invoke("LeaveBoard");
      console.log("Left TaskBoard group");
    } catch (error) {
      console.error("Failed to leave board:", error);
    }
  }
};

// ===== Event Handlers =====

/**
 * onTaskCreated - 태스크 생성 이벤트 리스너 등록
 */
const onTaskCreated = (
  callback: (data: { task: TaskResponseDto; createdBy: string }) => void
): void => {
  getConnection().on("TaskCreated", callback);
};

/**
 * onTaskUpdated - 태스크 수정 이벤트 리스너 등록
 */
const onTaskUpdated = (
  callback: (data: { task: TaskResponseDto }) => void
): void => {
  getConnection().on("TaskUpdated", callback);
};

/**
 * onTaskDeleted - 태스크 삭제 이벤트 리스너 등록
 */
const onTaskDeleted = (callback: (data: { taskId: number }) => void): void => {
  getConnection().on("TaskDeleted", callback);
};

/**
 * onTaskAssigned - 태스크 할당 이벤트 리스너 등록
 */
const onTaskAssigned = (
  callback: (data: { task: TaskResponseDto; assignedToUserId: number }) => void
): void => {
  getConnection().on("TaskAssigned", callback);
};

// ===== Event Handler Cleanup =====

/**
 * offTaskCreated - 태스크 생성 이벤트 리스너 해제
 */
const offTaskCreated = (): void => {
  getConnection().off("TaskCreated");
};

/**
 * offTaskUpdated - 태스크 수정 이벤트 리스너 해제
 */
const offTaskUpdated = (): void => {
  getConnection().off("TaskUpdated");
};

/**
 * offTaskDeleted - 태스크 삭제 이벤트 리스너 해제
 */
const offTaskDeleted = (): void => {
  getConnection().off("TaskDeleted");
};

/**
 * offTaskAssigned - 태스크 할당 이벤트 리스너 해제
 */
const offTaskAssigned = (): void => {
  getConnection().off("TaskAssigned");
};

export const signalRService = {
  getConnection,
  start,
  stop,
  joinBoard,
  leaveBoard,
  // Event handlers
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskAssigned,
  // Event cleanup
  offTaskCreated,
  offTaskUpdated,
  offTaskDeleted,
  offTaskAssigned,
};
