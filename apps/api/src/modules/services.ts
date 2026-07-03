import type { Pool } from "pg";

import type { Env } from "../config/env";

export type AppServices = {
  db: Pool;
  env: Env;
};
