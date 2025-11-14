import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Replace with your deployed contract address
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';

const CONTRACT_ABI = [
  "function buyTicket(bytes32 betCommitment) external payable",
  "function revealBet(uint256 roundId, uint256 ticketId, uint256 betAmount, bytes32 salt) external",
  "function getCurrentRound() external view returns (tuple(uint256 roundId, uint8 state, uint256 totalPool, uint256 ticketCount, address winner, uint256 prizeAmount, uint256 startTime, uint256 endTime))",
  "function getRoundTickets(uint256 roundId) external view returns (uint256)",
  "function getPlayerHistory(address player) external view returns (uint256[])",
  "function minBet() external view returns (uint256)",
  "function maxBet() external view returns (uint256)",
  "event TicketPurchased(uint256 indexed roundId, address indexed player, uint256 ticketId)",
  "event WinnerDrawn(uint256 indexed roundId, address indexed winner, uint256 prize)"
];

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [betAmount, setBetAmount] = useState('0.01');
  const [salt, setSalt] = useState('');

  useEffect(() => {
    // Generate random salt on load
    setSalt(ethers.hexlify(ethers.randomBytes(32)));
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      setAccount(accounts[0]);
      
      if (CONTRACT_ADDRESS) {
        const lotteryContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(lotteryContract);
        loadRoundInfo(lotteryContract);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const loadRoundInfo = async (contractInstance) => {
    try {
      const currentRound = await contractInstance.getCurrentRound();
      setRound({
        id: currentRound.roundId.toString(),
        pool: ethers.formatEther(currentRound.totalPool),
        tickets: currentRound.ticketCount.toString()
      });
    } catch (error) {
      console.error('Error loading round:', error);
    }
  };

  const buyTicket = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const amountWei = ethers.parseEther(betAmount);
      const commitment = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [amountWei, salt])
      );

      const tx = await contract.buyTicket(commitment, { value: amountWei });
      await tx.wait();
      
      alert('🎉 Ticket purchased! Save your salt to reveal later: ' + salt);
      
      // Refresh round info
      loadRoundInfo(contract);
      
      // Generate new salt for next ticket
      setSalt(ethers.hexlify(ethers.randomBytes(32)));
    } catch (error) {
      console.error('Error buying ticket:', error);
      alert('Failed to buy ticket: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🎲 Secret Lottery</h1>
        <p>Win big with privacy!</p>
      </header>

      {!account ? (
        <div className="connect-section">
          <div className="connect-card">
            <h2>🎟️ Welcome to Secret Lottery!</h2>
            <p>Connect your wallet to start playing</p>
            <button className="btn-connect" onClick={connectWallet}>
              Connect Wallet
            </button>
            <div className="features">
              <div className="feature">
                <span>🔒</span>
                <p>Hidden Bets</p>
              </div>
              <div className="feature">
                <span>🎰</span>
                <p>Fair Draw</p>
              </div>
              <div className="feature">
                <span>💰</span>
                <p>Big Prizes</p>
              </div>
            </div>
          </div>
        </div>
      ) : !CONTRACT_ADDRESS ? (
        <div className="error-box">
          <h2>⚠️ Contract Not Configured</h2>
          <p>Please set REACT_APP_CONTRACT_ADDRESS in .env file</p>
        </div>
      ) : (
        <div className="game-section">
          <div className="wallet-info">
            <span>👤 {account.slice(0, 6)}...{account.slice(-4)}</span>
          </div>

          {round && (
            <div className="round-info">
              <h2>🎰 Current Round #{round.id}</h2>
              <div className="stats">
                <div className="stat">
                  <span className="label">Prize Pool</span>
                  <span className="value">{round.pool} ETH</span>
                </div>
                <div className="stat">
                  <span className="label">Tickets Sold</span>
                  <span className="value">{round.tickets}</span>
                </div>
              </div>
            </div>
          )}

          <div className="buy-section">
            <h3>🎫 Buy Ticket</h3>
            <div className="input-group">
              <label>Bet Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                max="1"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.01"
              />
            </div>
            
            <div className="salt-info">
              <p>🔐 Your secret salt (save this!):</p>
              <code>{salt}</code>
            </div>

            <button
              className="btn-buy"
              onClick={buyTicket}
              disabled={loading}
            >
              {loading ? '⏳ Buying...' : '🎟️ Buy Ticket'}
            </button>

            <p className="note">
              💡 Your bet amount will be hidden using the salt above.
              Save it to reveal your bet later!
            </p>
          </div>

          <div className="how-it-works">
            <h3>📖 How It Works</h3>
            <ol>
              <li>Choose your bet amount</li>
              <li>We generate a secret salt</li>
              <li>Your bet is hidden with cryptography</li>
              <li>Wait for the draw!</li>
              <li>Winner gets 95% of the prize pool</li>
            </ol>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>🔐 Built with Privacy • Powered by Blockchain</p>
        <p>⚠️ Play responsibly • This is a demo</p>
      </footer>
    </div>
  );
}

export default App;

