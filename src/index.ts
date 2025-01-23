import 'dotenv/config'

import { message } from '@/example'

import { getUsers } from './apis/example'

console.log('NODE_ENV', process.env['NODE_ENV'])
console.log(message)

void getUsers().then((result) => {
  console.log(result)
})
