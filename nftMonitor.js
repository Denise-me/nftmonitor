const { ethers } = require('ethers');
require('dotenv').config();

class NFTMonitor {
    constructor(rpcUrl, contractAddresses = []) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.contractAddresses = contractAddresses.map(addr => addr.toLowerCase());
        this.isRunning = false;
        
        // ERC-721 Transfer event signature
        this.transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    }

    // 监听指定NFT合约的转账事件
    async monitorNFTTransfers() {
        if (this.isRunning) {
            console.log('Monitor is already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting NFT movement monitoring...');
        console.log(`📊 Monitoring ${this.contractAddresses.length} contracts`);

        try {
            // 监听所有ERC-721 Transfer事件
            const filter = {
                topics: [this.transferEventSignature]
            };

            // 如果指定了合约地址，则只监听这些合约
            if (this.contractAddresses.length > 0) {
                filter.address = this.contractAddresses;
            }

            this.provider.on(filter, async (log) => {
                await this.handleTransferEvent(log);
            });

            console.log('✅ NFT监控已启动，等待转账事件...');
        } catch (error) {
            console.error('❌ 启动监控失败:', error);
            this.isRunning = false;
        }
    }

    // 处理转账事件
    async handleTransferEvent(log) {
        try {
            const parsedLog = this.parseTransferLog(log);
            await this.logTransferDetails(parsedLog);
        } catch (error) {
            console.error('处理转账事件时出错:', error);
        }
    }

    // 解析转账日志
    parseTransferLog(log) {
        const iface = new ethers.Interface([
            'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
        ]);
        
        const parsed = iface.parseLog(log);
        
        return {
            contractAddress: log.address,
            from: parsed.args.from,
            to: parsed.args.to,
            tokenId: parsed.args.tokenId.toString(),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp: new Date().toISOString()
        };
    }

    // 记录转账详情
    async logTransferDetails(transferData) {
        const { contractAddress, from, to, tokenId, blockNumber, transactionHash, timestamp } = transferData;
        
        console.log('\n🔔 NFT转账检测到:');
        console.log(`📍 合约地址: ${contractAddress}`);
        console.log(`🏷️  Token ID: ${tokenId}`);
        console.log(`📤 发送方: ${from}`);
        console.log(`📥 接收方: ${to}`);
        console.log(`🧱 区块号: ${blockNumber}`);
        console.log(`🔗 交易哈希: ${transactionHash}`);
        console.log(`⏰ 时间: ${timestamp}`);
        console.log('─'.repeat(50));

        // 检查是否为铸造或销毁
        if (from === '0x0000000000000000000000000000000000000000') {
            console.log('🎨 这是一个NFT铸造事件');
        } else if (to === '0x0000000000000000000000000000000000000000') {
            console.log('🔥 这是一个NFT销毁事件');
        } else {
            console.log('↔️  这是一个NFT转账事件');
        }
    }

    // 获取NFT元数据
    async getNFTMetadata(contractAddress, tokenId) {
        try {
            const contract = new ethers.Contract(contractAddress, [
                'function tokenURI(uint256 tokenId) view returns (string)',
                'function name() view returns (string)',
                'function symbol() view returns (string)'
            ], this.provider);

            const [tokenURI, name, symbol] = await Promise.all([
                contract.tokenURI(tokenId).catch(() => 'N/A'),
                contract.name().catch(() => 'Unknown'),
                contract.symbol().catch(() => 'N/A')
            ]);

            return { tokenURI, name, symbol };
        } catch (error) {
            console.error('获取NFT元数据失败:', error);
            return { tokenURI: 'N/A', name: 'Unknown', symbol: 'N/A' };
        }
    }

    // 停止监控
    stopMonitoring() {
        if (this.isRunning) {
            this.provider.removeAllListeners();
            this.isRunning = false;
            console.log('🛑 NFT监控已停止');
        }
    }

    // 监控特定钱包地址的NFT活动
    async monitorWalletActivity(walletAddress) {
        console.log(`👛 监控钱包地址: ${walletAddress}`);
        
        const filter = {
            topics: [
                this.transferEventSignature,
                null, // from (任意)
                ethers.zeroPadValue(walletAddress, 32) // to (指定钱包)
            ]
        };

        this.provider.on(filter, async (log) => {
            console.log(`📥 钱包 ${walletAddress} 收到NFT`);
            await this.handleTransferEvent(log);
        });

        // 监控从该钱包发出的NFT
        const outgoingFilter = {
            topics: [
                this.transferEventSignature,
                ethers.zeroPadValue(walletAddress, 32), // from (指定钱包)
                null // to (任意)
            ]
        };

        this.provider.on(outgoingFilter, async (log) => {
            console.log(`📤 钱包 ${walletAddress} 发送NFT`);
            await this.handleTransferEvent(log);
        });
    }
}

// 使用示例
async function main() {
    // 从环境变量获取RPC URL
    const RPC_URL = process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY';
    
    // 要监控的NFT合约地址列表 (可选)
    const CONTRACTS_TO_MONITOR = [
        // '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // BAYC
        // '0x60e4d786628fea6478f785a6d7e704777c86a7c6', // MAYC
    ];

    // 要监控的钱包地址 (可选)
    const WALLET_TO_MONITOR = process.env.WALLET_ADDRESS;

    const monitor = new NFTMonitor(RPC_URL, CONTRACTS_TO_MONITOR);

    // 启动NFT转账监控
    await monitor.monitorNFTTransfers();

    // 如果指定了钱包地址，同时监控该钱包
    if (WALLET_TO_MONITOR) {
        await monitor.monitorWalletActivity(WALLET_TO_MONITOR);
    }

    // 优雅退出处理
    process.on('SIGINT', () => {
        console.log('\n接收到退出信号...');
        monitor.stopMonitoring();
        process.exit(0);
    });
}

// 运行监控
if (require.main === module) {
    main().catch(console.error);
}

module.exports = NFTMonitor;