Ship tokens by Samuel Penn.
Licensed CC0. See https://gitlab.com/samuelpenn/spacecraft-dungeondraft

Tokens are sized according to ship tonnage. They are 256px per square, and designed
to fit onto the following square sizes:

| Squares | Tonnage     | Pixels |
|---------|-------------|--------|
| 1x1     |  <30t       | 256    |
| 2x2     | 30t - 99t   | 512    |
| 3x3     | 100t - 299t | 768    |
| 4x4     | 300t - 999t | 1,024  |
| 5x5     | 1,000t+     | 1,280  |
| 6x6     | 3,000t+     | 1,536  |
| 7x7     | 10,000t+    | 1,792  |
| 8x8     | 30,000t+    | 2,048  |
| 9x9     | 100,000t+   | 2,304  |
| 10x10   | 300,000t+   | 2,560  |

They don't have to be given these sizes, but it does give a consistent scaling
across ship sizes, with most ships being a reasonable size. The odd big ship
will still stand out though as something special.
