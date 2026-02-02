// Mock data service for RBI Analysis
class RBIService {
  // Fetch RBI regulatory updates
  async fetchRegulatoryUpdates() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Master Direction on Interest Rate Risk Management',
            date: '2025-09-15',
            category: 'Banking Regulation',
            summary: 'Updated guidelines on interest rate risk management for banks operating in India.',
            status: 'New',
            priority: 'High'
          },
          {
            id: '2',
            title: 'Circular on Digital Lending Guidelines',
            date: '2025-09-10',
            category: 'Fintech Regulation',
            summary: 'Revised framework for digital lending activities by regulated entities.',
            status: 'Updated',
            priority: 'Medium'
          },
          {
            id: '3',
            title: 'Notification on Cyber Security Framework',
            date: '2025-09-05',
            category: 'Information Security',
            summary: 'Enhanced cybersecurity framework for supervised entities.',
            status: 'New',
            priority: 'High'
          },
          {
            id: '4',
            title: 'Guidelines on Frauds Classification',
            date: '2025-08-28',
            category: 'Fraud Management',
            summary: 'Revised classification of frauds and reporting requirements.',
            status: 'Updated',
            priority: 'Medium'
          }
        ]);
      }, 500);
    });
  }

  // Fetch monetary policy data
  async fetchMonetaryPolicyData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          policyRate: 6.50,
          repoRate: 6.50,
          reverseRepoRate: 5.50,
          marginalStandingFacility: 6.75,
          bankRate: 6.75,
          cashReserveRatio: 4.50,
          statutoryLiquidityRatio: 18.00,
          inflationTarget: 4.00,
          gdpGrowth: 6.8,
          fiscalDeficit: 5.2
        });
      }, 500);
    });
  }

  // Fetch banking sector compliance data
  async fetchComplianceData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            bank: 'State Bank of India',
            complianceScore: 92,
            lastAudit: '2025-08-15',
            status: 'Compliant',
            issues: 0
          },
          {
            bank: 'HDFC Bank',
            complianceScore: 95,
            lastAudit: '2025-08-20',
            status: 'Compliant',
            issues: 0
          },
          {
            bank: 'ICICI Bank',
            complianceScore: 88,
            lastAudit: '2025-08-10',
            status: 'Review Required',
            issues: 2
          },
          {
            bank: 'Axis Bank',
            complianceScore: 85,
            lastAudit: '2025-07-28',
            status: 'Non-Compliant',
            issues: 4
          }
        ]);
      }, 500);
    });
  }
}

export default new RBIService();