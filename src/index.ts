import axios, { type AxiosInstance, type AxiosRequestConfig, type CreateAxiosDefaults } from 'axios'

// eslint-disable-next-line import-x/no-cycle
import { ApiCaller, ApiDefinition, Middleware, RequestOptions } from '@/type'

// 格式化 URL，插入 `params`
function buildUrlWithParams(url: string, params: null | Record<string, string>): string {
  if (params === null) {
    return url
  }
  return Object.entries(params).reduce(
    (formattedUrl, [key, value]) => formattedUrl.replace(`:${key}`, encodeURIComponent(value)),
    url,
  )
}

// 發送 API 請求
async function sendRequest<Params, Query, Body, ReturnTyping>(
  axiosInstance: AxiosInstance,
  { path, method, validateResponse }: ApiDefinition<ReturnTyping>,
  options: null | RequestOptions<Params, Query, Body>,
): Promise<ReturnTyping> {
  const params = options !== null && 'params' in options ? options.params : undefined
  const query = options !== null && 'query' in options ? options.query : undefined
  const body = options !== null && 'body' in options ? options.body : undefined
  const formattedUrl = buildUrlWithParams(path, params ?? null)

  const config: AxiosRequestConfig = {
    method,
    url: formattedUrl,
    params: query,
    data: body,
  }

  const { data } = await axiosInstance.request<unknown>(config)
  // TODO: status code 其他的狀況還沒想好要怎麼處理

  if (!validateResponse(data)) {
    throw new Error('Response validation failed')
  }

  return data
}

function setAxiosInstance<MiddlewareOptions extends Record<string, unknown>>(
  defaultAxiosInstance: AxiosInstance,
  middlewares: Middleware<MiddlewareOptions>[],
  middlewareOptions: Partial<MiddlewareOptions>,
): AxiosInstance {
  if (middlewares.length === 0) {
    return defaultAxiosInstance
  }
  // TODO: 每次設定 middleware 都要創建新的 instance? 會不會有可能不會互相影響
  // 或是好像可以用 cache 的方式避免重複的 instance 出現
  const clonedInstance = axios.create(defaultAxiosInstance.defaults) // 創建一個新的 AxiosInstance 並繼承原設定
  for (const middleware of middlewares) {
    middleware(clonedInstance, middlewareOptions) // 應用 Middleware
  }
  return clonedInstance
}

// 建立 API 調用函數
function createApiCaller<Params, Query, Body, ReturnTyping>(
  axiosInstance: AxiosInstance,
  apiDef: ApiDefinition<ReturnTyping>,
): ApiCaller<Params, Query, Body, ReturnTyping> {
  return async (options?: RequestOptions<Params, Query, Body>) => {
    return await sendRequest(axiosInstance, apiDef, options ?? null)
  }
}

function createResponseHelper<MiddlewareOptions extends Record<string, unknown>>(
  defaultAxiosInstance: AxiosInstance,
  middlewares: Middleware<MiddlewareOptions>[],
  method: 'DELETE' | 'GET',
) {
  return <
    Params extends Record<string, unknown> = never,
    Query = never,
    // @ts-expect-error 這裡預期 TS 報錯，因為我們需要允許全不帶參數或全帶參數，但 TS 泛型限制不足
    // 目的是希望在不帶入的時候 Params, Query 要是 never，且 ReturnTyping 要能自動推倒出來
    // 且全部帶入的時候，也需要一並帶入 ReturnTyping 型別 (畢竟部份帶入，會無法正確推導出 ReturnTyping 型別)
    ReturnTyping,
  >(
    path: ApiDefinition<ReturnTyping>['path'],
    validateResponse: ApiDefinition<ReturnTyping>['validateResponse'],
    middlewareOptions: Partial<MiddlewareOptions> = {},
  ): ApiCaller<Params, Query, never, ReturnTyping> => {
    const axiosInstance = setAxiosInstance(defaultAxiosInstance, middlewares, middlewareOptions)
    return createApiCaller<Params, Query, never, ReturnTyping>(axiosInstance, {
      path,
      validateResponse,
      method,
    })
  }
}

function createMutationHelper<MiddlewareOptions extends Record<string, unknown>>(
  defaultAxiosInstance: AxiosInstance,
  middlewares: Middleware<MiddlewareOptions>[],
  method: 'PATCH' | 'POST' | 'PUT',
) {
  return <
    Params extends Record<string, unknown> = never,
    Query = never,
    Body = never,
    // @ts-expect-error 這裡預期 TS 報錯，因為我們需要允許全不帶參數或全帶參數，但 TS 泛型限制不足
    // 目的是希望在不帶入的時候 Params, Query, Body 要是 never，且 ReturnTyping 要能自動推倒出來
    // 且全部帶入的時候，也需要一並帶入 ReturnTyping 型別 (畢竟部份帶入，會無法正確推導出 ReturnTyping 型別)
    ReturnTyping,
  >(
    path: ApiDefinition<ReturnTyping>['path'],
    validateResponse: ApiDefinition<ReturnTyping>['validateResponse'],
    middlewareOptions: Partial<MiddlewareOptions> = {},
  ): ApiCaller<Params, Query, Body, ReturnTyping> => {
    const axiosInstance = setAxiosInstance(defaultAxiosInstance, middlewares, middlewareOptions)
    return createApiCaller<Params, Query, Body, ReturnTyping>(axiosInstance, {
      path,
      validateResponse,
      method,
    })
  }
}

export interface APiClient<MiddlewareOptions extends Record<string, unknown>> {
  readonly delete: ReturnType<typeof createResponseHelper<MiddlewareOptions>>
  readonly get: ReturnType<typeof createResponseHelper<MiddlewareOptions>>
  readonly patch: ReturnType<typeof createMutationHelper<MiddlewareOptions>>
  readonly post: ReturnType<typeof createMutationHelper<MiddlewareOptions>>
  readonly put: ReturnType<typeof createMutationHelper<MiddlewareOptions>>
}

// API 客戶端工廠函數
export function createApiClient<
  MiddlewareOptions extends Record<string, unknown> = Record<string, never>,
>(
  baseURL: `${'http' | 'https'}://${string}`,
  middlewares: Middleware<MiddlewareOptions>[] = [],
  axiosDefaultConfig: Omit<CreateAxiosDefaults, 'baseURL'> = {},
): APiClient<MiddlewareOptions> {
  const axiosInstance = axios.create({ ...axiosDefaultConfig, baseURL })

  // TODO: 要再想想怎麼樣讓 Params 跟 Path 可以同步避免少寫東西
  return {
    get: createResponseHelper<MiddlewareOptions>(axiosInstance, middlewares, 'GET'),
    post: createMutationHelper<MiddlewareOptions>(axiosInstance, middlewares, 'POST'),
    put: createMutationHelper<MiddlewareOptions>(axiosInstance, middlewares, 'PUT'),
    patch: createMutationHelper<MiddlewareOptions>(axiosInstance, middlewares, 'PATCH'),
    delete: createResponseHelper<MiddlewareOptions>(axiosInstance, middlewares, 'DELETE'),
  }
}
