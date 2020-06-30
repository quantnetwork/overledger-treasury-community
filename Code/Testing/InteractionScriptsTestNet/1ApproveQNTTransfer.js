//Note that this script is provided for the situation on if you are not using your QNT address in the cold wallet style.
//If you are using the QNT address as a cold wallet, 
//please approve the treasury factory proxy address (listed below) to take the recommended QNT in the usual manner
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

//** The Ethereum addresses of the person approving the treasury factory proxy contract to take the QNT and move it into a payment channel
const yourQNTAddressPrivateKey = ''; //should have 0x in front
const yourQNTAddress = '';

//the QNT testnet token address (from script 0)
const ERC20ContractAddress = "0x19Bc592A0E1BAb3AFFB1A8746D8454743EE6E838";

//** the address of the treasury factory proxy contract
const treasuryFactoryProxyAddress = "0x4a42aa05fb7cd58e9e388c82ec11b811bdf5ada7";

//computation price (in wei) for the Ethereum txs
const thisCompPrice = '25000000000';

// how much to approve the treasury factory proxy smart contract to take
// 50 QNT (current default licence fee 
// Any amount above 100 will be taken as the escrowed deposit of the user (if a gateway then this is the staked amount)
const tokensToApprove = new BN(('105000000000000000000').toString(), 10); //105 QNT (with 18 decimal zeros)

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

// the parameters to get the balance of the your QNT address, in standardised form
   const ERC20RequestorBalanceParams = [
      {  
      type: { selectedType: EthereumTypeOptions.ADDRESS},
      name: 'owner', // Name of parameter
      value: yourQNTAddress, 
    }
];
// the parameters to approve the tokens to the treasury factory address, in standardised form
 const ERC20ApproveTokensParams = [
    {  
      type: { selectedType: EthereumTypeOptions.ADDRESS},
      name: 'to', // Name of parameter
      value: treasuryFactoryProxyAddress, 
    },
    {  
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256}, 
      name: 'value', // Name of parameter
      value: tokensToApprove.toString(), 
    }
  ];

  // the parameters to get the allowance of the your QNT address, in standardised form
  const ERC20AllowanceParams = [
      {  
      type: { selectedType: EthereumTypeOptions.ADDRESS},
      name: 'owner', // Name of parameter
      value: yourQNTAddress, 
    },{  
      type: { selectedType: EthereumTypeOptions.ADDRESS},
      name: 'spender', // Name of parameter
      value: treasuryFactoryProxyAddress, 
    }
];

//** load Overledger
 const overledger = new OverledgerSDK(mappId, bpiKey, {
    dlts: [{ dlt: DltNameOptions.ETHEREUM }],
    provider: { network: 'testnet' },
});
//your QNT address is required to transfer the QNT (but your operator address will send payment channel messages later)
overledger.dlts.ethereum.setAccount(yourQNTAddressPrivateKey);

//ok, run the main part of the computation
runFlow();

/** The main computation of this script */
async function runFlow(){

  console.log("**** START OF QNT APPROVAL SECTION****");
  //**read current balance
  const youQNTBalance = new BN(((await readSmartContractFunction(overledger,ERC20ContractAddress,"balanceOf",ERC20RequestorBalanceParams,Uint256Output)).results.toString()).toString(), 10);
  console.log('youQNTBalance: ' + youQNTBalance.toString());
  if (youQNTBalance.toString() == '0') {
    console.log("");
    throw "youQNTBalance: " + youQNTBalance + " is equal to 0, therefore you need to top up your QNT balance";
  } else {
    console.log("youQNTBalance test PASS");
  }

//**read current allowance
  const initialFactoryQNTAllowance = new BN(((await readSmartContractFunction(overledger,ERC20ContractAddress,"allowance",ERC20AllowanceParams,Uint256Output)).results.toString()).toString(), 10);
  console.log('initialFactoryQNTAllowance: ' + initialFactoryQNTAllowance.toString());

  if (initialFactoryQNTAllowance.gte(tokensToApprove)){
    console.log("");
    throw "You have already approved the treasury factory for the required amount";
  } else {
    console.log("tokensToApprove test PASS");
  }

  //** now send the QNT approval
  const sendQNTApprovalTxHash = await InvokeSmartContractFunctionWithInputParams(overledger,ERC20ContractAddress,"approve",ERC20ApproveTokensParams,smallFunctionCompLimit,thisCompPrice);
  //* wait for the transaction to confirm  
  await waitForTxConfirmation(sendQNTApprovalTxHash,overledger,false);
  
  //** read the new allowance
  const finalFactoryQNTAllowance = new BN(((await readSmartContractFunction(overledger,ERC20ContractAddress,"allowance",ERC20AllowanceParams,Uint256Output)).results.toString()).toString(), 10);
  console.log('finalFactoryQNTAllowance: ' + finalFactoryQNTAllowance.toString());

  //** check that the allowance has changed 
  if (!(finalFactoryQNTAllowance.eq(tokensToApprove))){
    console.log("");
    throw "finalFactoryQNTAllowance: " + (finalFactoryQNTAllowance).toString() + " different to tokensToApprove: " + tokensToApprove.toString();
  } else {
    console.log("finalFactoryQNTAllowance test PASS");
  }
  console.log('Your Transaction hash to approve the treasury is: ' + sendQNTApprovalTxHash);
  console.log("**** END OF QNT APPROVAL SECTION****");

  

}