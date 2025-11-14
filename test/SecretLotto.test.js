const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecretLotto", function () {
  let lottery;
  let owner, player1, player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    
    const SecretLotto = await ethers.getContractFactory("SecretLotto");
    lottery = await SecretLotto.deploy();
    await lottery.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the right owner", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("should start with round 1", async function () {
      expect(await lottery.currentRoundId()).to.equal(1);
    });

    it("should have correct initial settings", async function () {
      expect(await lottery.minBet()).to.equal(ethers.parseEther("0.001"));
      expect(await lottery.maxBet()).to.equal(ethers.parseEther("1"));
      expect(await lottery.platformFee()).to.equal(5);
    });
  });

  describe("Buying Tickets", function () {
    it("should allow buying tickets", async function () {
      const betAmount = ethers.parseEther("0.01");
      const salt = ethers.randomBytes(32);
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint256", "bytes32"], [betAmount, salt])
      );

      await expect(
        lottery.connect(player1).buyTicket(commitment, { value: betAmount })
      ).to.emit(lottery, "TicketPurchased");
    });

    it("should reject bets below minimum", async function () {
      const lowBet = ethers.parseEther("0.0001");
      const commitment = ethers.randomBytes(32);

      await expect(
        lottery.connect(player1).buyTicket(commitment, { value: lowBet })
      ).to.be.revertedWith("Bet too low");
    });

    it("should reject bets above maximum", async function () {
      const highBet = ethers.parseEther("2");
      const commitment = ethers.randomBytes(32);

      await expect(
        lottery.connect(player1).buyTicket(commitment, { value: highBet })
      ).to.be.revertedWith("Bet too high");
    });
  });

  describe("Revealing Bets", function () {
    it("should allow revealing bets correctly", async function () {
      const betAmount = ethers.parseEther("0.01");
      const salt = ethers.randomBytes(32);
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint256", "bytes32"], [betAmount, salt])
      );

      await lottery.connect(player1).buyTicket(commitment, { value: betAmount });

      await expect(
        lottery.connect(player1).revealBet(1, 0, betAmount, salt)
      ).to.emit(lottery, "BetRevealed");
    });

    it("should reject invalid reveals", async function () {
      const betAmount = ethers.parseEther("0.01");
      const salt = ethers.randomBytes(32);
      const wrongSalt = ethers.randomBytes(32);
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint256", "bytes32"], [betAmount, salt])
      );

      await lottery.connect(player1).buyTicket(commitment, { value: betAmount });

      await expect(
        lottery.connect(player1).revealBet(1, 0, betAmount, wrongSalt)
      ).to.be.revertedWith("Invalid reveal");
    });
  });

  describe("Drawing Winner", function () {
    it("should draw a winner and distribute prize", async function () {
      // Player 1 buys ticket
      const bet1 = ethers.parseEther("0.1");
      const salt1 = ethers.randomBytes(32);
      const commitment1 = ethers.keccak256(
        ethers.solidityPacked(["uint256", "bytes32"], [bet1, salt1])
      );
      await lottery.connect(player1).buyTicket(commitment1, { value: bet1 });

      // Player 2 buys ticket
      const bet2 = ethers.parseEther("0.2");
      const salt2 = ethers.randomBytes(32);
      const commitment2 = ethers.keccak256(
        ethers.solidityPacked(["uint256", "bytes32"], [bet2, salt2])
      );
      await lottery.connect(player2).buyTicket(commitment2, { value: bet2 });

      // Draw winner
      await expect(lottery.drawWinner())
        .to.emit(lottery, "WinnerDrawn");

      // Check new round started
      expect(await lottery.currentRoundId()).to.equal(2);
    });

    it("should fail if no tickets sold", async function () {
      await expect(lottery.drawWinner())
        .to.be.revertedWith("No tickets sold");
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to update bet limits", async function () {
      await lottery.updateBetLimits(
        ethers.parseEther("0.002"),
        ethers.parseEther("2")
      );

      expect(await lottery.minBet()).to.equal(ethers.parseEther("0.002"));
      expect(await lottery.maxBet()).to.equal(ethers.parseEther("2"));
    });

    it("should allow owner to update platform fee", async function () {
      await lottery.updatePlatformFee(10);
      expect(await lottery.platformFee()).to.equal(10);
    });

    it("should not allow non-owner to update settings", async function () {
      await expect(
        lottery.connect(player1).updatePlatformFee(10)
      ).to.be.reverted;
    });
  });
});

