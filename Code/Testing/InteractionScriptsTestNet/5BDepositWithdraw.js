//** This script is to be used as a demo to show how QNT can be returned to the sender of the escrow after the escrow has expired */

const OverledgerSDK = require('@quantnetwork/overledger-bundle').default;
const EthereumUintIntOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumUintIntOptions;
const EthereumTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumTypeOptions;
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

//** The Ethereum addresses of the person withdrawing QNT from escrow
const usersOperatorPrivateKey = '';
const usersOperatorAddress = '';

//computation price (in wei) for the Ethereum txs
const thisCompPrice = '20000000000';

// is this user a gateway?
const isGateway = false;

//treasury factory address
const treasuryFactoryProxyAddress = "0x4a42aa05fb7cd58e9e388c82ec11b811bdf5ada7";
//the QNT testnet token address 
const ERC20ContractAddress = "0x19Bc592A0E1BAb3AFFB1A8746D8454743EE6E838";

//  ---------------------------------------------------------
//  -------------- END VARIABLES TO UPDATE ------------------
//  ---------------------------------------------------------

 //** helpervariables
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

 //** load Overledger
 const overledger = new OverledgerSDK(mappId, bpiKey, {
  dlts: [{ dlt: DltNameOptions.ETHEREUM }],
  provider: { network: 'testnet' },
});
overledger.dlts.ethereum.setAccount(usersOperatorPrivateKey);

//ok, run the main part of the computation
runFlow();

/** The main computation of this script */
async function runFlow(){

  console.log("**** START OF QNT RECLAIM SECTION****");
//** read the variables of the escrow
  let currentEscrow;
  if (isGateway == true){
    currentEscrow = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"gatewayDeposit",OperatorAddressParams,AddressOutput)).results.toString();
  } else {
    currentEscrow = (await readSmartContractFunction(overledger,treasuryFactoryProxyAddress,"mappDeposit",OperatorAddressParams,AddressOutput)).results.toString();
  }
  if (currentEscrow == emptyAddress){
    console.log("");
    throw "currentEscrow: " + currentEscrow + " is equal to: " + emptyAddress + ", therefore a payment channel needs to be created";
  } else {
    console.log("currentEscrow test PASS");
  }

  //* has escrow expired?
  const escrowExpiry = parseInt((await readSmartContractFunction(overledger,currentEscrow,"expiration",[],Uint256Output)).results.toString());
  let currentTime = Math.round((new Date()).getTime() / 1000);
  if (escrowExpiry > currentTime){
    console.log("");
    throw "escrowExpiry: " + escrowExpiry + " greater than currentTime: " + currentTime + ", therefore you need to wait until the related payment channel expires";
  } else {
    console.log("escrowExpiry test PASS");
  }

  //* what is the escrow balance?
  const escrowCurrentQNTBalance = new BN((await readSmartContractFunction(overledger,currentEscrow,"readQNTBalance",[],Uint256Output)).results.toString(),10);

  //* who is the escrows senders QNT address?
  const escrowUserQNTAddress = (await readSmartContractFunction(overledger,currentEscrow,"MAPPorGatewayQNTAddress",[],AddressOutput)).results.toString();
  
  //* what is the senders QNTBalance
 const ERC20RequestorBalanceParams = [
  {  
  type: { selectedType: EthereumTypeOptions.ADDRESS},
  name: 'owner', // Name of parameter
  value: escrowUserQNTAddress, 
}
];
  const yourQNTBalance = new BN((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString(),10);

//**reclaim from the escrow
  const ReclaimParams = [
    {  
    type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
    name: 'tokenAmount', // Name of parameter
    value: escrowCurrentQNTBalance.toString(), 
  }
];
//** reclaim all of the QNT in the escrow
  const ReclaimFromEscrowTxHash = await InvokeSmartContractFunctionWithInputParams(overledger,currentEscrow,"WithdrawDeposit",ReclaimParams,smallFunctionCompLimit,thisCompPrice);
  //* wait for the transaction to confirm 
  await waitForTxConfirmation(ReclaimFromEscrowTxHash,overledger,false);


//**check variables
//* check escrow balance
const escrowNewQNTBalance = new BN((await readSmartContractFunction(overledger,currentEscrow,"readQNTBalance",[],Uint256Output)).results.toString(),10);

//* check senders balance
const yourNewQNTBalance = new BN((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString(),10);


//* verification check
if (escrowNewQNTBalance.toString() != '0'){
    console.log("");
    throw "escrowNewQNTBalance: " + escrowNewQNTBalance + " not equal to 0 ";
} else {
    console.log("escrowNewQNTBalance test PASS");
}
if (!(yourNewQNTBalance.eq(yourQNTBalance.add(escrowCurrentQNTBalance)))){
    console.log("");
    throw "yourNewQNTBalance: " + yourNewQNTBalance + " not equal to yourQNTBalance.add(escrowCurrentQNTBalance): " + yourQNTBalance.add(escrowCurrentQNTBalance);
} else {
    console.log("yourNewQNTBalance test PASS");
}

console.log("**** END OF QNT RECLAIM SECTION****");

}


