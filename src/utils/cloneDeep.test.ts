import { cloneDeep } from '@/utils/cloneDeep'

describe('clone validation', () => {
  test('Object', () => {
    const object1 = { a: 'A' }
    const object2 = cloneDeep(object1)
    object2.a = 'A2'

    expect(object1.a).toBe('A')
    expect(object2.a).toBe('A2')
  })

  test('Array', () => {
    const array1 = [1, 2, 3]
    const array2 = cloneDeep(array1)
    array2.push(4, 5, 6)

    expect(array1).toHaveLength(3)
    expect(array2).toHaveLength(6)
  })

  test('Map', () => {
    const map1 = new Map([
      [1, 'one'],
      [2, 'two'],
    ])
    const map2 = cloneDeep(map1)
    map2.set(3, 'three')
    map2.delete(1)
    map2.set(4, 'four')

    expect(map1.size).toBe(2)
    expect(map2.size).toBe(3)
  })

  test('Set', () => {
    const set1 = new Set([1, 2, 3])
    const set2 = cloneDeep(set1)
    set2.delete(1)
    set2.add(4)
    set2.add(5)
    set2.add(6)

    expect(set1.size).toBe(3)
    expect(set2.size).toBe(5)
  })

  test('Date', () => {
    const date1 = new Date(Date.UTC(2024, 0, 2, 3, 4, 5))

    const date2: Date = cloneDeep(date1)
    date2.setUTCHours(12)
    date2.setUTCMonth(10)

    expect(date1.toISOString()).toBe('2024-01-02T03:04:05.000Z')
    expect(date2.toISOString()).toBe('2024-11-02T12:04:05.000Z')
  })

  test('RegExp', () => {
    const str = 'abc1def2ghi3jkl4mno5678'
    const regex1 = new RegExp('\\d', 'g')

    const regex2: RegExp = cloneDeep(regex1)
    regex1.test(str)
    regex1.test(str)
    regex2.test(str)
    const regex3: RegExp = cloneDeep(regex2)

    expect(regex1.lastIndex).toBe(8)
    expect(regex2.lastIndex).toBe(4)
    expect(regex3.lastIndex).toBe(0)
  })

  test.todo('混合 object')
  test.todo('一階深度的混合 object')
  test.todo('三階深度的混合 object')
})
