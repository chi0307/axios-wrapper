import axios, { AxiosError, AxiosInstance } from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'
import typia, { tags } from 'typia'

import { APiClient, createApiClient } from '@/client'

interface User {
  id: number & tags.Type<'int32'>
  name: string
}
const isUser = typia.createIs<User>()

function getAxiosErrorMessage<Code extends number>(
  statusCode: Code,
): `Request failed with status code ${Code}` {
  return `Request failed with status code ${statusCode}`
}

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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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

describe('API Error Handling - Status Codes', () => {
  let mock: AxiosMockAdapter
  let apiClient: APiClient<Record<string, never>>
  const url = '/user'

  beforeEach(() => {
    mock = new AxiosMockAdapter(axios)
    apiClient = createApiClient('http://example.com')
  })

  afterEach(() => {
    mock.reset()
    mock.restore()
  })

  test('should throw an error when API responds with 404 Not Found', async () => {
    // Arrange

    // Act
    const event = apiClient.get(url, isUser)

    // Assert
    await expect(event).rejects.toThrow(AxiosError)
    await expect(event).rejects.toThrow(getAxiosErrorMessage(404))
  })

  test('should throw an error when API responds with 400 Bad Request', async () => {
    // Arrange
    mock.onGet(url).reply(400)

    // Act
    const event = apiClient.get(url, isUser)

    // Assert
    await expect(event).rejects.toThrow(AxiosError)
    await expect(event).rejects.toThrow(getAxiosErrorMessage(400))
  })

  test('should succeed on first request (200 OK) and fail on second request (500 Internal Server Error)', async () => {
    // Arrange
    const user = typia.random<User>()
    mock.onGet(url).replyOnce(200, user)
    mock.onGet(url).reply(500)

    // Act
    const event = apiClient.get(url, isUser)
    const firstRequest = await event()
    const secondRequest = event()

    // Assert
    expect(firstRequest.status).toBe(200)
    expect(firstRequest.data).toEqual(user)
    await expect(secondRequest).rejects.toThrow(AxiosError)
    await expect(secondRequest).rejects.toThrow(getAxiosErrorMessage(500))
  })
})

describe('API Client Middleware - Authentication Header', () => {
  let mock: AxiosMockAdapter
  const url = '/user'
  let authKey: string
  let authValue: string
  let user: User

  function authMiddleware(
    axiosInstance: AxiosInstance,
    { requiredAuth = false }: { requiredAuth?: boolean },
  ): void {
    if (requiredAuth) {
      axiosInstance.interceptors.request.use((config) => {
        // eslint-disable-next-line security/detect-object-injection
        config.headers[authKey] = authValue
        return config
      })
    }
  }

  beforeEach(() => {
    authKey = 'token'
    authValue = typia.random<string & tags.MinLength<100>>()
    user = typia.random<User>()
    mock = new AxiosMockAdapter(axios)
    mock.onGet(url).reply((config) => {
      // eslint-disable-next-line security/detect-object-injection
      if (config.headers?.[authKey] === authValue) {
        return [200, user]
      }
      return [401]
    })
  })

  afterEach(() => {
    mock.reset()
    mock.restore()
  })

  test('should include authentication header when middleware is applied', async () => {
    // Arrange

    // Act
    const apiClient = createApiClient('http://example.com', [authMiddleware])
    const event = apiClient.get(url, isUser, { requiredAuth: true })
    const { status, data } = await event()

    // Assert
    expect(status).toBe(200)
    expect(data).toEqual(user)
  })

  test('should reject request when middleware is applied but authentication is not required', async () => {
    // Arrange

    // Act
    const apiClient = createApiClient('http://example.com', [authMiddleware])
    const event = apiClient.get(url, isUser)

    // Assert
    await expect(event).rejects.toThrow(AxiosError)
    await expect(event).rejects.toThrow(getAxiosErrorMessage(401))
  })

  test('should reject request when authentication header is missing', async () => {
    // Arrange

    // Act
    const apiClient = createApiClient('http://example.com')
    const event = apiClient.get(url, isUser)

    // Assert
    await expect(event).rejects.toThrow(AxiosError)
    await expect(event).rejects.toThrow(getAxiosErrorMessage(401))
  })

  test('should reject request when authentication header contains incorrect token', async () => {
    // Arrange
    function authMiddlewareWithWrongToken(
      axiosInstance: AxiosInstance,
      { requiredAuth = false }: { requiredAuth?: boolean },
    ): void {
      if (requiredAuth) {
        axiosInstance.interceptors.request.use((config) => {
          // eslint-disable-next-line security/detect-object-injection
          config.headers[authKey] = typia.random<string>()
          return config
        })
      }
    }

    // Act
    const apiClient = createApiClient('http://example.com', [authMiddlewareWithWrongToken])
    const event = apiClient.get(url, isUser, { requiredAuth: true })

    // Assert
    await expect(event).rejects.toThrow(AxiosError)
    await expect(event).rejects.toThrow(getAxiosErrorMessage(401))
  })
})

describe('API Response Validation - Error Handling', () => {
  let mock: AxiosMockAdapter
  let apiClient: APiClient<Record<string, never>>
  const url = '/user'
  let user: User

  beforeEach(() => {
    user = typia.random<User>()
    mock = new AxiosMockAdapter(axios)
    mock.onGet(url).reply(200, user)
    apiClient = createApiClient('http://example.com')
  })

  afterEach(() => {
    mock.reset()
    mock.restore()
  })

  test('should return null when response is missing required fields', async () => {
    // Arrange
    const validateUserWithEmail = typia.createIs<User & { email: string }>()

    // Act
    const event = apiClient.get(url, validateUserWithEmail)
    const { data, status } = await event()

    // Assert
    expect(status).toBe(200)
    expect(data).toBeNull()
  })

  test('should return null when response is expected to be an array but received an object', async () => {
    // Arrange
    const validateUsers = typia.createIs<User[]>()

    // Act
    const event = apiClient.get(url, validateUsers)
    const { data, status } = await event()

    // Assert
    expect(status).toBe(200)
    expect(data).toBeNull()
  })
})

// TODO
// - 大量 middleware 測試 (同時需要測試效能)
// - 大量 api 效能測試
// - type 型別測試 (還在考慮有沒有需要) https://www.npmjs.com/package/tsd
