import axios from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'
import typia, { tags } from 'typia'

import { APiClient, createApiClient } from '@/client'

interface User {
  id: number
  name: string
}

const isUsers = typia.createIs<User[]>()
const isUser = typia.createIs<User>()

describe('createApiClient (no middleware)', () => {
  let mock: AxiosMockAdapter
  let apiClient: APiClient<Record<string, never>>

  beforeEach(() => {
    mock = new AxiosMockAdapter(axios)
    apiClient = createApiClient('http://example.com')
  })

  afterEach(() => {
    mock.reset()
    mock.restore()
  })

  describe('GET method', () => {
    test('No Params, No Query', async () => {
      // Arrange
      const randomUsers = typia.random<User[] & tags.MinItems<10>>()
      mock.onGet('/users').reply(200, randomUsers)

      // Act
      const getUsers = apiClient.get('/users', isUsers)
      const users = await getUsers()

      // Assert
      expect(users).toEqual(randomUsers)
    })

    test('Has Params, No Query', async () => {
      // Arrange
      const userId = typia.random<number>()
      const userName = typia.random<string>()
      mock.onGet(/^\/user\/.*$/).reply(({ url }) => {
        const id = parseFloat(url?.replace(/^\/user\/(.*)$/, '$1') ?? '')
        return [200, { id, name: userName }]
      })

      // Act
      const getUser = apiClient.get<{ userId: number }, never, User>('/user/:userId', isUser)
      const user = await getUser({ params: { userId } })

      // Assert
      expect(user.id).toBe(userId)
      expect(user.name).toBe(userName)
    })

    test.todo('No Params, Has Query')
    test.todo('Has Params, Has Query')
  })

  describe('POST method', () => {
    test.todo('No Params, No Query, No Body')
    test.todo('Has Params, No Query, No Body')
    test.todo('No Params, Has Query, No Body')
    test.todo('No Params, No Query, Has Body')
    test.todo('Has Params, Has Query, No Body')
    test.todo('Has Params, No Query, Has Body')
    test.todo('No Params, Has Query, Has Body')
    test.todo('Has Params, Has Query, Has Body')
  })

  describe('PUT method', () => {
    test.todo('No Params, No Query, No Body')
    test.todo('Has Params, No Query, No Body')
    test.todo('No Params, Has Query, No Body')
    test.todo('No Params, No Query, Has Body')
    test.todo('Has Params, Has Query, No Body')
    test.todo('Has Params, No Query, Has Body')
    test.todo('No Params, Has Query, Has Body')
    test.todo('Has Params, Has Query, Has Body')
  })

  describe('PATCH method', () => {
    test.todo('No Params, No Query, No Body')
    test.todo('Has Params, No Query, No Body')
    test.todo('No Params, Has Query, No Body')
    test.todo('No Params, No Query, Has Body')
    test.todo('Has Params, Has Query, No Body')
    test.todo('Has Params, No Query, Has Body')
    test.todo('No Params, Has Query, Has Body')
    test.todo('Has Params, Has Query, Has Body')
  })

  describe('DELETE method', () => {
    test.todo('No Params, No Query')
    test.todo('Has Params, No Query')
    test.todo('No Params, Has Query')
    test.todo('Has Params, Has Query')
  })
})

// TODO:
// 含權限的 middleware
// 錯誤狀態碼
// 驗證失敗狀態
