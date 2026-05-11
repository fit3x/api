import { requestId } from 'hono/request-id'

export const requestIdMiddleware = () => {
  return requestId({
    headerName: 'X-Request-Id',
    limitLength: 128,
  })
}
