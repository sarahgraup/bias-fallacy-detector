import type {Config} from 'jest';
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Create a mock for fs/promises
  moduleNameMapper: {
    "^fs/promises$": "<rootDir>/src/__mocks__/fsMock.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};
export default config;