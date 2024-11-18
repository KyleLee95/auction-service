Auction Site Requirements

Each team will deliver the design for and implementation of an Auction Site, modeled on eBay. Each team will be responsible for working through multiple iterations (the content of which the teams themselves will largely determine). These requirements may fluctuate during the course...as in a real development project. Continue to refer to this page at least weekly to see clarifications and modulations of the functional and technical requirements. Note also that many requirements will be clarified during the progress of the course itself in lectures.

Student teams are welcome (and especially encouraged) to utilize source code management systems to protect and share their team code. There are several available publicly, and if teams want, we can set up subversion for any team that desires us to.

A working frontend is required for this site, and should implement the features for your auction site; login to bid, create account, add item, delete item, etc. It does not need to be especially pretty or actually online(i.e. it can be run locally) but there needs to be a frontend that connects with a backend, server, etc. You can use any frontend framework you like, but again it must have a real connection to your backend. We will not be grading on how the frontend looks, rather just that it is available and has the functionality below implemented.

Note: These functions overlap with many backend functions, but these actions will also have a frontend component as well. That is, they can be done or accessed through the frontend.

You must use at least 2 different databases in your project. One must be SQL-based, and one must be NOSQL-based. It is your call as to what particular databases you actually want to use (i.e., you could choose MySQL or Postgres for the SQL requirement and you could use MongoDB or Cassandra for the NOSQL requirement), but you must use one SQL database and one NOSQL database. For example, you might decide to use a MySQL database to store customer data (name, phone number, address, email, etc) and a NOSQL database such as MongoDB to store auction item information or logging information. Note you must use a database server-based system. You may not use sqlite3 (even though you are allowed to do so in the labs, you may not use sqllite for the final project).

FrontEnd Functions:

- Create Use
  -Delete User
  -Suspend User
  -Login
  -Logout
  -See active actions
  -Add Item
  -Bid on Item
  -Remove Item
  -Purchase Item

Database Functions:

- Store Data in a persistent manner. (If the user shuts down your app, then powers it back up, all the data from the previous instance should still be there)
- Retrieval of stored data by both Frontend and Backend services. (For example, retrieval of all auction items for a specific user)
- Ability to perform all CRUD operations on your data from both the Frontend and Backend services.
- Database should scale as data are added or removed.

Admin Functions:

- [ ] Stop an auction early
- [ ] View all items that have been flagged by users
- [ ] View all auctions currently in progress, and include sorting capability so that auctions ending soonest can be displayed first
- [ ] Add, modify, or remove categories

-Remove and block a user
-Examine metrics for closed auctions in a given timeframe(last day, week, month, etc)
-Examine emails that are received by customer support, and respond to these emails within the admin functionality

`GET /api/auctions?bidOnByUser={userId}`

## Auction:

- [x] Allow listing of items for bidding
- [x] List an item for auction:

  - item should have:
    - [x] start price,
    - [x] start time,
    - [x] time when the auction expires,
    - [x] quantity,
    - [x] shipping costs,
    - [x] buy now feature if applicable,
    - [x] item description,
    - [ ] seller rating (have to get from daniel's service)

- [x] Allowing auction window to be set by the seller,
- [x] Allow bid to be placed, and increment bid amount as users enter new bids
- [x] Allow item to be categorized by user
- [x] Allow search of items on the site by keyword, or item category
- [x] Allow multiple bids to be placed at once by different users

- [ ] Allow item to be placed on a watchlist for a user, that includes parameters defined by the user(i.e. Ray-Ban sunglasses less than $100 in starting price)

- [x] Remove auction once bidding is complete and user checkouts out (set
      inactive)

- [ ] Begin countdown to the end of the bidding window once auction begins

## User-Auction Interactions

- [x] See a list of all items that are currently being bid on by that user
- [x] Update an item properties, including quantity, description, shipping costs, buy now feature
- [x] Flag an item as inappropriate or counterfeit

- [ ] Categorize an item based on existing categories or create an new category if needed

- [ ] Delete an item if there are no bids on it, but do not allow an item to be deleted if there are bids on it

- [x] Bid on an item
  - [x] update that bid if another user outbids that user

## Alerts

- [ ] Setup AWS Lambda functions to trigger these events.

  - [ ] Pipeline is:
    - API Request -> SNS + SQS -> Lambda -> SES

- [ ] Alert seller when their item has been bid on with an email
- [ ] Alert buyer via email when someone has placed a higher bid on the item they had bid current high bid on
- [ ] Alert both seller and bidders when on predetermined time setting, 1 day before bidding ends, 1 hour before bidding ends, etc

- [ ] Send a email notification to user when an item on their watchlist appears matching their criteria

## Cart and Checkout

- Implementation of a shopping cart that will store multiple items in it while the user shops on the site

- [ ] Allow item to be place in the shopping cart if the Buy Now feature is selected

- [ ] Place item in a user's cart if they have the winning bid when the auction expires

- [ ] Allow a user to checkout from their cart once there are items in it

- [ ] Add item to cart directly via the Buy Now functionality

- [ ] Checkout of the auction once winning by selecting checkout from the cart

User Functions:

- Create a new user(user should have the ability to place bids on a item(s) or place an item for sale, or both)
- Update a user’s information
- Delete a user
- Suspend an account
