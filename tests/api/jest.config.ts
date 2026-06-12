import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  displayName: "api",
  testEnvironment: "node",
  rootDir: "../../",
  roots: ["<rootDir>/tests/api"],
  testMatch: ["<rootDir>/tests/api/v1/**/*.test.ts"],
  globalSetup: "<rootDir>/tests/api/global-setup.ts",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 60_000,
  maxWorkers: 1,
  verbose: true,
};

export default createJestConfig(config);
