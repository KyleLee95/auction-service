-- CreateTable
CREATE TABLE "AuctionsOnWatchLists" (
    "watchlistId" INTEGER NOT NULL,
    "auctionId" INTEGER NOT NULL,

    CONSTRAINT "AuctionsOnWatchLists_pkey" PRIMARY KEY ("watchlistId","auctionId")
);

-- AddForeignKey
ALTER TABLE "AuctionsOnWatchLists" ADD CONSTRAINT "AuctionsOnWatchLists_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "WatchList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionsOnWatchLists" ADD CONSTRAINT "AuctionsOnWatchLists_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
