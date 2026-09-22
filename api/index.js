const app = require("../backend/server");

app.use((req, res, next) => {
    console.log("VERCEL REQUEST:", req.method, req.originalUrl);
    next();
});

module.exports = app;
