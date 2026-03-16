// Mock data for development - will be replaced with Lovable Cloud

export const mockUser = {
  id: "1",
  username: "johndoe",
  email: "john@gmail.com",
  firstName: "John",
  lastName: "Doe",
  usdtBalance: 45.50,
  referralCode: "JOHN2024",
  registrationStatus: "active" as const,
  isAdmin: false,
  walletAddress: "TXkR...8fG2",
  createdAt: "2024-01-15",
};

export const mockAdminUser = {
  id: "0",
  username: "admin",
  email: "admin@gmail.com",
  firstName: "Admin",
  lastName: "",
  usdtBalance: 0,
  referralCode: "ADMIN001",
  registrationStatus: "active" as const,
  isAdmin: true,
  walletAddress: "",
  createdAt: "2024-01-01",
};

export const mockTasks = [
  {
    id: "1",
    title: "Follow on Twitter",
    description: "Follow our official Twitter account and like the pinned post.",
    rewardAmount: 2.50,
    type: "social",
    platform: "Twitter",
    link: "https://twitter.com/entrevault",
    isActive: true,
    category: "Social Media",
    difficulty: "Easy",
    maxCompletions: 100,
    status: "active",
  },
  {
    id: "2",
    title: "Create Promotional Video",
    description: "Create a 60-second promotional video about EntreVault and share on YouTube.",
    rewardAmount: 15.00,
    type: "video",
    platform: "YouTube",
    link: "",
    isActive: true,
    category: "Content Creation",
    difficulty: "Hard",
    maxCompletions: 20,
    status: "active",
  },
  {
    id: "3",
    title: "Join Telegram Group",
    description: "Join our official Telegram group and introduce yourself.",
    rewardAmount: 1.00,
    type: "social",
    platform: "Telegram",
    link: "https://t.me/entrevault",
    isActive: true,
    category: "Social Media",
    difficulty: "Easy",
    maxCompletions: 500,
    status: "active",
  },
  {
    id: "4",
    title: "Write a Blog Review",
    description: "Write a detailed blog review of EntreVault platform with at least 500 words.",
    rewardAmount: 8.00,
    type: "content",
    platform: "Blog",
    link: "",
    isActive: true,
    category: "Content Creation",
    difficulty: "Medium",
    maxCompletions: 50,
    status: "active",
  },
];

export const mockTransactions = [
  { id: "1", userId: "1", amount: 2.50, type: "reward" as const, status: "completed" as const, txHash: null, createdAt: "2024-03-10T10:30:00Z" },
  { id: "2", userId: "1", amount: 1.00, type: "referral_bonus" as const, status: "completed" as const, txHash: null, createdAt: "2024-03-09T14:20:00Z" },
  { id: "3", userId: "1", amount: 15.00, type: "withdrawal" as const, status: "pending" as const, txHash: null, createdAt: "2024-03-08T09:15:00Z" },
  { id: "4", userId: "1", amount: 10.00, type: "deposit" as const, status: "completed" as const, txHash: "abc123", createdAt: "2024-03-07T16:45:00Z" },
];

export const mockAdminSettings = {
  registrationFee: 10,
  adminWalletAddress: "TRC20WalletAddressHere",
  referralBonusPercent: 10,
  paymentInstructions: "Send the registration fee to the wallet address below. After payment, upload a screenshot of your transaction.",
  minipayNumber: "+1234567890",
};

export const mockPendingUsers = [
  { id: "5", username: "alice", email: "alice@gmail.com", firstName: "Alice", lastName: "Smith", registrationStatus: "pending" as const, paymentProofUrl: "https://placehold.co/400x300", createdAt: "2024-03-15" },
  { id: "6", username: "bob", email: "bob@gmail.com", firstName: "Bob", lastName: "Jones", registrationStatus: "pending" as const, paymentProofUrl: "https://placehold.co/400x300", createdAt: "2024-03-14" },
];

export const mockTaskCompletions = [
  { id: "1", userId: "1", taskId: "1", status: "approved" as const, proofUrl: "https://twitter.com/proof1", submittedAt: "2024-03-10", reviewedAt: "2024-03-10" },
  { id: "2", userId: "1", taskId: "3", status: "pending" as const, proofUrl: "https://t.me/proof2", submittedAt: "2024-03-11", reviewedAt: null },
];
