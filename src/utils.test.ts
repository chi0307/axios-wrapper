import { buildUrlWithParams } from '@/utils'

describe('buildUrlWithParams function', () => {
  test('should return the original URL when params is null', () => {
    // Arrange
    const url = '/api/resource/:id'
    const params = null

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe(url)
  })

  test('should return the original URL when params is an empty object', () => {
    // Arrange
    const url = '/api/resource/:id'
    const params = {}

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe(url)
  })

  test('should replace a single param in the URL correctly', () => {
    // Arrange
    const url = '/api/resource/:id'
    const params = { id: '123' }

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe('/api/resource/123')
  })

  test('should replace multiple params in the URL correctly', () => {
    // Arrange
    const url = '/api/resource/:id/:type'
    const params = { id: '123', type: 'image' }

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe('/api/resource/123/image')
  })

  test('should encode special characters in params properly', () => {
    // Arrange
    const url = '/api/resource/:id'
    const params = { id: 'hello world' }

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe('/api/resource/hello%20world')
  })

  test('should replace repeated params with the same value consistently', () => {
    // Arrange
    const url = '/api/resource/:id/:id'
    const params = { id: '123' }

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe('/api/resource/123/123')
  })

  test('should keep the original key in the URL when a param is not provided', () => {
    // Arrange
    const url = '/api/resource/:id/:type'
    const params = { id: '123' }

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe('/api/resource/123/:type')
  })

  test('should ignore extra keys in params that are not part of the URL', () => {
    // Arrange
    const url = '/api/resource/:id'
    const params = { id: '123', type: 'image' }

    // Act
    const result = buildUrlWithParams(url, params)

    // Assert
    expect(result).toBe('/api/resource/123')
  })
})
