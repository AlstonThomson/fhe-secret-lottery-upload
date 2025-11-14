# 🎲 FHE Secret Lottery

A decentralized lottery system with encrypted bets using commitment schemes for privacy protection.

## 🌟 What is Secret Lottery?

Secret Lottery is a blockchain-based lottery where players can participate without revealing their bet amounts until they choose to. Using cryptographic commitments, all bets remain private, ensuring fair play and preventing manipulation.

## ✨ Key Features

🔒 **Private Betting** - Your bet amount stays hidden using commitment schemes
🎰 **Fair Random Draw** - Transparent and verifiable winner selection  
💰 **Instant Payouts** - Winners receive prizes automatically
🎟️ **Multi-Round** - Continuous lottery rounds
📊 **Transparent History** - All rounds and results on-chain

## 🎯 How It Works

### 1. Buy Ticket
- Choose your bet amount (between 0.001 - 1 ETH)
- Create a commitment (hash of amount + secret)
- Submit ticket with hidden bet

### 2. Optional: Reveal Bet
- You can reveal your bet anytime
- Provides commitment + secret for verification
- Others still can't see unrevealed bets

### 3. Drawing
- Admin draws winner when round closes
- Random selection from all tickets
- Winner gets 95% of pool (5% platform fee)

### 4. New Round
- New round starts automatically
- Previous round results saved on-chain

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Compile Contracts

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Deploy

```bash
# Local deployment
npm run deploy:local

# Testnet deployment  
npm run deploy:testnet
```

## 📖 Usage Example

### Buying a Ticket

```javascript
// Generate commitment
const betAmount = ethers.parseEther("0.1");
const salt = ethers.randomBytes(32);
const commitment = ethers.keccak256(
  ethers.solidityPacked(["uint256", "bytes32"], [betAmount, salt])
);

// Buy ticket
await lottery.buyTicket(commitment, { value: betAmount });
```

### Revealing Your Bet

```javascript
await lottery.revealBet(roundId, ticketId, betAmount, salt);
```

### Checking Round Info

```javascript
const round = await lottery.getCurrentRound();
console.log("Prize Pool:", ethers.formatEther(round.totalPool));
console.log("Tickets Sold:", round.ticketCount.toString());
```

## 🏗️ Architecture

```
SecretLotto
├── Ticket Management
│   ├── Buy with commitment
│   ├── Reveal bet (optional)
│   └── View your tickets
├── Round Management
│   ├── Auto-start new rounds
│   ├── Draw winners
│   └── Prize distribution
└── Admin Controls
    ├── Update bet limits
    ├── Adjust platform fee
    └── Withdraw fees
```

## 🔐 Privacy Features

### Commitment Scheme
```
Commitment = Hash(BetAmount + Salt)
```

- Hides actual bet amount
- Tamper-proof (can't change after submit)
- Verifiable (can prove later with reveal)

### Why This Matters
- Prevents bet copying
- No front-running
- Fair for all players
- MEV protection

## 🎮 Game Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Min Bet | 0.001 ETH | Minimum ticket price |
| Max Bet | 1 ETH | Maximum ticket price |
| Platform Fee | 5% | Fee taken from prize pool |
| Winner Prize | 95% | Percentage winner receives |

## 📝 Smart Contract Functions

### Player Functions
- `buyTicket(bytes32 commitment)` - Purchase lottery ticket
- `revealBet(uint256 roundId, uint256 ticketId, uint256 amount, bytes32 salt)` - Reveal your bet
- `getPlayerHistory(address player)` - View your participation history

### View Functions
- `getCurrentRound()` - Get current round info
- `getRoundTickets(uint256 roundId)` - Get ticket count for round
- `getPlayerTicket(uint256 roundId, uint256 ticketId)` - View your ticket details

### Admin Functions
- `drawWinner()` - Draw winner and start new round
- `updateBetLimits(uint256 min, uint256 max)` - Update bet limits
- `updatePlatformFee(uint256 fee)` - Update platform fee
- `withdrawFees()` - Withdraw accumulated fees

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Ticket purchasing
- Bet revealing
- Winner drawing
- Admin functions
- Edge cases

## 🌐 Frontend

The project includes a React frontend in the `client/` directory.

```bash
# Setup frontend
npm run client:setup

# Start frontend
npm start
```

Features:
- Connect wallet
- Buy tickets
- Reveal bets
- View rounds
- Check history

## 🔧 Configuration

Edit `hardhat.config.js` to configure networks:

```javascript
networks: {
  sepolia: {
    url: "YOUR_RPC_URL",
    accounts: ["YOUR_PRIVATE_KEY"]
  }
}
```

## ⚠️ Important Notes

### Random Number Generation
The current implementation uses `block.prevrandao` for randomness, which is suitable for testnet demos but NOT production. For mainnet, consider:
- Chainlink VRF
- Commit-reveal with multiple participants
- Other verifiable random sources

### Commitment Security
- Keep your salt secret!
- Store salt safely to reveal later
- Don't reuse salts

## 📊 Project Structure

```
fhe-secret-lottery/
├── contracts/
│   └── SecretLotto.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── SecretLotto.test.js
├── client/           (React frontend)
├── hardhat.config.js
└── README.md
```

## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📜 License

MIT License

## 🎉 Have Fun!

Enjoy playing the Secret Lottery! Remember: play responsibly and only bet what you can afford to lose.

---

Built for the Zama Developer Program 🔐

