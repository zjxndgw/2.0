import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Index() {
  const [account, setAccount] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [amountBnb, setAmountBnb] = useState("0.01");
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);

  const presaleWallet = "0x01F1Af78A716eDF3110EA4b1129E3122dA3307a0";
  const chainId = "0x38"; // BSC Mainnet
  const bnbToTokenRate = 10 / 0.01; // 1000 tokens per BNB

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => connectWallet());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  async function connectWallet() {
    try {
      if (!window.ethereum) return alert("请安装 MetaMask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== parseInt(chainId, 16))
        return alert("请切换到 BSC 主网");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      const balance = await provider.getBalance(accounts[0]);
      setEthBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error(err);
      alert("连接钱包失败");
    }
  }

  async function buyTokens() {
    if (!account) return alert("请先连接钱包");
    const amountNum = parseFloat(amountBnb);
    if (isNaN(amountNum) || amountNum < 0.01) {
      alert("最低购买金额为 0.01 BNB");
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: presaleWallet,
        value: ethers.parseEther(amountBnb),
      });
      await tx.wait();
      alert("购买成功! 交易哈希: " + tx.hash);
      fetchBuyers();
      refreshBalance();
    } catch (err) {
      console.error(err);
      alert("购买失败: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshBalance() {
    if (!account) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(account);
    setEthBalance(ethers.formatEther(balance));
  }

  function fetchBuyers() {
    setBuyers((prev) =>
      [
        {
          address: account,
          amount: amountBnb,
          tokens: (parseFloat(amountBnb) * bnbToTokenRate).toFixed(2),
          time: new Date().toLocaleString(),
        },
        ...prev,
      ].slice(0, 10)
    );
  }

  function shortAddress(addr) {
    return addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
  }

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "auto" }}>
      <h1>GPCA 代币预售 (BNB 购买)</h1>
      {account ? (
        <>
          <p>钱包地址: {shortAddress(account)}</p>
          <p>BNB 余额: {parseFloat(ethBalance).toFixed(4)}</p>
        </>
      ) : (
        <button onClick={connectWallet}>连接钱包</button>
      )}

      <div style={{ marginTop: 20 }}>
        <label>
          购买金额 (BNB，最小 0.01):
          <input
            style={{ marginLeft: 8, width: 120 }}
            type="number"
            min="0.01"
            step="0.01"
            value={amountBnb}
            onChange={(e) => setAmountBnb(e.target.value)}
          />
        </label>
        <p>
          预计获得代币数量：<b>{(parseFloat(amountBnb) * bnbToTokenRate).toFixed(2)} GPCA</b>
        </p>
      </div>

      <button onClick={buyTokens} disabled={loading}>
        {loading
          ? "购买中..."
          : `购买 ${amountBnb} BNB (${(parseFloat(amountBnb) * bnbToTokenRate).toFixed(2)} GPCA)`}
      </button>

      <h2 style={{ marginTop: 40 }}>最新买家</h2>
      <ul>
        {buyers.map((b, i) => (
          <li key={i}>
            <a
              href={`https://bscscan.com/address/${b.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortAddress(b.address)}
            </a>{" "}
            — {b.amount} BNB — {b.tokens} GPCA — {b.time}
          </li>
        ))}
      </ul>
    </div>
  );
}
