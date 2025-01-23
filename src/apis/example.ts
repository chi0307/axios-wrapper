import typia from 'typia'

import { createApiClient } from './client'

const apiClient = createApiClient('https://5a019f7b-11a8-43f8-8dad-fc6d4303ee3d.mock.pstmn.io')

interface User {
  id: number
  name: string
}
export const getUsers = apiClient.get('/users', typia.createIs<User[]>())
