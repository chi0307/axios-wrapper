import axios from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'
import typia, { tags } from 'typia'

import { APiClient, createApiClient } from '@/client'

interface User {
  id: number & tags.Type<'int32'>
  name: string
}
const isUser = typia.createIs<User>()

describe('createApiClient (no middleware)', () => {
  let mock: AxiosMockAdapter
  let apiClient: APiClient<Record<string, never>>
  const user: User = typia.random<User>()
  const token: string = typia.random<string>()

  beforeEach(() => {
    mock = new AxiosMockAdapter(axios)
    apiClient = createApiClient('http://example.com')
  })

  afterEach(() => {
    mock.reset()
    mock.restore()
  })

  function mockApiReply(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    options: ('params' | 'query' | 'body')[],
  ): void {
    const url = options.includes('params') ? `/user/${user.id}` : `/user`
    mock.onAny(url).reply((request) => {
      if (request.method !== method) {
        return [404]
      }
      if (options.includes('query')) {
        const query: unknown = request.params
        if (
          typeof query !== 'object' ||
          query === null ||
          !('token' in query) ||
          query.token !== token
        ) {
          return [400, 'query not found']
        }
      }
      if (options.includes('body')) {
        try {
          if (typeof request.data !== 'string') {
            return [500]
          }
          const body: unknown = JSON.parse(request.data)
          if (
            typeof body !== 'object' ||
            body === null ||
            !('userName' in body) ||
            body.userName !== user.name
          ) {
            return [400, 'body not found']
          }
        } catch {
          return [500]
        }
      }
      return [200, user]
    })
  }

  describe.each<'get' | 'delete'>(['get', 'delete'])('%s method', (method) => {
    test('No Params, No Query', async () => {
      // Arrange
      mockApiReply(method, [])

      // Act
      const event = apiClient[method]('/user', isUser)
      const { data, status } = await event()

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('Has Params, No Query', async () => {
      // Arrange
      mockApiReply(method, ['params'])

      // Act
      const event = apiClient[method]<{ userId: number }, never, User>('/user/:userId', isUser)
      const { data, status } = await event({ params: { userId: user.id } })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('No Params, Has Query', async () => {
      // Arrange
      mockApiReply(method, ['query'])

      // Act
      const event = apiClient[method]<never, { token: string }, User>('/user', isUser)
      const { data, status } = await event({ query: { token } })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('Has Params, Has Query', async () => {
      // Arrange
      mockApiReply(method, ['params', 'query'])

      // Act
      const event = apiClient[method]<{ userId: number }, { token: string }, User>(
        '/user/:userId',
        isUser,
      )
      const { data, status } = await event({
        params: { userId: user.id },
        query: { token },
      })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })
  })

  describe.each<'post' | 'put' | 'patch'>(['post', 'put', 'patch'])('%s method', (method) => {
    test('No Params, No Query, No Body', async () => {
      // Arrange
      mockApiReply(method, [])

      // Act
      const event = apiClient[method]('/user', isUser)
      const { data, status } = await event()

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('Has Params, No Query, No Body', async () => {
      // Arrange
      mockApiReply(method, ['params'])

      // Act
      const event = apiClient[method]<{ userId: number }, never, never, User>(
        '/user/:userId',
        isUser,
      )
      const { data, status } = await event({ params: { userId: user.id } })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('No Params, Has Query, No Body', async () => {
      // Arrange
      mockApiReply(method, ['query'])

      // Act
      const event = apiClient[method]<never, { token: string }, never, User>('/user', isUser)
      const { data, status } = await event({ query: { token } })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('No Params, No Query, Has Body', async () => {
      // Arrange
      mockApiReply(method, ['body'])

      // Act
      const event = apiClient[method]<never, never, { userName: string }, User>('/user', isUser)
      const { data, status } = await event({ body: { userName: user.name } })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('Has Params, Has Query, No Body', async () => {
      // Arrange
      mockApiReply(method, ['params', 'query'])

      // Act
      const event = apiClient[method]<{ userId: number }, { token: string }, never, User>(
        '/user/:userId',
        isUser,
      )
      const { data, status } = await event({ params: { userId: user.id }, query: { token } })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('Has Params, No Query, Has Body', async () => {
      // Arrange
      mockApiReply(method, ['params', 'body'])

      // Act
      const event = apiClient[method]<{ userId: number }, never, { userName: string }, User>(
        '/user/:userId',
        isUser,
      )
      const { data, status } = await event({
        params: { userId: user.id },
        body: { userName: user.name },
      })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('No Params, Has Query, Has Body', async () => {
      // Arrange
      mockApiReply(method, ['query', 'body'])

      // Act
      const event = apiClient[method]<never, { token: string }, { userName: string }, User>(
        '/user',
        isUser,
      )
      const { data, status } = await event({ query: { token }, body: { userName: user.name } })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })

    test('Has Params, Has Query, Has Body', async () => {
      // Arrange
      mockApiReply(method, ['params', 'query', 'body'])

      // Act
      const event = apiClient[method]<
        { userId: number },
        { token: string },
        { userName: string },
        User
      >('/user/:userId', isUser)
      const { data, status } = await event({
        params: { userId: user.id },
        query: { token },
        body: { userName: user.name },
      })

      // Assert
      expect(status).toBe(200)
      expect(data).toEqual(user)
    })
  })
})

// TODO:
// 含權限的 middleware
// 錯誤狀態碼
// 驗證失敗狀態
