import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
process.env.IS_TEST_ENV = "true";


