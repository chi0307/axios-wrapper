# Docs

## 目的

- 希望在使用 axios 呼叫 API 時，回傳的內容能經過型別檢查 (typing check)，而非單純透過 as T 的方式強制轉型，這樣可以在 API 回傳錯誤時，第一時間發現問題，避免被錯誤的型別影響到應用程式的運行。
- 透過提前封裝並定義好呼叫 API 的方法，減少開發過程中可能產生的錯誤，同時善用泛型 (Generics)，在開發階段提供提示，避免等到執行階段 (runtime) 才發現錯誤。

## Example

以下是使用 createApiClient 並進行型別驗證的範例：

```typescript
const apiClient = createApiClient('http://localhost')

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
  return Array.isArray(data) && data.every((item) => isUser(item))
}

// type getUsers: () => Promise<User[]>
export const getUsers = apiClient.get('/users', isUsers)

// type getUser: (options: { params: { userId: string } }) => Promise<User>
export const getUser = apiClient.get<{ userId: string }, never, User>('/user/:userId', isUser)

// type users: User[]
const users = await getUsers()
// type user: User
const user = await getUser({ params: { userId: 'XXX' } })
```

## 使用 typia 優化

推薦搭配 [typia](https://typia.io/) 進行型別驗證，可大幅減少手寫驗證邏輯的成本：

```typescript
// type getUsers: () => Promise<User[]>
export const getUsers = apiClient.get('/users', typia.createIs<User[]>())

// type getUser: (options: { params: { userId: string } }) => Promise<User>
export const getUser = apiClient.get<{ userId: string }, never, User>(
  '/user/:userId',
  typia.createIs<User>(),
)
```

## ApiClient 方法結構

- ApiClient.get<Params, Query, ReturnTyping>
- ApiClient.post<Params, Query, Body, ReturnTyping>
- ApiClient.put<Params, Query, Body, ReturnTyping>
- ApiClient.patch<Params, Query, Body, ReturnTyping>
- ApiClient.delete<Params, Query, ReturnTyping>

## 預設值行為

- Params, Query, 和 Body 預設為 never，表示不需要帶入參數。
- 如果需要帶入參數，則必須一併帶入 ReturnTyping。
- 當未指定型別時，ReturnTyping 會根據 validateResponse 自動推論。

# TODO

- 補上 [axios-mock-adapter](https://www.npmjs.com/package/axios-mock-adapter) 測試
