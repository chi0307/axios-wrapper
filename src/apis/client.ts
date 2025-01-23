import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CreateAxiosDefaults,
  type Method,
} from 'axios'

/** 判斷型別是否為 `never` */
type IsNever<T> = [T] extends [never] ? true : false
/** 判斷型別是否為空 */
type IsEmpty<T> = IsNever<T> extends true ? true : T extends Record<string, never> ? true : false

/** 判斷是否存在必填欄位 */
type HasRequiredField<T> =
  IsNever<T> extends true
    ? false
    : T extends Record<string, unknown>
      ? keyof T extends never
        ? false
        : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          { [K in keyof T]-?: {} extends Pick<T, K> ? false : true } extends Record<keyof T, false>
          ? false
          : true
      : false

type Nullable = 'Nullable'
type Required = 'Required'
type Optional = 'Optional'
/** 判斷型別是否為 `Nullable`, `required` 或 `optional` */
type FieldRequirement<T> =
  IsEmpty<T> extends true ? Nullable : HasRequiredField<T> extends true ? Required : Optional

// 故意 disable 掉 object key sorting，我希望 RequestOptions 會可以依照 `params`, `query`, `body` 排序回傳回去

/**
 * 根據 `Params`、`Query`、`Body` 組合生成請求參數型別
 * - 若三者皆為 `never` 或 `{}`, 則返回 `never`
 *
 * @template Params - 路徑參數型別
 * @template Query - 查詢參數型別
 * @template Body - 請求體型別
 *
 * 會想展開是因為這樣外面看起來比較漂亮易懂，不會是一堆 `&` 組成難理解
 */
type RequestOptions<Params, Query, Body> =
  | (FieldRequirement<Params> extends Nullable
      ? FieldRequirement<Query> extends Nullable
        ? FieldRequirement<Body> extends Nullable
          ? never
          : FieldRequirement<Body> extends Required
            ? { body: Body }
            : { body?: Body }
        : FieldRequirement<Query> extends Required
          ? FieldRequirement<Body> extends Nullable
            ? { query: Query }
            : FieldRequirement<Body> extends Required
              ? { query: Query; body: Body }
              : { query: Query; body?: Body }
          : FieldRequirement<Body> extends Nullable
            ? { query?: Query }
            : FieldRequirement<Body> extends Required
              ? { query?: Query; body: Body }
              : { query?: Query; body?: Body }
      : never)
  | (FieldRequirement<Params> extends Optional
      ? FieldRequirement<Query> extends Nullable
        ? FieldRequirement<Body> extends Nullable
          ? { params?: Params }
          : FieldRequirement<Body> extends Required
            ? { params?: Params; body: Body }
            : { params?: Params; body?: Body }
        : FieldRequirement<Query> extends Required
          ? FieldRequirement<Body> extends Nullable
            ? { params?: Params; query: Query }
            : FieldRequirement<Body> extends Required
              ? { params?: Params; query: Query; body: Body }
              : { params?: Params; query: Query; body?: Body }
          : FieldRequirement<Body> extends Nullable
            ? { params?: Params; query?: Query }
            : FieldRequirement<Body> extends Required
              ? { params?: Params; query?: Query; body: Body }
              : { params?: Params; query?: Query; body?: Body }
      : never)
  | (FieldRequirement<Params> extends Required
      ? FieldRequirement<Query> extends Nullable
        ? FieldRequirement<Body> extends Nullable
          ? { params: Params }
          : FieldRequirement<Body> extends Required
            ? { params: Params; body: Body }
            : { params: Params; body?: Body }
        : FieldRequirement<Query> extends Required
          ? FieldRequirement<Body> extends Nullable
            ? { params: Params; query: Query }
            : FieldRequirement<Body> extends Required
              ? { params: Params; query: Query; body: Body }
              : { params: Params; query: Query; body?: Body }
          : FieldRequirement<Body> extends Nullable
            ? { params: Params; query?: Query }
            : FieldRequirement<Body> extends Required
              ? { params: Params; query?: Query; body: Body }
              : { params: Params; query?: Query; body?: Body }
      : never)

/**
 * API 呼叫函數型別
 * - 若 `RequestOptions` 全為空，返回無參數函數
 * - 若有必填欄位，返回需帶參數的函數
 * - 否則，返回可選參數函數
 */
type ApiCaller<Params, Query, Body, ReturnTyping> =
  RequestOptions<Params, Query, Body> extends Record<string, never>
    ? () => Promise<ReturnTyping>
    : HasRequiredField<RequestOptions<Params, Query, Body>> extends true
      ? (options: RequestOptions<Params, Query, Body>) => Promise<ReturnTyping>
      : (options?: RequestOptions<Params, Query, Body>) => Promise<ReturnTyping>

type Middleware<MiddlewareOptions extends Record<string, unknown>> = (
  axiosInstance: AxiosInstance,
  middlewareOptions: Partial<MiddlewareOptions>,
) => void

// API 定義類型
interface ApiDefinition<ReturnTyping> {
  readonly method: Method // 請求方法
  readonly path: `/${string}` // API 路徑
  readonly validateResponse: (data: unknown) => data is ReturnTyping // 回傳型別檢查
}

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

interface CreateAPiClient<MiddlewareOptions extends Record<string, unknown>> {
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
): CreateAPiClient<MiddlewareOptions> {
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
