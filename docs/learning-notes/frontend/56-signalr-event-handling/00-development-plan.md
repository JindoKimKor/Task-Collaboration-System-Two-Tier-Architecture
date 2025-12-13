# Task #56: SignalR Event Handling - Development Plan

## 개요
SignalR 이벤트를 Frontend에서 수신하여 Redux store를 실시간 업데이트하는 구현.

## 구현 범위

### 1. signalRService.ts 이벤트 핸들러 추가
- `onTaskCreated` - 태스크 생성 이벤트 리스너
- `onTaskUpdated` - 태스크 수정 이벤트 리스너
- `onTaskDeleted` - 태스크 삭제 이벤트 리스너
- `onTaskAssigned` - 태스크 할당 이벤트 리스너
- `off*` 메서드들 - 리스너 해제

### 2. taskSlice.ts SignalR Event Reducers
- `taskCreatedFromSignalR` - 실시간 태스크 추가 (중복 방지)
- `taskUpdatedFromSignalR` - 실시간 태스크 업데이트
- `taskDeletedFromSignalR` - 실시간 태스크 삭제

### 3. App.tsx SignalR Lifecycle 관리
- App-Level에서 SignalR 연결 관리
- `isAuthenticated` 기반 connect/disconnect
- 전역 이벤트 핸들러 등록

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/services/signalRService.ts` | 이벤트 핸들러 추가 |
| `src/features/task/store/taskSlice.ts` | SignalR reducers 추가 |
| `src/App.tsx` | SignalR lifecycle 관리 |
| `src/features/task/pages/BoardPage.tsx` | SignalR 코드 제거 (App으로 이동) |

## 핵심 구현 포인트

### camelCase 변환 이슈
C# anonymous object가 JSON 직렬화 시 camelCase로 변환:
```
Backend: new { Task = task } → JSON: { "task": {...} }
Frontend: data.task (소문자로 접근)
```

### App-Level Connection
- Page-Level: 페이지 이동 시 disconnect → 실시간 업데이트 누락
- App-Level: 로그인 동안 연결 유지 → 항상 실시간 업데이트 수신

## 의존성
- Task #51: Backend SignalR Hub
- Task #52: Frontend SignalR Service
- Task #54-55: Backend Notification Service
