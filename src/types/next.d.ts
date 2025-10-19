declare module "next/headers" {
  export function cookies(): import("next/dist/headers").ReadonlyRequestCookies;
}
