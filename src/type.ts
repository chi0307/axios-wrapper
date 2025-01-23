import { AxiosInstance, Method } from 'axios'

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
export type RequestOptions<Params, Query, Body> =
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
export type ApiCaller<Params, Query, Body, ReturnTyping> =
  RequestOptions<Params, Query, Body> extends Record<string, never>
    ? () => Promise<ReturnTyping>
    : HasRequiredField<RequestOptions<Params, Query, Body>> extends true
      ? (options: RequestOptions<Params, Query, Body>) => Promise<ReturnTyping>
      : (options?: RequestOptions<Params, Query, Body>) => Promise<ReturnTyping>

export type Middleware<MiddlewareOptions extends Record<string, unknown>> = (
  axiosInstance: AxiosInstance,
  middlewareOptions: Partial<MiddlewareOptions>,
) => void

// API 定義類型
export interface ApiDefinition<ReturnTyping> {
  readonly method: Method // 請求方法
  readonly path: `/${string}` // API 路徑
  readonly validateResponse: (data: unknown) => data is ReturnTyping // 回傳型別檢查
}

// eslint-disable-next-line import-x/no-cycle
export { type APiClient } from '@/index'
