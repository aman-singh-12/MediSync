// Error middleware: provides `notFound` and centralized `errorHandler` for API requests.

// ================= CENTRAL ERROR HANDLER =================
// Logic: Catches unhandled errors, formats JSON response, hides internal stack trace in production
const errorHandler = (err, req, res, next) => {
	// 1. Set status code (defaults to 500 if current code is 200 OK)
	const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
	res.status(statusCode);

	// 2. Return structured JSON error response
	res.json({
		message: err.message,
		stack: process.env.NODE_ENV === 'production' ? null : err.stack,
	});
};

// ================= 404 NOT FOUND HANDLER =================
// Logic: Catches invalid API route URLs and passes a 404 error to errorHandler
const notFound = (req, res, next) => {
	const error = new Error(`Not Found - ${req.originalUrl}`);
	res.status(404);
	next(error);
};

module.exports = { errorHandler, notFound };

