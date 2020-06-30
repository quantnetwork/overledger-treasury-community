//** This script is to be used as whenever you want to increase the timeout of a channel */
//** WARNING: carefully check the variables to update to make sure that they are correct, especially the isGateway variable -> 
// otherwise you may increase the timeout of the wrong channel!
const OverledgerSDK = require('@quantnetwork/overledger-bundle').default;
const EthereumUintIntOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumUintIntOptions;
const EthereumTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumTypeOptions;
const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
const waitForTxConfirmation = require('./HelperFunctions').waitForTxConfirmation;
const readSmartContractFunction = require('./HelperFunctions').readSmartContractFunction;
const InvokeSmartContractFunctionWithInputParams = require('./HelperFunctions').InvokeSmartContractFunctionWithInputParams;
 const web3 = require('web3');
 const BN = require('bn.js');

//  ---------------------------------------------------------
//  -------------- BEGIN VARIABLES TO UPDATE ----------------
//  ---------------------------------------------------------

// The following are found from your Overledger Account:
const mappId = '';
const bpiKey = '';

//** The operator address and key of the channel sender
const operatorPrivateKey = '';
const operatorAddress = '';

//** whether this user is a gateway (true) or a mapp (false)
const isGateway = false;

//** the address of the treasury factory proxy contract
const treasuryFactoryProxyAddress = "0x836fe8f597dc6cf4fb86bd3e86ad724dc4327560";

//computation price (in wei) for the Ethereum txs
const thisCompPrice = '40000000000';

// what will be the channel's new timeout
const currentTime = Math.round((new Date()).getTime() / 1000);
const hoursUntilTimout = 72;
const numberOfMinutes = 60;
const numberOfSeconds = 60;
const channelTimeOut = currentTime + (hoursUntilTimout*(numberOfMinutes*numberOfSeconds));
//  ---------------------------------------------------------
//  -------------- END VARIABLES TO UPDATE ------------------
//  ---------------------------------------------------------

//** helper variable

 // computation limits for the transactions
 const smallFunctionCompLimit = '800000';
 // emptyAddress used for validation checks
 let emptyAddress = "0x0000000000000000000000000000000000000000";
  // instructions on how to parse an uint256 param, in standardised form
  const Uint256Output = [
        {  
          type: {selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256}
        }
  ];

  // instructions on how to parse an address param, in standardised form
      const AddressOutput = [
        {  
          type: {selectedType: EthereumTypeOptions.ADDRESS}
        }
  ];

  // the operator params, in standardised form
  const IncreaseTimeParams = [
    {  
    type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
    name: 'updateExpirationTime', // Name of parameter
    value: channelTimeOut.toString(), 
  }
];

  // the operator params, in standardised form
  const OperatorAddressParams = [
    {  
    type: { selectedType: EthereumTypeOptions.ADDRESS},
    name: 'operatorAddress', // Name of parameter
    value: operatorAddress, 
  }
];

//** load Overledger
const overledger = new OverledgerSDK(mappId, bpiKey, {
  dlts: [{ dlt: DltNameOptions.ETHEREUM }],
  provider: { network: 'mainnet' },
});
// your operator is used as your QNT address should be a cold one
overledger.dlts.ethereum.setAccount(operatorPrivateKey);

//ok, run the main part of the computation
runFlow();

/** The main computation of this script */
async function runFlow(){

  console.log("****START OF INCREASE PAYMENT CHANNEL TIMEOUT SECTION****");
  //**find channel and read expiry
  let currentChannel;
  if (isGateway == true){
    currentChannel = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"gatewayChannel",OperatorAddressParams,AddressOutput)).results.toString();
  } else {
    currentChannel = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"mappChannel",OperatorAddressParams,AddressOutput)).results.toString();
  }
  //make sure that the user has a channel
  if (currentChannel == emptyAddress){
    console.log("");
    throw "currentChannel: " + currentChannel + " is equal to: " + emptyAddress + ", therefore a payment channel needs to be created";
  } else {
    console.log("currentChannel test PASS");
  }
  //read expiry from the channel, make sure that the timeout is less than the new one
  const currentChannelExpiry = parseInt((await readSmartContractFunction(overledger,currentChannel,"expiration",[],Uint256Output)).results.toString());
  if (currentChannelExpiry > channelTimeOut){
    console.log("");
    throw "currentChannelExpiry: " + currentChannelExpiry + " greater than channelTimeOut: " + channelTimeOut + ", therefore the expiry time on the channel will not be increased";
  } else {
    console.log("channelExpiry test PASS");
  }

  //** increase timeout
  const IncreaseExpiryTxHash = await InvokeSmartContractFunctionWithInputParams(overledger,currentChannel,"updateExpirationTime",IncreaseTimeParams,smallFunctionCompLimit,thisCompPrice);
  //* wait for the transaction to confirm 
  await waitForTxConfirmation(IncreaseExpiryTxHash,overledger,false);

  //** check that the expiry has been increased
  const newChannelExpiry = parseInt((await readSmartContractFunction(overledger,currentChannel,"expiration",[],Uint256Output)).results.toString());
  if (newChannelExpiry != channelTimeOut){
    console.log("");
    throw "newChannelExpiry: " + newChannelExpiry + " not equal to channelTimeOut: " + channelTimeOut;
  } else {
    console.log("channelExpiry test PASS");
  }

  console.log("****END OF INCREASE PAYMENT CHANNEL TIMEOUT SECTION****");

}