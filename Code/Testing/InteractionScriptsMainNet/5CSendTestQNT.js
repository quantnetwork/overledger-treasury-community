//** This script is to be used to send testnet QNT to any address, assuming that the sending address still has some remaining testnet QNT (and testnet ETH to pay the transaction fee) */
//** NOTE: check the VARIABLES TO UPDATE section below to see how you choose which address to send QNT to, and for how much 
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

// Paste in/connect your QNT wallet ethereum address and private key.
const yourQNTAddressPrivateKey = ''; //should have 0x in front
const yourQNTAddress = '';

//** The designated Ethereum QNT wallet address of the person requesting testnet QNT
const requestingQNTAddress = '';

//the QNT testnet token address
const ERC20ContractAddress = "0x19Bc592A0E1BAb3AFFB1A8746D8454743EE6E838";

//computation price (in wei) for the Ethereum txs
const thisCompPrice = '40000000000';

//how much to transfer to the requestor?
const tokensForRequestor = new BN(('3000000000000000000').toString(), 10); //3 QNT (with 18 decimal zeros)

//  ---------------------------------------------------------
//  -------------- END VARIABLES TO UPDATE ------------------
//  ---------------------------------------------------------

 //** helpervariables

 // computation limits for the transactions
 const smallFunctionCompLimit = '800000';

   // instructions on how to parse an uint256 param, in standardised form
 const Uint256Output = [
    {  
      type: {selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256}
    }
  ];

// the parameters to get the balance of the requesting address, in standardised form
 const ERC20RequestorBalanceParams = [
      {  
      type: { selectedType: EthereumTypeOptions.ADDRESS},
      name: 'owner', // Name of parameter
      value: requestingQNTAddress, 
    }
];
// the parameters to transfer tokens to the requesting address, in standardised form
const ERC20TransferTokensParams = [
    {  
      type: { selectedType: EthereumTypeOptions.ADDRESS},
      name: 'to', // Name of parameter
      value: requestingQNTAddress, 
    },
    {  
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256}, 
      name: 'value', // Name of parameter
      value: tokensForRequestor.toString(), 
    }
  ];

//** load Overledger
//your overledger instance
 const overledger = new OverledgerSDK(mappId, bpiKey, {
    dlts: [{ dlt: DltNameOptions.ETHEREUM }],
    provider: { network: 'mainnet' },
});
//set the signing keys for overledger
overledger.dlts.ethereum.setAccount(yourQNTAddressPrivateKey);

//ok, run the main part of the computation
runFlow();

/** The main computation of this script */
async function runFlow(){

  console.log("****START OF QNT TRANSFER SECTION****");
  //**read current balance
  const initialRequestorQNTBalance = new BN(((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString()).toString(), 10);
  console.log('initialRequestorQNTBalance: ' + initialRequestorQNTBalance.toString());

  //** now send the QNT, using the treasury's QNT address
  const sendQNTTxHash = await InvokeSmartContractFunctionWithInputParams(overledger,ERC20ContractAddress,"transfer",ERC20TransferTokensParams,smallFunctionCompLimit,thisCompPrice);
  //* wait for the transaction to confirm
  await waitForTxConfirmation(sendQNTTxHash,overledger,false);
  
  //** read the new balance
  const finalRequestorQNTBalance = new BN(((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString()).toString(), 10);
  console.log('finalRequestorQNTBalanceHex: ' + finalRequestorQNTBalance.toString());
  
  //** check that the balance has changed correctly
  if (!(finalRequestorQNTBalance.eq(initialRequestorQNTBalance.add(tokensForRequestor)))){
      console.log("");
      throw "finalRequestorQNTBalance: " + (finalRequestorQNTBalance).toString() + " different to initialRequestorQNTBalance.add(tokensForRequestor): " + initialRequestorQNTBalance.add(tokensForRequestor).toString();
  } else {
    console.log("finalRequestorQNTBalance test PASS");
  }
  console.log("****END OF QNT TRANSFER SECTION****");

}