const MRC_UserEscrow = artifacts.require("MRC_UserEscrow");
var MRC_ExchangeEscrow = artifacts.require("./MRC_ExchangeEscrow.sol");
const BigNumber = require("bignumber.js");
const Reverter = require("./helpers/reverter");
const Asserts = require("./helpers/asserts");


contract("MRC_ExchangeEscrow", (accounts) => {
    let signatory_0 = accounts[9];
    let signatory_1 = accounts[8];
    let signatory_2 = accounts[7];
    let signatory_fake = accounts[4];
    let user = accounts[6];
    let recipient = accounts[5];

    let exchange_escrow;
    let asserts = Asserts(assert);

    before("setup", async () => {
        exchange_escrow = await MRC_ExchangeEscrow.deployed();
        await Reverter.snapshot();
    });

    afterEach("revert", async () => {
        await Reverter.revert();
    });

    it("should validate signatories are being set correct", async () => {
        assert.equal(await exchange_escrow.signatories.call(0), signatory_0, "wrong signatory_0");
        assert.equal(await exchange_escrow.signatories.call(1), signatory_1, "wrong signatory_1");
        assert.equal(await exchange_escrow.signatories.call(2), signatory_2, "wrong signatory_2");
    });

    it("should fail because of wrong signator", async () => {
        await asserts.throws(MRC_ExchangeEscrow.new([0, accounts[9], accounts[8]]), "each signatory address should be valid");
    });

    it("should transfer funds of single user only after all signatories would approve", async () => {
        let deposit = web3.toWei(10, "ether");

        let exchange_escrowBalanceBefore = new BigNumber(await web3.eth.getBalance(exchange_escrow.address));

        let user_escrow = await MRC_UserEscrow.new([signatory_0, signatory_1, signatory_2]);

        //  user sends funds to escrow
        await user_escrow.sendTransaction({
            from: user,
            value: deposit
        });
        //  signatories
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_0
        });
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_1
        });
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_2
        });
        assert.equal(new BigNumber(await web3.eth.getBalance(exchange_escrow.address).minus(exchange_escrowBalanceBefore)).toNumber(), deposit, "exchange_escrow balance should include deposit after signatory_2");

        let userBalanceBefore = new BigNumber(await web3.eth.getBalance(user));

        //  transfer from escrow
        await exchange_escrow.transferFundsTo([user], [deposit], {
            from: signatory_0
        });
        await exchange_escrow.transferFundsTo([user], [deposit], {
            from: signatory_1
        });
        await exchange_escrow.transferFundsTo([user], [deposit], {
            from: signatory_2
        });

        assert.equal(new BigNumber(await web3.eth.getBalance(user).minus(userBalanceBefore)).toNumber(), deposit, "user balance should include deposit after signatory_2");
        assert.equal(new BigNumber(await web3.eth.getBalance(exchange_escrow.address)).toNumber(), 0, "exchange_escrow funds should be moved after signatory_2");
    });

    it("should transfer funds of multiple users only after all signatories would approve", async () => {
        let deposit_0 = web3.toWei(5, "ether");
        let deposit = web3.toWei(8, "ether");

        let user_0 = accounts[3];

        let exchange_escrowBalanceBefore = new BigNumber(await web3.eth.getBalance(exchange_escrow.address));

        let user_escrow_0 = await MRC_UserEscrow.new([signatory_0, signatory_1, signatory_2]);
        let user_escrow = await MRC_UserEscrow.new([signatory_0, signatory_1, signatory_2]);

        //  user sends funds to escrow
        await user_escrow_0.sendTransaction({
            from: user_0,
            value: deposit_0
        });
        await user_escrow.sendTransaction({
            from: user,
            value: deposit
        });
        //  signatories
        await user_escrow_0.transferFundsTo(exchange_escrow.address, {
            from: signatory_0
        });
        await user_escrow_0.transferFundsTo(exchange_escrow.address, {
            from: signatory_1
        });
        await user_escrow_0.transferFundsTo(exchange_escrow.address, {
            from: signatory_2
        });

        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_0
        });
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_1
        });
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_2
        });
        assert.equal(new BigNumber(await web3.eth.getBalance(exchange_escrow.address).minus(exchange_escrowBalanceBefore)).toNumber(), (new BigNumber(deposit_0).plus(new BigNumber(deposit))).toNumber(), "exchange_escrow balance should include deposit_0 + deposit after signatory_2");

        let userBalanceBefore_0 = new BigNumber(await web3.eth.getBalance(user_0));
        let userBalanceBefore = new BigNumber(await web3.eth.getBalance(user));

        //  transfer from escrow
        await exchange_escrow.transferFundsTo([user_0, user], [deposit_0, deposit], {
            from: signatory_0
        });
        await exchange_escrow.transferFundsTo([user_0, user], [deposit_0, deposit], {
            from: signatory_1
        });
        await exchange_escrow.transferFundsTo([user_0, user], [deposit_0, deposit], {
            from: signatory_2
        });

        assert.equal(new BigNumber(await web3.eth.getBalance(user_0).minus(userBalanceBefore_0)).toNumber(), deposit_0, "user_0 balance should include deposit_0 after signatory_2");
        assert.equal(new BigNumber(await web3.eth.getBalance(user).minus(userBalanceBefore)).toNumber(), deposit, "user balance should include deposit after signatory_2");
        assert.equal(new BigNumber(await web3.eth.getBalance(exchange_escrow.address)).toNumber(), 0, "exchange_escrow funds should be moved after signatory_2");
    });

    it("should throw if fake signator", async () => {
        let deposit = web3.toWei(10, "ether");
        let user_escrow = await MRC_UserEscrow.new([signatory_0, signatory_1, signatory_2]);

        //  user sends funds to escrow
        await user_escrow.sendTransaction({
            from: user,
            value: deposit
        });
        //  signatories
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_0
        });
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_1
        });
        await user_escrow.transferFundsTo(exchange_escrow.address, {
            from: signatory_2
        });

        let exchange_escrowBalanceBefore = new BigNumber(await web3.eth.getBalance(exchange_escrow.address));

        //  transfer from escrow
        await exchange_escrow.transferFundsTo([user], [deposit], {
            from: signatory_0
        });
        await exchange_escrow.transferFundsTo([user], [deposit], {
            from: signatory_1
        });
        //  signatory_fake
        await asserts.throws(exchange_escrow.transferFundsTo(recipient, {
            from: signatory_fake
        }), "should throw if fake signator tries to sign");

        assert.equal(new BigNumber(await web3.eth.getBalance(exchange_escrow.address)).toNumber(), exchange_escrowBalanceBefore.toNumber(), "exchange_escrow funds should not be moved");
    });

    describe("Events", () => {
        it("should emit TransferredFundsFromExchangeEscrowTo when funds moved to exchange deposit", async () => {
            let deposit_0 = web3.toWei(5, "ether");
            let deposit = web3.toWei(8, "ether");

            let user_0 = accounts[3];

            let exchange_escrowBalanceBefore = new BigNumber(await web3.eth.getBalance(exchange_escrow.address));

            let user_escrow_0 = await MRC_UserEscrow.new([signatory_0, signatory_1, signatory_2]);
            let user_escrow = await MRC_UserEscrow.new([signatory_0, signatory_1, signatory_2]);

            //  user sends funds to escrow
            await user_escrow_0.sendTransaction({
                from: user_0,
                value: deposit_0
            });
            await user_escrow.sendTransaction({
                from: user,
                value: deposit
            });
            //  signatories
            await user_escrow_0.transferFundsTo(exchange_escrow.address, {
                from: signatory_0
            });
            await user_escrow_0.transferFundsTo(exchange_escrow.address, {
                from: signatory_1
            });
            await user_escrow_0.transferFundsTo(exchange_escrow.address, {
                from: signatory_2
            });

            await user_escrow.transferFundsTo(exchange_escrow.address, {
                from: signatory_0
            });
            await user_escrow.transferFundsTo(exchange_escrow.address, {
                from: signatory_1
            });
            await user_escrow.transferFundsTo(exchange_escrow.address, {
                from: signatory_2
            });
            assert.equal(new BigNumber(await web3.eth.getBalance(exchange_escrow.address).minus(exchange_escrowBalanceBefore)).toNumber(), (new BigNumber(deposit_0).plus(new BigNumber(deposit))).toNumber(), "exchange_escrow balance should include deposit_0 + deposit after signatory_2");

            //  transfer from escrow
            await exchange_escrow.transferFundsTo([user_0, user], [deposit_0, deposit], {
                from: signatory_0
            });
            await exchange_escrow.transferFundsTo([user_0, user], [deposit_0, deposit], {
                from: signatory_1
            });
            let tx_from_exchange = await exchange_escrow.transferFundsTo([user_0, user], [deposit_0, deposit], {
                from: signatory_2
            });

            assert.equal(tx_from_exchange.logs.length, 2, "should be 2 logs on transfer from exchange_escrow");
            //  log 0
            assert.equal(tx_from_exchange.logs[0].event, "TransferredFundsFromExchangeEscrowTo", "wrong event name");
            assert.equal(tx_from_exchange.logs[0].args._user, user_0, "wrong user_0 addresses");
            assert.equal(tx_from_exchange.logs[0].args._wei, deposit_0, "wrong wei_0 amount");
            //  log 1
            assert.equal(tx_from_exchange.logs[1].event, "TransferredFundsFromExchangeEscrowTo", "wrong event name");
            assert.equal(tx_from_exchange.logs[1].args._user, user, "wrong user addresses");
            assert.equal(tx_from_exchange.logs[1].args._wei, deposit, "wrong wei amount");

        });
    });
});