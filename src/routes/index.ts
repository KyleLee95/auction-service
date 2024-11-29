import { OpenAPIHono } from "@hono/zod-openapi";
import { auctionsRouter } from "./auctions";
import { categoriesRouter } from "./categories";
import { watchlistRouter } from "./watchlists";
import { bidsRouter } from "./bids";
const apiRouter = new OpenAPIHono();

apiRouter.route("/auctions", auctionsRouter);
apiRouter.route("/watchlist", watchlistRouter);
apiRouter.route("/categories", categoriesRouter);
apiRouter.route("/bids", bidsRouter);
export { apiRouter };
