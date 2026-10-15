"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const express_1 = require("express");
const auth_route_1 = require("./auth/auth.route");
const conversations_route_1 = require("./conversations/conversations.route");
const messages_route_1 = require("./messages/messages.route");
const calls_route_1 = require("./calls/calls.route");
const stories_route_1 = require("./stories/stories.route");
const spy_route_1 = require("./spy/spy.route");
const ratelimit_middleware_1 = require("../../middlewares/ratelimit.middleware");
const appRouter = (0, express_1.Router)();
exports.appRouter = appRouter;
// Health check
appRouter.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});
// API routes
appRouter.use('/auth', ratelimit_middleware_1.authLimiter, auth_route_1.authRouter);
appRouter.use('/conversations', conversations_route_1.conversationsRouter);
appRouter.use('/messages', messages_route_1.messagesRouter);
appRouter.use('/calls', calls_route_1.callsRouter);
appRouter.use('/stories', stories_route_1.storiesRouter);
appRouter.use('/spy', spy_route_1.spyRouter);
exports.default = appRouter;
