// Miden DeFi Service - Frontend Integration
export interface MidenDefiPool {
  poolId: string;
  name: string;
  asset: 'MIDEN' | 'USDC';
  apy: number;
  totalDeposited: number;
  totalBorrowed: number;
  utilizationRate: number;
  minDeposit: number;
  maxDeposit: number;
  isActive: boolean;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH';
  rewards: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  mockData?: boolean;
}

export interface MidenDefiPosition {
  id: string;
  poolId: string;
  amount: number;
  value: number;
  rewards: number;
  txHash?: string;
  createdAt: string;
  pool?: MidenDefiPool;
  dailyReward?: number;
  weeklyReward?: number;
  monthlyReward?: number;
}

export interface MidenDefiStats {
  totalValue: number;
  totalAmount: number;
  totalRewards: number;
  positionCount: number;
  estimatedDailyRewards: number;
  estimatedMonthlyRewards: number;
  poolStats: Array<{
    poolId: string;
    poolName: string;
    totalAmount: number;
    totalValue: number;
    totalRewards: number;
    dailyReward: number;
    weeklyReward: number;
    monthlyReward: number;
  }>;
}

export interface MidenMarketOverview {
  totalDeposited: number;
  totalBorrowed: number;
  averageApy: number;
  totalPools: number;
  activePools: number;
  marketTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdated: string;
}

class MidenDefiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  // Get all available DeFi pools
  async getPools(): Promise<MidenDefiPool[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/pools`);
      if (!response.ok) {
        throw new Error('Failed to fetch pools');
      }
      
      const data = await response.json();
      return data.pools || [];
    } catch (error) {
      console.error('Error fetching pools:', error);
      // Return mock data if API fails
      return this.getMockPools();
    }
  }

  // Get specific pool details
  async getPool(poolId: string): Promise<MidenDefiPool | null> {
    try {
      const pools = await this.getPools();
      return pools.find(pool => pool.poolId === poolId) || null;
    } catch (error) {
      console.error('Error fetching pool:', error);
      return null;
    }
  }

  // Get user positions
  async getUserPositions(storeId: string): Promise<MidenDefiPosition[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/store/${storeId}/positions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user positions');
      }
      
      const data = await response.json();
      return data.positions || [];
    } catch (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
  }

  // Get DeFi statistics for store
  async getDefiStats(storeId: string): Promise<MidenDefiStats | null> {
    try {
      const positions = await this.getUserPositions(storeId);
      const pools = await this.getPools();
      
      const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
      const totalAmount = positions.reduce((sum, pos) => sum + pos.amount, 0);
      const totalRewards = positions.reduce((sum, pos) => sum + pos.rewards, 0);

      const poolStats = positions.map(pos => {
        const pool = pools.find(p => p.poolId === pos.poolId);
        const dailyReward = (pos.amount * (pool?.apy || 0)) / 365 / 100;
        
        return {
          poolId: pos.poolId,
          poolName: pool?.name || 'Unknown Pool',
          totalAmount: pos.amount,
          totalValue: pos.value,
          totalRewards: pos.rewards,
          dailyReward,
          weeklyReward: dailyReward * 7,
          monthlyReward: dailyReward * 30
        };
      });

      return {
        totalValue,
        totalAmount,
        totalRewards,
        positionCount: positions.length,
        estimatedDailyRewards: poolStats.reduce((sum, pool) => sum + pool.dailyReward, 0),
        estimatedMonthlyRewards: poolStats.reduce((sum, pool) => sum + pool.monthlyReward, 0),
        poolStats
      };
    } catch (error) {
      console.error('Error fetching DeFi stats:', error);
      return null;
    }
  }

  // Get market overview
  async getMarketOverview(): Promise<MidenMarketOverview | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/market-overview`);
      if (!response.ok) {
        throw new Error('Failed to fetch market overview');
      }
      
      const data = await response.json();
      return data.overview || null;
    } catch (error) {
      console.error('Error fetching market overview:', error);
      return this.getMockMarketOverview();
    }
  }

  // Get pool statistics
  async getPoolStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/pool-stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch pool stats');
      }
      
      const data = await response.json();
      return data.stats || null;
    } catch (error) {
      console.error('Error fetching pool stats:', error);
      return null;
    }
  }

  // Create DeFi position (deposit)
  async createPosition(storeId: string, poolId: string, amount: number, value: number, txHash: string): Promise<MidenDefiPosition | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/store/${storeId}/deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poolId,
          amount,
          value,
          txHash
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create position');
      }
      
      const data = await response.json();
      return data.position || null;
    } catch (error) {
      console.error('Error creating position:', error);
      return null;
    }
  }

  // Update DeFi position
  async updatePosition(positionId: string, updates: Partial<MidenDefiPosition>): Promise<MidenDefiPosition | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/positions/${positionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update position');
      }
      
      const data = await response.json();
      return data.position || null;
    } catch (error) {
      console.error('Error updating position:', error);
      return null;
    }
  }

  // Remove DeFi position (withdraw)
  async removePosition(positionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/positions/${positionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove position');
      }
      
      return true;
    } catch (error) {
      console.error('Error removing position:', error);
      return false;
    }
  }

  // Mock data fallback
  private getMockPools(): MidenDefiPool[] {
    return [
      {
        poolId: 'miden-pool',
        name: 'MIDEN Lending Pool',
        asset: 'MIDEN',
        apy: 6.5,
        totalDeposited: 2500000,
        totalBorrowed: 1800000,
        utilizationRate: 72,
        minDeposit: 1,
        maxDeposit: 1000000,
        isActive: true,
        riskLevel: 'LOW',
        rewards: {
          daily: 0.18,
          weekly: 1.25,
          monthly: 5.42
        }
      },
      {
        poolId: 'usdc-pool',
        name: 'USDC Lending Pool',
        asset: 'USDC',
        apy: 4.2,
        totalDeposited: 1500000,
        totalBorrowed: 900000,
        utilizationRate: 60,
        minDeposit: 1,
        maxDeposit: 1000000,
        isActive: true,
        riskLevel: 'VERY_LOW',
        rewards: {
          daily: 0.12,
          weekly: 0.81,
          monthly: 3.50
        }
      },
      {
        poolId: 'miden-staking',
        name: 'MIDEN Staking Pool',
        asset: 'MIDEN',
        apy: 8.5,
        totalDeposited: 5000000,
        totalBorrowed: 0,
        utilizationRate: 0,
        minDeposit: 100,
        maxDeposit: 5000000,
        isActive: true,
        riskLevel: 'MEDIUM',
        rewards: {
          daily: 0.23,
          weekly: 1.63,
          monthly: 7.08
        }
      },
      {
        poolId: 'miden-yield',
        name: 'MIDEN Yield Farming',
        asset: 'MIDEN',
        apy: 12.5,
        totalDeposited: 800000,
        totalBorrowed: 0,
        utilizationRate: 0,
        minDeposit: 50,
        maxDeposit: 200000,
        isActive: true,
        riskLevel: 'HIGH',
        rewards: {
          daily: 0.34,
          weekly: 2.40,
          monthly: 10.42
        }
      }
    ];
  }

  private getMockMarketOverview(): MidenMarketOverview {
    return {
      totalDeposited: 9800000,
      totalBorrowed: 2700000,
      averageApy: 7.93,
      totalPools: 4,
      activePools: 4,
      marketTrend: 'BULLISH',
      volatility: 'LOW',
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const midenDefiService = new MidenDefiService();
export default midenDefiService;
