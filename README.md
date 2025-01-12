# NFT Monitor

实时监控NFT转账和移动的JavaScript脚本。

## 功能特性

- 🔄 实时监控NFT转账事件
- 📍 支持监控特定合约地址
- 👛 支持监控特定钱包地址
- 🏷️ 显示Token ID、发送方、接收方等详细信息
- 🎨 识别铸造和销毁事件
- ⏰ 实时时间戳记录

## 安装

```bash
npm install
```

## 配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，添加您的RPC URL：
```
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

## 使用方法

### 基本使用
```bash
npm start
```

### 开发模式
```bash
npm run dev
```

### 监控特定合约
编辑 `nftMonitor.js` 中的 `CONTRACTS_TO_MONITOR` 数组：
```javascript
const CONTRACTS_TO_MONITOR = [
    '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // BAYC
    '0x60e4d786628fea6478f785a6d7e704777c86a7c6', // MAYC
];
```

### 监控特定钱包
在 `.env` 文件中设置：
```
WALLET_ADDRESS=0x1234567890123456789012345678901234567890
```

## 代码示例

```javascript
const NFTMonitor = require('./nftMonitor');

const monitor = new NFTMonitor('YOUR_RPC_URL', ['CONTRACT_ADDRESS']);
monitor.monitorNFTTransfers();
```

## 支持的网络

- 以太坊主网
- 其他EVM兼容网络 (修改RPC_URL即可)

## 注意事项

- 需要有效的RPC提供商 (Alchemy, Infura等)
- 监控大量合约可能消耗较多API配额
- 建议在生产环境使用WebSocket连接以提高稳定性