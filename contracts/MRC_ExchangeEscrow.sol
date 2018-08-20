pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title MRC_ExchangeEscrow
 * @dev The MRC_ExchangeEscrow contract is used as deposit for exchange funds.
 */
contract MRC_ExchangeEscrow is Ownable {
  address[] public signatories;
  mapping (address => bool) public signatoriesSigned;

  event ReceivedFundsFromUser(address indexed _user, uint256 indexed _wei);
  event TransferredFundsFromExchangeEscrowTo(address indexed _user, uint256 indexed _wei);

  /**
   * @notice Create a new MRC_ExchangeEscrow Contract.
   * @param _signatories signatories needed for fund transfer.
   */
  constructor(address[] _signatories) public {
    validateSignatories(_signatories);
    signatories = _signatories;
  }


  function() public payable {
    emit ReceivedFundsFromUser(msg.sender, msg.value);
  }

  /**
   * @dev Allows the current owner to transfer funds.
   * @param _addresses The address to transfer funds to.
   */
  function transferFundsTo(address[] _addresses, uint256[] _amounts) public {
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
      validateAndTransferFundsTo(_addresses, _amounts);
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

  function validateAndTransferFundsTo(address[] _addresses, uint256[] _weiAmounts) private {
    require(_addresses.length == _weiAmounts.length, "addresses and wei amounts lengths are not equal");

    for(uint256 i = 0; i < _addresses.length; i ++) {
      require(_addresses[i] != address(0), "address to send from exchange escrow can not be 0");
      require(_weiAmounts[i] > 0, "wei to send from exchange escrow can not be 0");

      _addresses[i].transfer(_weiAmounts[i]);
      emit TransferredFundsFromExchangeEscrowTo(_addresses[i], _weiAmounts[i]);
    }
  }
}
