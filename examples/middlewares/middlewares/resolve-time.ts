import { MiddlewareFn } from "../../../src";

export const ResolveTimeMiddleware: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now();
  const result = await next();
  const resolveTime = Date.now() - start;
  console.log(`${info.parentType.name}.${info.fieldName} [${resolveTime} ms]`);
  return result;
};