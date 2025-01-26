// 格式化 URL，插入 `params`
export function buildUrlWithParams(url: string, params: null | Record<string, string>): string {
  if (params === null) {
    return url
  }
  return Object.entries(params).reduce(
    (formattedUrl, [key, value]) => formattedUrl.replaceAll(`:${key}`, encodeURIComponent(value)),
    url,
  )
}
