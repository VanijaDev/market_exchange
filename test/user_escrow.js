const UserEscrow = artifacts.require("UserEscrow");
const BigNumber = require("bignumber.js");
const Reverter = require("./helpers/reverter");
const Asserts = require("./helpers/asserts");


contract("UserEscrow", (accounts) => {
  const OWNER = accounts[0];
  const USER_ADDRESS = accounts[1];
  const TRANSFER_TO_ADDRESS = accounts[2];

  let escrow;
  let asserts = Asserts(assert);

  before("setup", async () => {
    escrow = await UserEscrow.deployed();
    await Reverter.snapshot();
  });

  afterEach("revert", async () => {
    await Reverter.revert();
  });

  it("should validate signatories are being set correct", async () => {
    let signatory_0 = accounts[9];
    let signatory_1 = accounts[8];
    let signatory_2 = accounts[7];

    assert.equal(await escrow.signatories.call(0), signatory_0, "wrong signatory_0");
    assert.equal(await escrow.signatories.call(1), signatory_1, "wrong signatory_1");
    assert.equal(await escrow.signatories.call(2), signatory_2, "wrong signatory_2");
  });

  it("should fail because of wrong signator", async () => {
    await asserts.throws(UserEscrow.new([0, accounts[9], accounts[8]]), "each signatory address should be valid");
  });

  it("should transfer funds only after all signatories would approve", async () => {
    let signator_0 = accounts[9];
    let signator_1 = accounts[8];
    let signator_2 = accounts[7];
    let signator_fake = accounts[4];

    let user = accounts[6];
    let recipient = accounts[5];
    let deposit = web3.toWei(10, "ether");

    //  user sends funds to escrow
    await escrow.sendTransaction({
      from: user,
      value: deposit
    });
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "wrong escrow funds after user transaction");

    //  test signatures
    let recipientBalanceBefore = new BigNumber(await web3.eth.getBalance(recipient));

    //  signator_0
    await escrow.transferFundsTo(recipient, {
      from: signator_0
    });
    assert.equal(recipientBalanceBefore.toNumber(), new BigNumber(await web3.eth.getBalance(recipient)).toNumber(), "recipient Balance should not be changed after signator_0");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "escrow funds should not be moved after signator_0");

    //  signator_1
    await escrow.transferFundsTo(recipient, {
      from: signator_1
    });
    assert.equal(recipientBalanceBefore.toNumber(), new BigNumber(await web3.eth.getBalance(recipient)).toNumber(), "recipient Balance should not be changed after signator_1");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "escrow funds should not be moved after signator_1");

    //  signator_fake
    await asserts.throws(escrow.transferFundsTo(recipient, {
      from: signator_fake
    }));
    assert.equal(recipientBalanceBefore.toNumber(), new BigNumber(await web3.eth.getBalance(recipient)).toNumber(), "recipient Balance should not be changed after signator_1");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "escrow funds should not be moved after signator_1");

    //  signator_2
    await escrow.transferFundsTo(recipient, {
      from: signator_2
    });
    assert.equal(new BigNumber(await web3.eth.getBalance(recipient).minus(recipientBalanceBefore)).toNumber(), deposit, "recipient Balance should include deposit after signator_2");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), 0, "escrow funds should be moved after signator_2");
  });

  it("should throw if fake signator", async () => {
    let signator_fake = accounts[4];

    let user = accounts[6];
    let recipient = accounts[5];
    let deposit = web3.toWei(10, "ether");

    //  user sends funds to escrow
    await escrow.sendTransaction({
      from: user,
      value: deposit
    });

    //  signator_fake
    await asserts.throws(escrow.transferFundsTo(recipient, {
      from: signator_fake
    }), "should throw if fake signator tries to sign");
  });
});