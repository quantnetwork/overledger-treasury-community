pragma solidity 0.5.17;

import "./UpgradeableProxy.sol";

/**
 * @author Quant Network
 * @title RuleAbstract
 * @dev A template for all treasury verification rules to follow
 */
contract RuleBase is UpgradeableProxy {
    
    //the associated rule list contract
    bytes constant private ruleList1 = '1.rulelist';
    //the location of the full text description of this rule
    bytes constant private descriptionLocation1 = '1.descriptionLocation';
    //the reference id of the full text description of this rule 
    bytes constant private descriptionReference1 = '1.descriptionReference';
    
    /**
     * The implemented version of this function will be used to verify a dispute that has been raised.
     * The function to raise the dispute is not present in the abstract as it can have rule dependant parameters
     */
    function verify(uint256 disputeID) public;
    
    /**
     * Pauses the operation of this verification rule. Again this function should probably be protected by a speedbump,
     * to allow gateways and mapps time to adjust
     */
    function circuitbreaker() public; 

    /**
     * @return - the associated rule list contract
     */
    function ruleList() public view returns (address){
        return addressStorage[keccak256(ruleList1)];
    }

    /**
     * @return - full rule description location
     */
    function descriptionLocation() public view returns (string memory){
        return stringStorage[keccak256(descriptionLocation1)];
    }
    
    /**
     * @return - full rule description reference id
     */
    function descriptionReference() public view returns (string memory){
        return stringStorage[keccak256(descriptionReference1)];
    }
    
}