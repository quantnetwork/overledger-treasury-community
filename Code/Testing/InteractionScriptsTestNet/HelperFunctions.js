const SCFunctionTypeOptions = require('@quantnetwork/overledger-types').SCFunctionTypeOptions;
const TransactionTypeOptions = require('@quantnetwork/overledger-types').TransactionTypeOptions;
const TransactionEthereumSubTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').TransactionEthereumSubTypeOptions;
const EthereumTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumTypeOptions;
const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
const util = require('util');
const fs = require('fs');

async function deployContract(contractCode,overledger,thisCompLimit,thisCompPrice){

  try {

    // Get the address sequence.
    const ethereumSequenceRequest = await overledger.dlts.ethereum.getSequence(overledger.dlts.ethereum.account.address);
    const ethereumAccountSequence = ethereumSequenceRequest.data.dltData[0].sequence;

    //console.log('ethereumAccountSequence:' + ethereumAccountSequence);

    // Sign the transaction.
    // As input to this function, we will be providing a TransactionEthereumRequest object (of @quantnetwork/overledger-dlt-ethereum) that inherits from the TransactionAccountRequest object which inherits from the TransactionRequest object (both of @quantnetwork/overledger-types)
    const signedTransactions = await overledger.sign([
      {
            // The following parameters are from the TransactionRequest object:
        dlt: DltNameOptions.ETHEREUM,
        type: TransactionTypeOptions.ACCOUNTS,
        subType: { name: TransactionEthereumSubTypeOptions.SMART_CONTRACT_DEPLOY },
        message: "",  // This must be empty for a contractDeploy transaction
            // The following parameters are from the TransactionAccountRequest object:
        fromAddress: overledger.dlts.ethereum.account.address,
        toAddress: "", // This must be empty for a contractDeploy transaction
        sequence: ethereumAccountSequence, // must be an integer >= 0
        amount: '0', // Must be an integer >= 0
        smartContract: {
          code: contractCode, // Put the bytecode to deploy here
          functionCall: [{
            functionType: SCFunctionTypeOptions.CONSTRUCTOR_WITH_NO_PARAMETERS,
            functionName: "", // Not needed for constructor
          }

          ],
          extraFields: {
              // The following parameters are from the SmartContractEthereum object:
            payable: false
          }
        },
        extraFields: {
              // The following parameters are from the TransactionEthereumRequest object:
            compLimit: thisCompLimit, // Price for each individual gas unit this transaction will consume
            compUnitPrice: thisCompPrice // The maximum fee that this transaction will use
        }
      },
    ]);

    //console.log('signedTransaction:');
    //console.log(JSON.stringify(signedTransactions, null, 2));

    // Send the transactions to Overledger.
    const result = (await overledger.send(signedTransactions)).data;

    // Log the result.
    //console.log('OVL result:');
    //console.log(JSON.stringify(result, null, 2));
    //console.log("");
    //console.log('Your smart contract creation transaction hash is: ' + result.dltData[0].transactionHash);
    //console.log("");
    if ((result.dltData[0].transactionHash == null)||(result.dltData[0].status.status == 'error')){
        console.log("");
        throw result.dltData[0].status.code.toString() + "\nerror message: " + result.dltData[0].status.message.toString(); 
    } else {
        return result.dltData[0].transactionHash;
    }
  } catch (e) {
    console.error('error:', e);
    process.exit();
  }

}

async function deployContractWithParams(contractCode,overledger,SCInputParams,thisCompLimit,thisCompPrice){

  try {

    // Get the address sequence.
    const ethereumSequenceRequest = await overledger.dlts.ethereum.getSequence(overledger.dlts.ethereum.account.address);
    const ethereumAccountSequence = ethereumSequenceRequest.data.dltData[0].sequence;

    // Sign the transaction.
    // As input to this function, we will be providing a TransactionEthereumRequest object (of @quantnetwork/overledger-dlt-ethereum) that inherits from the TransactionAccountRequest object which inherits from the TransactionRequest object (both of @quantnetwork/overledger-types)
    const signedTransactions = await overledger.sign([
      {
            // The following parameters are from the TransactionRequest object:
        dlt: DltNameOptions.ETHEREUM,
        type: TransactionTypeOptions.ACCOUNTS,
        subType: { name: TransactionEthereumSubTypeOptions.SMART_CONTRACT_DEPLOY },
        message: "",  // This must be empty for a contractDeploy transaction
            // The following parameters are from the TransactionAccountRequest object:
        fromAddress: overledger.dlts.ethereum.account.address,
        toAddress: "", // This must be empty for a contractDeploy transaction
        sequence: ethereumAccountSequence, // must be an integer >= 0
        amount: '0', // Must be an integer >= 0
        smartContract: {
          code: contractCode, // Put the bytecode to deploy here
          functionCall: [{
            functionType: SCFunctionTypeOptions.CONSTRUCTOR_WITH_PARAMETERS,
            functionName: "", // Not needed for constructor
            inputParams: SCInputParams
          }

          ],
          extraFields: {
              // The following parameters are from the SmartContractEthereum object:
            payable: false
          }
        },
        extraFields: {
              // The following parameters are from the TransactionEthereumRequest object:
            compLimit: thisCompLimit, // Price for each individual gas unit this transaction will consume
            compUnitPrice: thisCompPrice // The maximum fee that this transaction will use
        }
      },
    ]);

    //console.log('signedTransaction:');
    //console.log(JSON.stringify(signedTransactions, null, 2));

    // Send the transactions to Overledger.
    const result = (await overledger.send(signedTransactions)).data;

    // Log the result.
    //console.log("");
    //console.log('Your smart contract creation transaction hash is: ' + result.dltData[0].transactionHash);
    //console.log("");
    if ((result.dltData[0].transactionHash == null)||(result.dltData[0].status == 'error')){
        console.log("");
        throw result.dltData[0].status.code.toString() + "\nerror message: " + result.dltData[0].status.message.toString(); 
    } else {
        return result.dltData[0].transactionHash;
    }
  } catch (e) {
    console.error('error:', e);
    process.exit();
  }

}


async function deployProxyContract(contractCode,contractLogic,overledger,thisCompLimit,thisCompPrice){

  try {
    // Get the address sequence.
    const ethereumSequenceRequest = await overledger.dlts.ethereum.getSequence(overledger.dlts.ethereum.account.address);
    const ethereumAccountSequence = ethereumSequenceRequest.data.dltData[0].sequence;

    // Sign the transaction.
    // As input to this function, we will be providing a TransactionEthereumRequest object (of @quantnetwork/overledger-dlt-ethereum) that inherits from the TransactionAccountRequest object which inherits from the TransactionRequest object (both of @quantnetwork/overledger-types)
    const signedTransactions = await overledger.sign([
      {
            // The following parameters are from the TransactionRequest object:
        dlt: DltNameOptions.ETHEREUM,
        type: TransactionTypeOptions.ACCOUNTS,
        subType: { name: TransactionEthereumSubTypeOptions.SMART_CONTRACT_DEPLOY },
        message: "",  // This must be empty for a contractDeploy transaction
            // The following parameters are from the TransactionAccountRequest object:
        fromAddress: overledger.dlts.ethereum.account.address,
        toAddress: "", // This must be empty for a contractDeploy transaction
        sequence: ethereumAccountSequence, // must be an integer >= 0
        amount: '0', // Must be an integer >= 0
        smartContract: {
          code: contractCode, // Put the bytecode to deploy here
          functionCall: [{
            functionType: SCFunctionTypeOptions.CONSTRUCTOR_WITH_PARAMETERS,
            functionName: "", // Not needed for constructor
            inputParams: [
              {  
                type: {selectedType: EthereumTypeOptions.ADDRESS}, // First parameter is an address
                name: 'contractLogic', // Name of parameter
                value: contractLogic, // Value of the address
            }]
          }],
          extraFields: {
              // The following parameters are from the SmartContractEthereum object:
            payable: false
          }
        },
        extraFields: {
              // The following parameters are from the TransactionEthereumRequest object:
            compLimit: thisCompLimit, // Price for each individual gas unit this transaction will consume
            compUnitPrice: thisCompPrice // The maximum fee that this transaction will use
        }
      },
    ]);

    //console.log('signedTransaction:');
    //console.log(JSON.stringify(signedTransactions, null, 2));

    // Send the transactions to Overledger.
    const result = (await overledger.send(signedTransactions)).data;

    // Log the result.
    //console.log("");
    //console.log('Your smart contract creation transaction hash is: ' + result.dltData[0].transactionHash);
    //console.log("");
    if ((result.dltData[0].transactionHash == null)||(result.dltData[0].status.status == 'error')){
        console.log("");
        throw result.dltData[0].status.code.toString() + "\nerror message: " + result.dltData[0].status.message.toString(); 
    } else {
        return result.dltData[0].transactionHash;
    }
  } catch (e) {
    console.error('error:', e);
    process.exit();
  }

}

/**
 * Waits in a loop until a transaction has been confirmed
 * @param {*} transactionHash - the transaction that we are waiting for confirmation of
 */
async function waitForTxConfirmation(transactionHash, overledger,contract) {
  console.log("!waitForTxConfirmation!");
  console.log("transactionHash: " + transactionHash.toString());
  if (transactionHash == "") {
      console.log("Contract must be already deployed");
      return;
  }
  //waitForTxHash to be confirmed
  let txConfirmed = false;
  let resp;
  while (txConfirmed == false) {
      await sleep(7500);
       resp = await waitForTxConfirmation2(transactionHash,overledger,contract);
      console.log("tx response: " + resp);
      if (parseInt(resp.blockNumber) > 0) { //success for eth
          txConfirmed = true;
          console.log("confirmed");
      } else {
          console.log("tx NOT confirmed: " + transactionHash);
      }
  }
  return resp.smartContractAddress;
}

async function waitForTxConfirmation2(transactionHash,overledger,contract){

  try {
    //read the block number/ledger number that this transaction was confirmed in.
    let txParams = await overledger.search.getTransaction(transactionHash);
    //as non-deterministic, lets loop a few times
    let count = 0;
    while ((count < 5) && (txParams.data.dlt === null)) {
        sleep(3000);
        txParams = await overledger.search.getTransaction(transactionHash);
        count++;
    }
    if (txParams.data.dlt === null){
      return {blockNumber: "-1"};
    } else if (contract == false) {
      //console.log(util.inspect(txParams, {showHidden: false, depth: 7}));
      //console.log('txParams.data.data.blockNumber: ' + txParams.data.data.blockNumber.toString());
      return {blockNumber: txParams.data.data.blockNumber.toString()};
    } else {
      //console.log(util.inspect(txParams, {showHidden: false, depth: 7}));
      //console.log('txParams.data.data.blockNumber: ' + txParams.data.data.blockNumber.toString());
      return {blockNumber: txParams.data.data.blockNumber.toString(),smartContractAddress: txParams.data.data.creates.toString()};
    }
  } catch (e) {
    console.error('error:', e);
    return {blockNumber: "-1"};
  }

}

/**
 * Sleeps for a number of miliseconds
 * @param {*} ms - the number of miliseconds
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function readSmartContractFunction(overledger,SCAddress,SCFunctionName,SCInputParams,SCOutputParams){

  try {

    let params;
    if (SCInputParams.length == 0){
      params = SCFunctionTypeOptions.FUNCTION_CALL_WITH_NO_PARAMETERS;
    } else {
      params = SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS;
    }
    // We will be providing a SmartContractEthereum object (of @quantnetwork/overledger-dlt-ethereum) that inherits from the SmartContract object (of @quantnetwork/overledger-types)
    // This smart contract object is querying a smart contract function that does not have an input
    let smartContractQuery = {
          // The following parameters are from the SmartContract object:
      id: SCAddress,
      code: "", // No need to put code here if you are declaring the function call ->
      functionCall: [{
        functionType: params,
        functionName: SCFunctionName, 
        inputParams: SCInputParams,
        outputParams: SCOutputParams
      }],
      extraFields: {
          // The following parameters are from the SmartContractEthereum object:
        payable: false
      }
    };
    //uncomment if you want to read the parameters sent to overledger for the smart contract read:
    //console.log(util.inspect(smartContractQuery, {showHidden: false, depth: 7}));
    const ethereumSmartContractQueryBuild = overledger.dlts.ethereum.buildSmartContractQuery(overledger.dlts.ethereum.account.address,smartContractQuery);

  if (ethereumSmartContractQueryBuild.success == false){
    throw new Error(`Ethereum smart contract query build unsuccessful: ` + ethereumSmartContractQueryBuild.response);      
  }

  // And finally we will send the smart contract function query to the node.
  const returnedValues = await overledger.search.smartContractQuery(DltNameOptions.ETHEREUM, ethereumSmartContractQueryBuild.response);
  console.log(`\n`);
  console.log(`returned output value for smart contract function`,  returnedValues.data);
  console.log(`\n`);
  return returnedValues.data;
  } catch (e) {
    console.error('error:', e);
    process.exit();
  }

}

async function InvokeSmartContractFunctionWithInputParams(overledger,SCAddress,SCFunctionName,SCInputParams,thisCompLimit,thisCompPrice){
  try {

    // Get the address sequence.
    const ethereumSequenceRequest = await overledger.dlts.ethereum.getSequence(overledger.dlts.ethereum.account.address);
    const ethereumAccountSequence = ethereumSequenceRequest.data.dltData[0].sequence;

    let params;
    if (SCInputParams.length == 0){
      params = SCFunctionTypeOptions.FUNCTION_CALL_WITH_NO_PARAMETERS;
    } else {
      params = SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS;
    }
    const toSign = [
      {
            // The following parameters are from the TransactionRequest object:
        dlt: DltNameOptions.ETHEREUM,
        type: TransactionTypeOptions.ACCOUNTS,
        subType: { name: TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION },
        message: "",  // This must be empty for a contractInvocation transaction
            // The following parameters are from the TransactionAccountRequest object:
        fromAddress: overledger.dlts.ethereum.account.address,
        toAddress: SCAddress, 
        sequence: ethereumAccountSequence, // Must be an integer >= 0
        amount: '0', // Must be an integer >= 0
        smartContract: {
          code: "", // No need to put code here as you are declaring the function call ->
          functionCall: [{
            functionType: params,
            functionName: SCFunctionName, // The function name must be given
            inputParams: SCInputParams
          }],
          extraFields: {
              // The following parameters are from the SmartContractEthereum object:
            payable: false
          }
        },
        extraFields: {
              // The following parameters are from the TransactionEthereumRequest object:
            compLimit: thisCompLimit, // Must be an integer
            compUnitPrice: thisCompPrice // Must be an integer
        }
      },
    ];
    // Sign the transaction.
    // As input to this function, we will be providing a TransactionEthereumRequest object (of @quantnetwork/overledger-dlt-ethereum) that inherits from the TransactionAccountRequest object which inherits from the TransactionRequest object (both of @quantnetwork/overledger-types)
    const signedTransactions = await overledger.sign(toSign);
    // Send the transactions to Overledger.
    const result = (await overledger.send(signedTransactions)).data;

    // Log the result.
    console.log("");
    console.log('Your smart contract invocation transaction hash is: ' + result.dltData[0].transactionHash);
    console.log("");
    if ((result.dltData[0].transactionHash == null)||(result.dltData[0].status.status == 'error')){
        console.log("");
        throw result.dltData[0].status.code.toString() + "\nerror message: " + result.dltData[0].status.message.toString(); 
    } else {
        return result.dltData[0].transactionHash;
    }

  } catch (e) {
    console.error('error:', e);
    process.exit();
  }


}

async function loadDataFromFile(fileLocation) {

  try {  
      var data = fs.readFileSync(fileLocation, 'utf8');
      //console.log(data.toString());  
      return data;  
  } catch(e) {
      console.log('Error:', e.stack);
      return e.error;
  }

}

exports.loadDataFromFile = loadDataFromFile;
exports.readSmartContractFunction = readSmartContractFunction; 
exports.InvokeSmartContractFunctionWithInputParams = InvokeSmartContractFunctionWithInputParams;
exports.deployContract = deployContract;
exports.deployContractWithParams = deployContractWithParams;
exports.waitForTxConfirmation = waitForTxConfirmation; 
exports.deployProxyContract = deployProxyContract;
