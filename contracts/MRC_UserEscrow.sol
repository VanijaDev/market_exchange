pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title MRC_UserEscrow
 * @dev The UserEscrow contract is used for receiving funds from user and transferring them to exchange deposit.
 */
contract MRC_UserEscrow is Ownable {
  address public user;
  address[] public signatories;
  mapping (address => bool) public signatoriesSigned;

  event UserEscrowDeposited(address indexed _user, uint256 indexed _wei);
  event UserEscrowTransferred(address indexed _user, uint256 indexed _wei, address indexed _escrow);

  /**
   * @notice Create a new MRC_UserEscrow Contract.
   * @param _signatories signatories needed for fund transfer.
   */
  constructor(address[] _signatories) public {
    validateSignatories(_signatories);
    signatories = _signatories;
  }

  function() public payable {
    user = msg.sender;
    emit UserEscrowDeposited(msg.sender, msg.value);
  }


  /**
   * @dev Allows the current owner to transfer funds.
   * @param _address The address to transfer funds to.
   */
  function transferFundsTo(address _address) public {
    require(address(this).balance > 0, "no funds to transfer");

    bool isSignator;
    uint256 signedBy;

    for(uint256 i = 0; i < signatories.length; i ++) {
      //  is signator
      if(signatories[i] == msg.sender) {
        isSignator = true;
      }

      //  how many signatories has signed
      if(signatoriesSigned[signatories[i]]) {
        signedBy += 1;
      }
    }

    require(isSignator, "provided signatory address is not in signatories list");

    signatoriesSigned[msg.sender] = true;
    signedBy += 1;

    if(signedBy == signatories.length) {
      uint256 weiAmount = address(this).balance;
      _address.transfer(weiAmount);
      emit UserEscrowTransferred(user, weiAmount, _address);
    }
  }

  /**
   * @dev Validating signatories addresses.
   * @param _signatories Addresses to validate.
   */
  function validateSignatories(address[] _signatories) private pure {
    for(uint256 i = 0; i < _signatories.length; i ++) {
      require(_signatories[i] != address(0), "signatory address can not be \"0\"");
    }
  }
}
