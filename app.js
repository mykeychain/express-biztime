"use strict"
/** BizTime express application. */

const express = require("express");
const { NotFoundError } = require("./expressError");
const companyRoutes = require("./routes/companies.js");
const middleware = require("./middleware.js");


const app = express();

app.use(express.json());

/** Middleware to check for valid company code */
app.use(middleware.codeValidator);

/** CRUD operations for companies */
app.use("/companies", companyRoutes);

/** 404 handler: matches unmatched routes; raises NotFoundError. */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Error handler: logs stacktrace and returns JSON error message. */
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;
  if (process.env.NODE_ENV !== "test") console.error(status, err.stack);
  return res.status(status).json({ error: { message, status } });
});



module.exports = app;
