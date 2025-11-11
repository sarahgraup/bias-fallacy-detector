# bias-fallacy-detector
bias-detector/
├── src/
│   ├── index.ts              # CLI entry point (npm start)
│   ├── server.ts             # API server entry point (npm run api)
│   ├── service.ts            # Core service (used by both CLI & API)
│   │
│   ├── api/                  # NEW: API layer (optional)
│   │   ├── app.ts            # Express app setup
│   │   ├── routes.ts         # API routes
│   │   └── middleware.ts     # Error handlers
│   │
│   ├── cli/                  # CLI layer
│   │   ├── interface.ts
│   │   ├── prompts.ts
│   │   └── examples.ts
│   │
│   ├── config/
│   ├── utils/
│   ├── detectors/
│   ├── agents/
│   └── workflows/

# jest testing

```
    cd server
    npm test
```

# Running interactive terminal
```
# Run the CLI
npm start

# Or in development mode
npm run dev
```

# Running API Server
```
# Start the API server
npm run api

# Or in development mode
npm run dev:api
```

`npx ts-node test-formatter.ts`