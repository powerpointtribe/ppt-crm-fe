// Mock data for development when API is unavailable

export const mockStats = {
  users: {
    total: 45,
    active: 42,
    newThisMonth: 8
  },
  members: {
    total: 12,
    newConverts: 87,
    leaders: 45,
    thisMonth: 23
  },
  groups: {
    total: 28,
    active: 25,
    newThisMonth: 3
  },
  firstTimers: {
    total: 156,
    recent: 12,
    thisMonth: 34
  }
}

export const mockUsers = [
  {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    role: 'pastor',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    _id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    role: 'leadership',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  }
]

export const mockMembers = [
  {
    _id: '1',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1234567892',
    dateOfBirth: '1990-05-15',
    gender: 'female' as const,
    maritalStatus: 'married' as const,
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    district: 'District A',
    unit: 'Unit 1',
    membershipStatus: 'worker' as const,
    dateJoined: '2023-03-10',
    createdAt: '2023-03-10T10:00:00Z',
    updatedAt: '2023-03-10T10:00:00Z'
  },
  {
    _id: '2',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob.wilson@example.com',
    phone: '+1234567893',
    dateOfBirth: '1985-08-22',
    gender: 'male' as const,
    maritalStatus: 'single' as const,
    address: {
      street: '456 Oak Ave',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    district: 'District B',
    membershipStatus: 'new_convert' as const,
    dateJoined: '2024-01-05',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z'
  }
]

export const mockAuthUser = {
  _id: '1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@powerpoint-tribe.com',
  role: 'super_admin',
  isActive: true,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z'
}

export const mockAuthResponse = {
  user: mockAuthUser,
  access_token: 'mock-jwt-token-for-development'
}

// Utility function to simulate API delay
export const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Utility function to simulate API responses
export const mockApiResponse = async <T>(data: T, shouldFail = false): Promise<T> => {
  await delay()

  if (shouldFail) {
    throw new Error('Simulated API error')
  }

  return data
}
