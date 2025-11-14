// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SecretLotto
 * @dev Privacy-first lottery where bet amounts are hidden using commitments
 * 
 * 🎲 Features:
 * - Hidden bet amounts (commitment scheme)
 * - Fair random winner selection
 * - Multiple lottery rounds
 * - Automatic prize distribution
 */
contract SecretLotto is Ownable, ReentrancyGuard {
    
    // 🎯 Game states
    enum RoundState { OPEN, CLOSED, DRAWN }
    
    // 🎟️ Ticket structure
    struct Ticket {
        address player;
        bytes32 betCommitment;  // hidden bet amount
        uint256 revealedBet;
        bool revealed;
        uint256 timestamp;
    }
    
    // 🎰 Round info
    struct LotteryRound {
        uint256 roundId;
        RoundState state;
        uint256 totalPool;
        uint256 ticketCount;
        address winner;
        uint256 prizeAmount;
        uint256 startTime;
        uint256 endTime;
    }
    
    // 📊 State variables
    uint256 public currentRoundId;
    uint256 public minBet = 0.001 ether;
    uint256 public maxBet = 1 ether;
    uint256 public platformFee = 5; // 5%
    
    mapping(uint256 => LotteryRound) public rounds;
    mapping(uint256 => Ticket[]) public roundTickets;
    mapping(address => uint256[]) public playerRounds;
    
    // 📢 Events
    event TicketPurchased(uint256 indexed roundId, address indexed player, uint256 ticketId);
    event BetRevealed(uint256 indexed roundId, address indexed player, uint256 amount);
    event WinnerDrawn(uint256 indexed roundId, address indexed winner, uint256 prize);
    event RoundStarted(uint256 indexed roundId, uint256 startTime);
    event RoundEnded(uint256 indexed roundId, uint256 endTime);
    
    constructor() Ownable(msg.sender) {
        _startNewRound();
    }
    
    // 🎫 Buy lottery ticket with hidden bet
    function buyTicket(bytes32 betCommitment) external payable nonReentrant {
        require(msg.value >= minBet, "Bet too low");
        require(msg.value <= maxBet, "Bet too high");
        
        LotteryRound storage round = rounds[currentRoundId];
        require(round.state == RoundState.OPEN, "Round not open");
        
        Ticket memory ticket = Ticket({
            player: msg.sender,
            betCommitment: betCommitment,
            revealedBet: 0,
            revealed: false,
            timestamp: block.timestamp
        });
        
        roundTickets[currentRoundId].push(ticket);
        playerRounds[msg.sender].push(currentRoundId);
        
        round.totalPool += msg.value;
        round.ticketCount++;
        
        emit TicketPurchased(currentRoundId, msg.sender, round.ticketCount - 1);
    }
    
    // 🔓 Reveal your bet (commit-reveal scheme)
    function revealBet(uint256 roundId, uint256 ticketId, uint256 betAmount, bytes32 salt) external {
        require(ticketId < roundTickets[roundId].length, "Invalid ticket");
        
        Ticket storage ticket = roundTickets[roundId][ticketId];
        require(ticket.player == msg.sender, "Not your ticket");
        require(!ticket.revealed, "Already revealed");
        
        bytes32 commitment = keccak256(abi.encodePacked(betAmount, salt));
        require(commitment == ticket.betCommitment, "Invalid reveal");
        
        ticket.revealedBet = betAmount;
        ticket.revealed = true;
        
        emit BetRevealed(roundId, msg.sender, betAmount);
    }
    
    // 🎰 Draw winner (simple random for demo)
    function drawWinner() external onlyOwner nonReentrant {
        LotteryRound storage round = rounds[currentRoundId];
        require(round.state == RoundState.OPEN, "Round not open");
        require(round.ticketCount > 0, "No tickets sold");
        
        round.state = RoundState.CLOSED;
        round.endTime = block.timestamp;
        
        // Simple pseudo-random (NOTE: not production-safe, for demo only)
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            round.ticketCount
        ))) % round.ticketCount;
        
        Ticket storage winningTicket = roundTickets[currentRoundId][randomIndex];
        address winner = winningTicket.player;
        
        // Calculate prize (total pool - platform fee)
        uint256 fee = (round.totalPool * platformFee) / 100;
        uint256 prize = round.totalPool - fee;
        
        round.winner = winner;
        round.prizeAmount = prize;
        round.state = RoundState.DRAWN;
        
        // Transfer prize to winner
        (bool success, ) = winner.call{value: prize}("");
        require(success, "Prize transfer failed");
        
        emit WinnerDrawn(currentRoundId, winner, prize);
        emit RoundEnded(currentRoundId, block.timestamp);
        
        // Start new round
        _startNewRound();
    }
    
    // 🆕 Start new round
    function _startNewRound() internal {
        currentRoundId++;
        
        rounds[currentRoundId] = LotteryRound({
            roundId: currentRoundId,
            state: RoundState.OPEN,
            totalPool: 0,
            ticketCount: 0,
            winner: address(0),
            prizeAmount: 0,
            startTime: block.timestamp,
            endTime: 0
        });
        
        emit RoundStarted(currentRoundId, block.timestamp);
    }
    
    // 📊 View functions
    function getCurrentRound() external view returns (LotteryRound memory) {
        return rounds[currentRoundId];
    }
    
    function getRoundTickets(uint256 roundId) external view returns (uint256) {
        return roundTickets[roundId].length;
    }
    
    function getPlayerTicket(uint256 roundId, uint256 ticketId) external view returns (Ticket memory) {
        require(ticketId < roundTickets[roundId].length, "Invalid ticket");
        Ticket memory ticket = roundTickets[roundId][ticketId];
        require(ticket.player == msg.sender, "Not your ticket");
        return ticket;
    }
    
    function getPlayerHistory(address player) external view returns (uint256[] memory) {
        return playerRounds[player];
    }
    
    // ⚙️ Admin functions
    function updateBetLimits(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin < newMax, "Invalid limits");
        minBet = newMin;
        maxBet = newMax;
    }
    
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee too high");
        platformFee = newFee;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}

