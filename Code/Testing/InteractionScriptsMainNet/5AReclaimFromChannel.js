//** This script is to be used as a demo to show how QNT can be returned to the sender of the channel after the channel has expired */

const OverledgerSDK = require('@quantnetwork/overledger-bundle').default;
const EthereumUintIntOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumUintIntOptions;
const EthereumTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumTypeOptions;
const EthereumBytesOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumBytesOptions;
const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
const waitForTxConfirmation = require('./HelperFunctions').waitForTxConfirmation;
const readSmartContractFunction = require('./HelperFunctions').readSmartContractFunction;
const InvokeSmartContractFunctionWithInputParams = require('./HelperFunctions').InvokeSmartContractFunctionWithInputParams;
const BN = require('bn.js');

//  ---------------------------------------------------------
//  -------------- BEGIN VARIABLES TO UPDATE ----------------
//  ---------------------------------------------------------

// The following are found from your Overledger Account:
const mappId = '';
const bpiKey = '';

//** The Ethereum addresses of the person withdrawing QNT from channel
const usersOperatorPrivateKey = '';
const usersOperatorAddress = '';

//computation price (in wei) for the Ethereum txs
const thisCompPrice = '40000000000';

// is this user a gateway?
const isGateway = false;

//** the address of the treasury factory proxy contract
const treasuryFactoryProxyAddress = "0x836fe8f597dc6cf4fb86bd3e86ad724dc4327560";
//the QNT testnet token address 
const ERC20ContractAddress = "0x4a220E6096B25EADb88358cb44068A3248254675";

//  ---------------------------------------------------------
//  -------------- END VARIABLES TO UPDATE ------------------
//  ---------------------------------------------------------

 //** helpervariables

 // computation limits for the transactions
 const smallFunctionCompLimit = '800000';
let emptyAddress = "0x0000000000000000000000000000000000000000";

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
const QNTSenderParams = [
    {  
    type: { selectedType: EthereumTypeOptions.BOOLEAN},
    name: 'operatorAddress', // Name of parameter
    value: false, 
  }
];

 //** load Overledger
 const overledger = new OverledgerSDK(mappId, bpiKey, {
  dlts: [{ dlt: DltNameOptions.ETHEREUM }],
  provider: { network: 'mainnet' },
});
//your operator address controls actions on the channel
overledger.dlts.ethereum.setAccount(usersOperatorPrivateKey);

//ok, run the main part of the computation
runFlow();

/** The main computation of this script */
async function runFlow(){

  console.log("**** START OF QNT RECLAIM SECTION****");
//** read the variables of the channel
  let currentChannel;
  if (isGateway == true){
    throw "only the treasury can reclaim from a treasury -> gateway channel"
  } else {
    currentChannel = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"mappChannel",OperatorAddressParams,AddressOutput)).results.toString();
  }
  if (currentChannel == emptyAddress){
    console.log("");
    throw "currentChannel: " + currentChannel + " is equal to: " + emptyAddress + ", therefore a payment channel needs to be created";
  } else {
    console.log("currentChannel test PASS");
  }

  //* has channel expired?
  const channelExpiry = parseInt((await readSmartContractFunction(overledger,currentChannel,"expiration",[],Uint256Output)).results.toString());
  let currentTime = Math.round((new Date()).getTime() / 1000);
  if (channelExpiry > currentTime){
    console.log("");
    throw "channelExpiry: " + channelExpiry + " greater than currentTime: " + currentTime + ", therefore you need to wait until this channel expires";
  } else {
    console.log("channelExpiry test PASS");
  }

  //* what is the channel balance?
  const channelCurrentQNTBalance = new BN((await readSmartContractFunction(overledger,currentChannel,"readQNTBalance",[],Uint256Output)).results.toString(),10);

  //* what address transfered QNT into the channel
  const channelUserQNTAddress = (await readSmartContractFunction(overledger,currentChannel,"senderAddress",QNTSenderParams,AddressOutput)).results.toString();
  
  //* what is the sendersQNTBalance
 const ERC20RequestorBalanceParams = [
  {  
  type: { selectedType: EthereumTypeOptions.ADDRESS},
  name: 'owner', // Name of parameter
  value: channelUserQNTAddress, 
}
];
  const yourQNTBalance = new BN((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString(),10);

//**reclaim from the channel
  const ReclaimParams = [
    {  
    type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
    name: 'tokenAmount', // Name of parameter
    value: channelCurrentQNTBalance.toString(), 
  }
];
//** reclaim all of the QNT from the channel
  const ReclaimFromChannelTxHash = await InvokeSmartContractFunctionWithInputParams(overledger,currentChannel,"reclaimQNT",ReclaimParams,smallFunctionCompLimit,thisCompPrice);
  //* wait for the transaction to confirm 
  await waitForTxConfirmation(ReclaimFromChannelTxHash,overledger,false);


//**check variables
//* check channel balance
const channelNewQNTBalance = new BN((await readSmartContractFunction(overledger,currentChannel,"readQNTBalance",[],Uint256Output)).results.toString(),10);

//* check senders balance
const yourNewQNTBalance = new BN((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString(),10);


//* verification check
if (channelNewQNTBalance.toString() != '0'){
    console.log("");
    throw "channelNewQNTBalance: " + channelNewQNTBalance + " not equal to 0 ";
} else {
    console.log("channelNewQNTBalance test PASS");
}
if (!(yourNewQNTBalance.eq(yourQNTBalance.add(channelCurrentQNTBalance)))){
    console.log("");
    throw "yourNewQNTBalance: " + yourNewQNTBalance + " not equal to yourQNTBalance.add(channelCurrentQNTBalance): " + yourQNTBalance.add(channelCurrentQNTBalance);
} else {
    console.log("yourNewQNTBalance test PASS");
}

console.log("**** END OF QNT RECLAIM SECTION****");

}


