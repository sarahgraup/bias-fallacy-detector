import express, { Request, Response, NextFunction } from 'express';
import router from './routes';
import { BadRequestError, NotFoundError } from 'expressError';
import {
  notFoundHandler,
  errorHandler,
  requestLogger,
  corsMiddleware,
} from "./middleware";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(corsMiddleware);
app.use(requestLogger);


app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);



export default app;





