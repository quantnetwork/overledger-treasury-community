//** This script is to be used as a demo to show a payment channel working */
//** WARNING: carefully check the variables to update to make sure that they are correct, especially the isGateway variable -> 
// otherwise you could send the transaction to the wrong channel!

const OverledgerSDK = require('@quantnetwork/overledger-bundle').default;
const EthereumUintIntOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumUintIntOptions;
const EthereumTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumTypeOptions;
const EthereumBytesOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumBytesOptions;
const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
const waitForTxConfirmation = require('./HelperFunctions').waitForTxConfirmation;
const readSmartContractFunction = require('./HelperFunctions').readSmartContractFunction;
const InvokeSmartContractFunctionWithInputParams = require('./HelperFunctions').InvokeSmartContractFunctionWithInputParams;

const Web3 = require('web3');
const web3 = new Web3();
const BN = require('bn.js');
const abi = require('ethereumjs-abi');
//  ---------------------------------------------------------
//  -------------- BEGIN VARIABLES TO UPDATE ----------------
//  ---------------------------------------------------------

// The following are found from your Overledger Account:
const mappId = '';
const bpiKey = '';

//** The Ethereum addresses of user to register's QNTAddress and operator
const usersOperatorPrivateKey = '';
const usersOperatorAddress = '';

//treasury smart contract proxy addresses generated from the Deploy treasury script, and printed at the bottom of that script
const treasuryFactoryProxyAddress = "0x4a42aa05fb7cd58e9e388c82ec11b811bdf5ada7";

//computation price (in wei) for the Ethereum txs
const thisCompPrice = '8000000000';

// how much to transfer to the channel in individual payment
const tokensIncrements = new BN(('1000000000000000000').toString(), 10); //1 QNT (with 18 decimal zeros)
// after how many individual payments to force a claim from the channel
const loopNumber = 5;
// is this user a gateway?
const isGateway = false;

//the QNT testnet token address (from script 0)
const ERC20ContractAddress = "0x19Bc592A0E1BAb3AFFB1A8746D8454743EE6E838";

//  ---------------------------------------------------------
//  -------------- END VARIABLES TO UPDATE ------------------
//  ---------------------------------------------------------

//** helper variable
let emptyAddress = "0x0000000000000000000000000000000000000000";
const safeNumberOfMinutesUntilTimeOut = 30;
const numberOfSeconds = 60;
const secondsUntilTimeout = 15; // a response for an OVL requested task is required by this time
const secondsUntilDisputeTimeout = 30; // after this time, the developer cannot raise a dispute on the returned response from a gateway
const paymentNumberClaim = new BN((loopNumber).toString(), 10); 
 // computation limits for the transactions
 const smallFunctionCompLimit = '800000';



  // instructions on how to parse an address param, in standardised form
  const AddressOutput = [
        {  
          type: {selectedType: EthereumTypeOptions.ADDRESS}
        }
  ];

      // instructions on how to parse an uint256 param, in standardised form
  const Uint256Output = [
        {  
          type: {selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256}
        }
  ];

  // the operator params, in standardised form
const OperatorAddressParams = [
    {  
    type: { selectedType: EthereumTypeOptions.ADDRESS},
    name: 'operatorAddress', // Name of parameter
    value: usersOperatorAddress, 
  }
];

  // the QNT Receiver params, in standardised form
const QNTReceiverParams = [
    {  
    type: { selectedType: EthereumTypeOptions.BOOLEAN},
    name: 'operatorAddress', // Name of parameter
    value: false, 
  }
];

//** load Overledger
 const overledger = new OverledgerSDK(mappId, bpiKey, {
    dlts: [{ dlt: DltNameOptions.ETHEREUM }],
    provider: { network: 'testnet' },
});
  // your operator is used as your QNT address should be a cold one
overledger.dlts.ethereum.setAccount(usersOperatorPrivateKey);

//ok, run the main part of the computation
runFlow();

async function runFlow(){

  console.log("****START OF THE USE PAYMENT CHANNEL SECTION****");
  console.log("tokensIncrements: " + tokensIncrements.toString());
  console.log("paymentNumberClaim: " + paymentNumberClaim.toString());
  //**readvariables
  //* check user has a payment channel
  let currentChannel;
  let currentDeposit;
  if (isGateway == true){
    currentChannel = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"gatewayChannel",OperatorAddressParams,AddressOutput)).results.toString();
    currentDeposit = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"gatewayDeposit",OperatorAddressParams,AddressOutput)).results.toString();
  } else {
    currentChannel = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"mappChannel",OperatorAddressParams,AddressOutput)).results.toString();
    currentDeposit = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"mappDeposit",OperatorAddressParams,AddressOutput)).results.toString();
  }

  if (currentChannel == emptyAddress){
    console.log("");
    throw "currentChannel: " + currentChannel + " is equal to: " + emptyAddress + ", therefore a payment channel needs to be created";
  } else {
    console.log("currentChannel test PASS");
  }
  if (currentDeposit == emptyAddress){
    console.log("");
    throw "currentDeposit: " + currentDeposit + " is equal to: " + emptyAddress + ", therefore a escrowed deposit needs to be created";
  } else {
    console.log("currentDeposit test PASS");
  }
  //* check that the payment channel is open
  const channelExpiry = parseInt((await readSmartContractFunction(overledger,currentChannel,"expiration",[],Uint256Output)).results.toString());
  const depositExpiry = parseInt((await readSmartContractFunction(overledger,currentDeposit,"expiration",[],Uint256Output)).results.toString());
  let currentTime = Math.round((new Date()).getTime() / 1000);
  const safeChannelClaimPeriod = currentTime + (safeNumberOfMinutesUntilTimeOut*numberOfSeconds);
  if (channelExpiry <= safeChannelClaimPeriod){
    console.log("");
    throw "channelExpiry: " + channelExpiry + " less than safeChannelClaimPeriod: " + safeChannelClaimPeriod + ", therefore the expiry time on the channel needs to be increased";
  } else {
    console.log("channelExpiry test PASS");
  }
  if (depositExpiry <= safeChannelClaimPeriod){
    console.log("");
    throw "depositExpiry: " + depositExpiry + " less than safeChannelClaimPeriod: " + safeChannelClaimPeriod + ", therefore the expiry time on the channel needs to be increased";
  } else {
    console.log("depositExpiry test PASS");
  }

  //** gather other params required for off-chain messaging
  //* get the current channel nonce
  const channelCurrentNonce = (await readSmartContractFunction(overledger,currentChannel,"currentNonce",[],Uint256Output)).results.toString();

  //* get the current balance of the channel
  const channelCurrentQNTBalance = new BN((await readSmartContractFunction(overledger,currentChannel,"readQNTBalance",[],Uint256Output)).results.toString(),10);
  
  //* work out the total amount to claim from the channel
  const totalOffChainPaymentAmount = tokensIncrements.mul(paymentNumberClaim);
  console.log("channelCurrentQNTBalance: " + channelCurrentQNTBalance);
  console.log("totalOffChainPaymentAmount: " + totalOffChainPaymentAmount);
  //* proceed only if the total amount to claim is greater than the payment channel's balance
  if (channelCurrentQNTBalance.lt(totalOffChainPaymentAmount)){
    console.log("");
    throw "channelCurrentQNTBalance: " + channelCurrentQNTBalance + " less than totalOffChainPaymentAmount: " + totalOffChainPaymentAmount + ", therefore the you need to adjust the token amount variables in this script or top up the payment channel";
  } else {
    console.log("channelCurrentQNTBalance test PASS");
  }
  //* get the QNT Address of channel receiver
  const channelUserQNTAddress = (await readSmartContractFunction(overledger,currentChannel,"receiverAddress",QNTReceiverParams,AddressOutput)).results.toString();
  
  //* what is the receiversQNTBalance
   const ERC20RequestorBalanceParams = [
  {  
  type: { selectedType: EthereumTypeOptions.ADDRESS},
  name: 'owner', // Name of parameter
  value: channelUserQNTAddress, 
  }
  ];
  const receiverCurrentQNTBalance = new BN((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString(),10);


  //** now perform the off chain message payment build up
  let count = 1;
  let currentOffChainPayment;
  let newTokenAmount = tokensIncrements;
  let functionTimeOut;
  let disputeTimeOut;
  while (count <= loopNumber){
    sleep(2000);
    //generate the next total token amount
    newTokenAmount = tokensIncrements.mul(new BN((count).toString(), 10));
    currentTime = Math.round((new Date()).getTime() / 1000);
    //redo the expiry times for firstly the gateway to reply to a function call and secondly for the dispute time to end
    functionTimeOut = currentTime + secondsUntilTimeout;
    disputeTimeOut = currentTime + secondsUntilDisputeTimeout;
    //compute the message to send via layer 2 offchain
    currentOffChainPayment  = await computeSignature(channelUserQNTAddress,newTokenAmount, channelCurrentNonce, functionTimeOut, disputeTimeOut,currentChannel);
    count = count + 1;
  }

  //the total we will now be pushing through the channel onchain
  console.log("Total to claim: " + newTokenAmount.toString());

  //** force an on-chain claim on the payment channel
  //* set the params of this claim
  const claimFromChannelParams = [
    {  
    type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
    name: 'tokenAmount', // Name of parameter
    value: newTokenAmount.toString(), //claim the total amount of all of the individual off-chain payments
    },
    {  
    type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
    name: 'timeout', // Name of parameter
    value: functionTimeOut.toString(),  //this is the last function time out - for verification purposes if there is a dispute
    },
    {  
    type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
    name: 'disputeTimeout', // Name of parameter
    value: disputeTimeOut.toString(), //this is the last dispute time out. Disputes raised after this time will not be evaluated
    },
    {  
    type: { selectedType: EthereumTypeOptions.BYTES_B, selectedBytesLength: EthereumBytesOptions.NO_DEFINED_LENGTH },
    name: 'signature', // Name of parameter
    value: currentOffChainPayment.signature.toString(),  //this is the signed last offchain payment message
    },
    {  
    type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
    name: 'refund', // Name of parameter
    value: '0', //when forcing through a payment on the channel, no refund can be given to the sender
    }
  ];
  //**now send this payment channel on-chain message
  const forceQNTClaimOnChannelTxHash = await InvokeSmartContractFunctionWithInputParams(overledger,currentChannel,"claimQNTPayment",claimFromChannelParams,smallFunctionCompLimit,thisCompPrice);
  //* wait for the transaction to confirm   
  await waitForTxConfirmation(forceQNTClaimOnChannelTxHash,overledger,false);

  //**check that the payment channel has been updated correctly
  //* new balance of the channel
  const channelNewQNTBalance = new BN((await readSmartContractFunction(overledger,currentChannel,"readQNTBalance",[],Uint256Output)).results.toString(),10);
  if (!(channelNewQNTBalance.eq(channelCurrentQNTBalance.sub(newTokenAmount)))){
    console.log("");
    throw "channelNewQNTBalance: " + channelNewQNTBalance + " not equal to channelCurrentQNTBalance - newTokenAmount: " + channelCurrentQNTBalance.sub(newTokenAmount).toString() + ", therefore the you need to adjust the token amount variables in this script or top up the payment channel";
  } else {
    console.log("channelNewQNTBalance test PASS");
  }

  //* new channel nonce
  const channelNewNonce = (await readSmartContractFunction(overledger,currentChannel,"currentNonce",[],Uint256Output)).results.toString();
  if (parseInt(channelNewNonce) != parseInt(channelCurrentNonce)+1){
    console.log("");
    throw "channelNewNonce: " + channelNewNonce + " not equal to channelCurrentNonce+1: " + (parseInt(channelCurrentNonce)+1).toString();
  } else {
    console.log("channelNewNonce test PASS");
  }

  //* new receiver balance
  const receiverNewQNTBalance = new BN((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString(),10);
  if (!(receiverNewQNTBalance.eq(receiverCurrentQNTBalance.add(newTokenAmount)))){
    console.log("");
    throw "receiverNewQNTBalance: " + receiverNewQNTBalance.toString() + " not equal to receiverCurrentQNTBalance+newTokenAmount: " + receiverCurrentQNTBalance.add(newTokenAmount).toString();
  } else {
    console.log("receiverNewQNTBalance test PASS");
  }

  console.log("****END OF THE USE PAYMENT CHANNEL SECTION****");

}


//compute signature
async function computeSignature(QNTAddressOfReceiver,tokenAmount, currentNonce, timeout, disputeTimeout,paymentChannelAddress) {
    // ****** Compute the signature to be sent off chain to the party which is claiming the tokens' amount ******
    const msgHash = constructPaymentMessage(QNTAddressOfReceiver, tokenAmount, currentNonce, timeout, disputeTimeout, paymentChannelAddress);
    const sig = await signMessage(msgHash, usersOperatorPrivateKey);
    const paramsToUseToClaimThePayment = { QNTAddressReceiver: QNTAddressOfReceiver, amount: tokenAmount, nonce: currentNonce, timeForResponse: timeout, timeForDispute: disputeTimeout, channelAddress: paymentChannelAddress, signature: sig.signature };
    console.log(`Claiming the payment with these parameters: ${JSON.stringify(paramsToUseToClaimThePayment)}`);
    return sig;
}

async function signMessage(messageHash, privateKey) {
  const signAccounts = await web3.eth.accounts.sign(messageHash, privateKey);
  return signAccounts;
}

function constructPaymentMessage(QNTAddressOfReceiver,tokenAmount, currentNonce, timeout, disputeTimeout,paymentChannelAddress) {
  const types = ["address", "uint256", "uint256", "uint256", "uint256", "address"];
  const values = [QNTAddressOfReceiver,tokenAmount, currentNonce, timeout, disputeTimeout,paymentChannelAddress];
  const hash = "0x" + abi.soliditySHA3(types, values).toString('hex');
  console.log(`hash ${hash}`);
  return hash;
}

/**
 * Sleeps for a number of miliseconds
 * @param {*} ms - the number of miliseconds
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}