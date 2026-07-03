import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`WFM Request Portal API listening on http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv} | Email driver: ${env.email.driver} | Storage: ${env.storage.driver}`);
});
