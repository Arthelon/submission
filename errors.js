var errors = {}

errors.NotFoundError = function (code, error) {
    Error.call(this, typeof error === "undefined" ? undefined : error.message);
    Error.captureStackTrace(this, this.constructor);
    this.name = "NotFoundError";
    this.message = typeof error === "undefined" ? undefined : error.message;
    this.code = typeof code === "undefined" ? "404" : code;
    this.status = 404;
    this.inner = error;
}
errors.UnauthorizedAccessError = function UnauthorizedAccessError(code, error) {
    Error.call(this, error.message);
    Error.captureStackTrace(this, this.constructor);
    this.name = "UnauthorizedAccessError";
    this.message = error.message;
    this.code = code;
    this.status = 401;
    this.inner = error;
}
module.exports = errors