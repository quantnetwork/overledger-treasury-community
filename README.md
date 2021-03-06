# Overledger Network Community Treasury

The community treasury's role is to handle QNT payments flowing from users to the gateways in such a way as to disincentivise faulty behaviour from any user or gateway, and to do so in a manner where it can be held accountable to any observer.

The white paper (found [here](OverledgerNetworkTreasury.pdf)) describes aspects of the Overledger Network, discusses the community treasury's role in handling payments between users and gateways using _layer 2 unidirectional payment channels_; and details how the community treasury enforces rules between the users and gateways, known as _payment contracts_, which dis-incentivises faulty behaviour using a game theoretic model. Using payment channels allows QNT transfers between users and gateways following through the community treasury to be quick, significantly reduce their Ether fees and be publicly verifiable upon channel settlement. Additionally, the implementation of these payment contracts will be a breakthrough for the distributed ledger domain. With payment contracts, users not running a distributed ledger node can ask multiple gateways to perform a request where the responses will be compared for verification purposes. Therefore, not only do distributed ledger networks provide a method to establish trust between different parties running different nodes, but the Overledger Network will provide a method to establish trust between users not running a node and parties running nodes.

## Overledger Network Community Treasury Code

The first version of the community treasury code has now been released, please see the [Code folder](https://github.com/quantnetwork/overledger-treasury-community/tree/master/Code). There is further information in the readme file of that folder.

## Overledger Network Community Treasury Feedback

Feedback is welcome. Please direct general comments to support@quant.network or for github improvement suggestions open a pull request.
