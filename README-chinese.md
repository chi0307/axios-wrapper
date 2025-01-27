# Axios API Client with Type Checking

## 🌐 Languages

- [English Version](https://github.com/chi0307/axios-wrapper/blob/master/README.md)

## 目的

此套件的目標是透過使用 Axios 呼叫 API 時確保型別安全。與其依賴 `as T` 強制轉型，此套件在執行階段驗證回應結構，當 API 回傳錯誤資料時，能即時發現並避免錯誤的型別影響應用程式運行。藉由泛型與預定義方法，該套件能減少開發過程中的潛在錯誤，並避免執行階段的意外情況。

## 功能特色

- **型別安全的 API 呼叫**：執行階段驗證 API 回應結構，防止不正確型別使用。
- **充分利用泛型**：在開發階段提供強型別提示。
- **自定義驗證**：支援定義自訂驗證函式，或使用第三方工具如 [typia](https://typia.io/)。
- **預定義 API 方法**：透過 `GET`、`POST`、`PUT`、`PATCH` 和 `DELETE` 簡化 API 操作。
- **預設參數行為**：`Params`、`Query` 和 `Body` 預設為 `never`，強制開發者顯式定義型別。

---

## 安裝

```bash
pnpm install @chi0307/axios-wrapper
```

---

## 使用範例

### 建立 API 客戶端

```typescript
import { createApiClient } from '@chi0307/axios-wrapper'

const apiClient = createApiClient('http://localhost')
```

### 範例：定義型別與驗證器

#### 手動驗證器

```typescript
interface User {
  id: number
  name: string
}
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof data.id === 'number' &&
    'name' in data &&
    typeof data.name === 'string'
  )
}
function isUsers(data: unknown): data is User[] {
  return Array.isArray(data) && data.every(isUser)
}

// 使用範例
export const getUsers = apiClient.get('/users', isUsers)
export const getUser = apiClient.get<{ userId: string }, never, User>('/user/:userId', isUser)

const { data: users } = await getUsers() // 型別：User[] | null
const { data: user } = await getUser({ params: { userId: '123' } }) // 型別：User | null
```

#### 使用 Typia 進行驗證

```typescript
import typia from 'typia'

interface User {
  id: number
  name: string
}

export const getUsers = apiClient.get('/users', typia.createIs<User[]>())
export const getUser = apiClient.get<{ userId: string }, never, User>(
  '/user/:userId',
  typia.createIs<User>(),
)

const { data: users } = await getUsers() // 型別：User[] | null
const { data: user } = await getUser({ params: { userId: '123' } }) // 型別：User | null
```

---

## API 客戶端方法結構

### 方法簽名

```typescript
ApiClient.get<Params, Query, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.post<Params, Query, Body, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.put<Params, Query, Body, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.patch<Params, Query, Body, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.delete<Params, Query, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
```

### 預設參數行為

- **`Params`**、**`Query`** 和 **`Body`** 預設為 `never`。
- 如果需要參數，必須顯式定義，並同時帶入 `ReturnTyping`。
- 如果提供 `validateResponse`，`ReturnTyping` 會自動推論。
