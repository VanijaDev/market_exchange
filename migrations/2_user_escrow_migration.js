var MRC_UserEscrow = artifacts.require("./MRC_UserEscrow.sol");

module.exports = function (deployer, network, accounts) {
    let signatory_0 = accounts[9];
    let signatory_1 = accounts[8];
    let signatory_2 = accounts[7];

    deployer.deploy(MRC_UserEscrow, [signatory_0, signatory_1, signatory_2]);
};