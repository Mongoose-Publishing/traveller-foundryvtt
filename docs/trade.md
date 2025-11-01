# Trade

A number of properties to govern prices of cargo.

`cost` is standard price for buying goods.
`cargo.price` is the base price for a cargo item. This is never modified after creation.


When good costs are calculated:
  `cost` is set to be the buy price.
  `cargo.salePrice` is the calculated price which the cargo can be sold at.

