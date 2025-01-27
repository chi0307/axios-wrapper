# Axios API Client with Type Checking

## 🌐 Languages

- [中文版](https://github.com/chi0307/axios-wrapper/blob/master/README-chinese.md)

## Purpose

The goal of this package is to ensure type safety when calling APIs using Axios. Instead of relying on `as T` to cast response data, this package validates the response structure at runtime, enabling immediate error detection if the API returns incorrect data. By leveraging generics and pre-defined methods, this package minimizes potential errors during development and avoids runtime surprises.

## Features

- **Type-Safe API Calls**: Validate API responses at runtime to prevent incorrect type usage.
- **Leverage Generics**: Provide strong type hints during development.
- **Customizable Validation**: Define custom validation functions or use third-party tools like [typia](https://typia.io/).
- **Predefined API Methods**: Simplify API interactions with pre-built methods for `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests.
- **Default Parameter Behavior**: Use `never` as defaults for `Params`, `Query`, and `Body` to enforce explicit typing.

---

## Installation

```bash
pnpm install @chi0307/axios-wrapper
```

---

## Usage

### Creating an API Client

```typescript
import { createApiClient } from '@chi0307/axios-wrapper'

const apiClient = createApiClient('http://localhost')
```

### Example: Define Types and Validators

#### Manual Validator

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

// Example Usage
export const getUsers = apiClient.get('/users', isUsers)
export const getUser = apiClient.get<{ userId: string }, never, User>('/user/:userId', isUser)

const { data: users } = await getUsers() // Type: User[]
const { data: user } = await getUser({ params: { userId: '123' } }) // Type: User
```

#### Using Typia for Validation

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

const { data: users } = await getUsers() // Type: User[]
const { data: user } = await getUser({ params: { userId: '123' } }) // Type: User
```

---

## API Client Method Structure

### Method Signatures

```typescript
ApiClient.get<Params, Query, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.post<Params, Query, Body, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.put<Params, Query, Body, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.patch<Params, Query, Body, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
ApiClient.delete<Params, Query, ReturnTyping>(url: string, validateResponse: (data: unknown) => data is ReturnTyping)
```

### Default Parameter Behavior

- **`Params`**, **`Query`**, and **`Body`** default to `never`.
- If parameters are required, specify them explicitly along with `ReturnTyping`.
- **`ReturnTyping`** will be inferred automatically if `validateResponse` is provided.
