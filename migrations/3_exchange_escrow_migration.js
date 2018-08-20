var MRC_ExchangeEscrow = artifacts.require("./MRC_ExchangeEscrow.sol");

module.exports = function (deployer, network, accounts) {
    let signatory_0 = accounts[9];
    let signatory_1 = accounts[8];
    let signatory_2 = accounts[7];

    deployer.deploy(MRC_ExchangeEscrow, [signatory_0, signatory_1, signatory_2]);
};