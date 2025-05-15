class ExpressError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;

    this.name = this.constructor.name;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 404 NOT FOUND error. */
class NotFoundError extends ExpressError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

/** 401 UNAUTHORIZED error. */
class UnauthorizedError extends ExpressError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/** 400 BAD REQUEST error. */
class BadRequestError extends ExpressError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

/** 403 FORBIDDEN error. */
class ForbiddenError extends ExpressError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
};
