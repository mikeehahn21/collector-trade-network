import { buildApp } from "./app";
import { loadEnv } from "./config/env";

const env = loadEnv();
const app = await buildApp(env);

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
