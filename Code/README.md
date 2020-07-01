# Interact with the Treasury

In this section we will firstly describe what is in the Code folder and secondly describe how to use the associated scripts to interact with the treasury. If you would like to learn more about the treasury, see [the treasury video introduction](https://www.youtube.com/watch?v=tTdVrBv1bU4&t).

In the Code folder you will see the SmartContracts subfolder that contains:
- AbstractsAndInterfaces: These are the smart contract abstract and interfaces that the other contracts use.
- MainContractsMainNet: These are the main treasury smart contracts for the Ethereum mainnet.
- MainContractsTestNet: These are the main treasury smart contracts for the Ethereum Ropsten testnet. They are slightly different to the mainnet versions, as the testnet versions point to the testnet QNT ERC20 contract.
- ProxyContracts: These are contracts that implement our smart contract upgradeability mechanism.

In the Code folder you will also see the Testing subfolder that contains:
- CompliedBytecodeMainNet: The compiled version of the mainnet smart contracts. Using Solidity compiler 0.5.17+commit.d19bba13.
- CompliedBytecodeTestNet: The compiled version of the testnet smart contracts. Using Solidity compiler 0.5.17+commit.d19bba13.  These are slightly different to the mainnet versions, as the testnet versions point to the testnet QNT ERC20 contract.
- InteractionScriptsMainNet: Scripts that can be used to interact with the mainnet treasury smart contracts through Overledger
- InteractionScriptsTestNet: Scripts that can be used to interact with the testnet treasury smart contracts through Overledger

## Prerequisites

To use the interaction scripts, you need to: 

- Register for a developer account* on [Quant Developer's Portal](https://developer.quant.network). To do so, you will provide: one address to be your designed QNT wallet address (where QNT is taken from and/or paid into); and another address to be your designed operator address that can interact with the treasury smart contracts.
- acquire a MApp ID and BPI key to use the associated scripts
- Have Node.js 10 installed, as this is required to install the Javascript SDK used by all of the interaction scripts, see [the JS SDK installation instructions here](https://github.com/quantnetwork/overledger-sdk-javascript#installation).

*Note that of course you can also register for a gateway owner account instead of a developer account. But if you do, you will not be able to run the majority of the interaction scripts as a gateway owner relies on payment channel messages coming from the treasury.

## Setup

Firstly you need to decide whether to interact with the Ropsten testnet or Ethereum mainnet treasury. If you choose testnet, then after you have been authorised, Quant Network will send you testnet QNT to your testnet QNT Wallet address and provide you with an email confirmation.

For transparency, the treasury smart contract addresses are as follows:

Testnet Treasury Smart Contract Addresses:
- Treasury Proxy: `0x3e29e13ef3241d5858eeaff70e5a25f0b424c38b`
- Treasury Factory Proxy: `0x4a42aa05fb7cd58e9e388c82ec11b811bdf5ada7`
- Treasury Deposit Proxy: `0xb60bc1b22f322a5ddc214f0d0fb14260746d50bb`
- Treasury Rulelist Proxy: `0x963e705d50bde3f21a03cacf03e045b3599568ca`


Mainnet Treasury Smart Contract Addresses:
- Treasury Proxy: `0x2ee1f3535325bc596f616f0591d1a1bc85164775`
- Treasury Factory Proxy: `0x836fe8f597dc6cf4fb86bd3e86ad724dc4327560`
- Treasury Deposit Proxy: `0x83e9918ddee45a661a31a63474f864d77b156724`
- Treasury Rulelist Proxy: `0xff42f979d183c88e930bb07ab88ff1211679814b`

Note that to see the code of the logic implementations of these proxy contracts, look the contract up on Etherscan, browse to it's Read as Proxy section and then click on the implementation address shown.

## Interaction Steps

### Step 1: QNT Approval Ethereum Transaction

Assuming you have the QNT in your QNT Wallet address, now you need to approve the treasury factory smart contract to take the QNT and move it into your payment channel and escrowed deposit smart contract.

The testnet address to approve is: `0x4a42aa05fb7cd58e9e388c82ec11b811bdf5ada7`

The mainnet address to approve is: `0x836fe8f597dc6cf4fb86bd3e86ad724dc4327560`

This approval needs to be sent to the QNT ERC-20 smart contract.

The QNT ERC-20 testnet address is: `0x19Bc592A0E1BAb3AFFB1A8746D8454743EE6E838`

The QNT ERC-20 mainnet address is: `0x4a220E6096B25EADb88358cb44068A3248254675`

This can be completed using your usual method (e.g. va a MetaMask transaction), or you can run the `1ApproveQNTTransfer.js` script from the chosen network's interactionScripts folder. If you use the script, make sure to fill in the `BEGIN VARIABLES TO UPDATE` section correctly.

Note that during this trial period for the testnet version, you need to approve 100 QNT that will go into your payment channel, and any amount you approved for the treasury factory smart contract that is greater than 100 QNT will be moved into your escrow deposit contract.

Once the approval transaction has been confirmed, during this trial period, you need to contact Quant Network via email (reply to your registration authorisation email) and include the transaction hash for the QNT approval.

### Step 2: Payment Channel and Escrow Deposit Creation Transaction

The next step is for Quant Network to move your QNT into a newly created payment channel and escrow deposit. For our testnet version, the initial expiry time of your payment channel will be a short lockup period (48 hours) so that you can quickly perform any required testing. Note that if desired, you will be able to increase the expiration period of your payment channel using an on-chain transaction (see Step 4).

Once, Quant Network has created your payment channel and escrow deposits, you will be sent an email confirmation with the relevant details.

Note that you will also be able to find your payment channel and escrow deposits contract addresses on-chain by passing your operator address to the mappChannel and mappDeposit function of the Treasury Factory Proxy smart contract respectively. Note that if you take on the role of gateway owner instead of developer, you will be able to find your channel and escrow deposit addresses instead through the gatewayChannel and gatewayDeposit functions of the Treasury Factory Proxy smart contract. Additionally, note that the other interaction scripts in this repository find your payment channel and escrow deposit addresses as part of their normal operation. 

### Step 3: Use Payment Channel Offchain and Send QNT Payments through the Channel with an Onchain Transaction

Now that you have a payment channel established, you can start to use it!

For testing purposes, you can use the `3UsePaymentChannels.js` script. If you use the script, make sure to fill in the `BEGIN VARIABLES TO UPDATE` section correctly. What this script basically does is that it generates a few payments off-chain, signing each one of them using your operator address. Eventually, the one with the highest value is sent to your payment channel to push through the payment to the receiver of this channel. In practice, it would be the treasury sending the final payment to claim QNT from the developer's channel (or the gateway claiming from the treasury's channel), but for testing purposes this demonstration shows all of the on chain steps.

Note that only the receiver's operator address and the sender's operator address have permission to transfer QNT from the payment channel and into the receiver's QNT wallet address. Additionally this QNT movement can only occur if an on-chain transaction is sent to the payment channel smart contract with an embedded signed message by the sender's operator address stating this amount of QNT can be moved from the channel.


### Step 4: Increase Payment Channel Expiration Time

If your payment channel has expired then you may want to extend its expiration time.  

To do so, you will need to send an on-chain transaction to invoke the updateExpirationTime function of your payment channel smart contract stating the amount of time to increase the expiration by (note that time is formatted in the unix style). An example of how this can be done is found via the `4IncreaseChannelTimeOut.js` script. If you use the script, make sure to fill in the `BEGIN VARIABLES TO UPDATE` section correctly.

Note that only the sender's operator address has permission to extend the expiration time of the payment channel.


### Step 5: Reclaim QNT After Payment Channel Expiry

If your payment channel has expired then you may want to withdraw your QNT from both of your payment channel and your escrowed deposit contract.   

To withdraw QNT from your payment channel you need to send an on-chain transaction to invoke the reclaimQNT function of your payment channel smart contract stating the amount of QNT that you want to withdraw. An example of how this can be done is found via the `5AReclaimFromChannel.js` script. If you use the script, make sure to fill in the `BEGIN VARIABLES TO UPDATE` section correctly.

Note that only the sender's operator address has permission to reclaim QNT from the payment channel (which will be transfered back into the sender's QNT wallet address) and this can only occur after the payment channel's expiration time has passed.

Additionally, To withdraw QNT from your escrowed deposit you need to send an on-chain transaction to invoke the WithdrawDeposit function of your escrowed deposit contract stating the amount of QNT that you want to withdraw. An example of how this can be done is found via the `5BDepositWithdraw.js` script. If you use the script, make sure to fill in the `BEGIN VARIABLES TO UPDATE` section correctly.

Note that only the depositor's operator address has permission to reclaim QNT from the payment channel (which will be transfered back into the depositor's QNT wallet address) and this can only occur after the related payment channel's expiration time has passed.

After you reclaim all of your QNT from the payment channel, you will need to transfer some more back into your payment channel smart contract address should you want to continue using it again. An example of how this can be done is found via the `5CSendTestQNT.js` script. If you use the script, make sure to fill in the `BEGIN VARIABLES TO UPDATE` section correctly.

## Conclusion

Through the examples, you can see how:
- QNT is locked in the payment channel and escrow deposit contracts
- Off-chain payments can be made and sent through a payment channel
- Un-used QNT can be reclaimed from the payment channel and escrow deposit.

Feedback is welcome. Please direct general comments to support@quant.network or for github improvement suggestions open a pull request.
