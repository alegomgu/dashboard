import { parseServerEnv } from "@command-center/shared";

let cachedEnv: ReturnType<typeof parseServerEnv> | undefined;

export function getServerEnv() {
  if (!cachedEnv) {
    cachedEnv = parseServerEnv(process.env);
  }

  return cachedEnv;
}
