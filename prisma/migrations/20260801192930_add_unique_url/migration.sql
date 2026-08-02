/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Item_url_key" ON "Item"("url");
