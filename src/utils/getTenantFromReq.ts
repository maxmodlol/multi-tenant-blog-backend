import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

type TenantParams = ParamsDictionary & { tenant?: string };

export function getTenantFromReq(req: Request<TenantParams>) {
  return req.params.tenant ?? "main";
}
