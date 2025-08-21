import {
  User,
  UserRegistrationData,
  UserProfile,
  UserSubscription,
} from "@/types/user";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// Storage keys for mock data
const USERS_STORAGE_KEY = "users_database";
const CURRENT_USER_KEY = "current_user";

// Utility functions for mock storage
function readMockUsers(): User[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function writeMockUsers(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Generate unique user ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Hash password (simple implementation - use proper hashing in production)
function hashPassword(password: string): string {
  // This is a very basic hash - use bcrypt or similar in production
  return btoa(password + "salt_key").replace(/[^a-zA-Z0-9]/g, "");
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// User registration
export async function registerUser(userData: UserRegistrationData): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    // Validate input
    if (
      !userData.email ||
      !userData.password ||
      !userData.firstName ||
      !userData.lastName
    ) {
      return {
        success: false,
        error: "Todos los campos obligatorios deben ser completados",
      };
    }

    if (!isValidEmail(userData.email)) {
      return { success: false, error: "El formato del email no es válido" };
    }

    if (userData.password.length < 6) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres",
      };
    }

    if (USE_MOCK) {
      const users = readMockUsers();

      // Check if user already exists
      const existingUser = users.find(
        (u) => u.email.toLowerCase() === userData.email.toLowerCase()
      );
      if (existingUser) {
        return { success: false, error: "Ya existe una cuenta con este email" };
      }

      // Create new user
      const now = Date.now();
      const newUser: User = {
        id: generateUserId(),
        email: userData.email.toLowerCase(),
        name: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: userData.company,
        industry: userData.industry,
        phone: userData.phone,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        subscription: {
          plan: "free",
          status: "trial",
          startDate: now,
          endDate: now + 30 * 24 * 60 * 60 * 1000, // 30 days trial
          features: ["basic_inventory", "up_to_100_products", "basic_reports"],
        },
      };

      // Store hashed password separately (in real app, this would be in secure storage)
      const userWithPassword = {
        ...newUser,
        passwordHash: hashPassword(userData.password),
      };

      users.push(userWithPassword);
      writeMockUsers(users);

      // Don't return password hash
      const { passwordHash, ...userToReturn } = userWithPassword;
      return { success: true, user: userToReturn };
    }

    // TODO: Implement Firebase Auth registration
    throw new Error("Firebase registration not implemented yet");
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error durante el registro",
    };
  }
}

// User login
export async function loginUser(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email y contraseña son requeridos" };
    }

    if (USE_MOCK) {
      const users = readMockUsers();
      const userWithPassword = users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          (u as any).passwordHash === hashPassword(password)
      );

      if (!userWithPassword) {
        return { success: false, error: "Email o contraseña incorrectos" };
      }

      if (!userWithPassword.isActive) {
        return {
          success: false,
          error: "Cuenta desactivada. Contacta soporte.",
        };
      }

      // Update last login
      userWithPassword.updatedAt = Date.now();
      writeMockUsers(users);

      // Don't return password hash
      const { passwordHash, ...user } = userWithPassword as any;
      setCurrentUser(user);

      return { success: true, user };
    }

    // TODO: Implement Firebase Auth login
    throw new Error("Firebase login not implemented yet");
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error durante el login",
    };
  }
}

// Get current authenticated user
export function getAuthenticatedUser(): User | null {
  return getCurrentUser();
}

// Logout user
export async function logoutUser(): Promise<void> {
  setCurrentUser(null);
  // Clear any other user-specific data
  if (typeof window !== "undefined") {
    // Clear user-specific data from localStorage
    const keysToRemove = [
      "mock_products",
      "mock_stock_movements",
      "mock_product_reservations",
      "mock_stock_alerts",
      "smart_notifications",
      "inventory_audits",
    ];

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    if (USE_MOCK) {
      const users = readMockUsers();
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        return { success: false, error: "Usuario no encontrado" };
      }

      // Update user
      const updatedUser = {
        ...users[userIndex],
        ...updates,
        updatedAt: Date.now(),
      };

      users[userIndex] = updatedUser;
      writeMockUsers(users);

      // Update current user if it's the same
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }

      return { success: true, user: updatedUser };
    }

    // TODO: Implement Firebase user update
    throw new Error("Firebase user update not implemented yet");
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error actualizando perfil",
    };
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Get user by email (admin function)
export async function getUserByEmail(email: string): Promise<User | null> {
  if (USE_MOCK) {
    const users = readMockUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (user) {
      const { passwordHash, ...userWithoutPassword } = user as any;
      return userWithoutPassword;
    }
  }

  // TODO: Implement Firebase query
  return null;
}

// Delete user account
export async function deleteUserAccount(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (USE_MOCK) {
      const users = readMockUsers();
      const filteredUsers = users.filter((u) => u.id !== userId);

      if (filteredUsers.length === users.length) {
        return { success: false, error: "Usuario no encontrado" };
      }

      writeMockUsers(filteredUsers);

      // If deleting current user, logout
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        await logoutUser();
      }

      return { success: true };
    }

    // TODO: Implement Firebase user deletion
    throw new Error("Firebase user deletion not implemented yet");
  } catch (error) {
    console.error("Account deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error eliminando cuenta",
    };
  }
}

// Reset password (send reset email)
export async function resetPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isValidEmail(email)) {
      return { success: false, error: "Email no válido" };
    }

    if (USE_MOCK) {
      const users = readMockUsers();
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        // Don't reveal if user exists for security
        return { success: true };
      }

      // In a real app, this would send an email
      console.log(`Password reset email would be sent to: ${email}`);
      return { success: true };
    }

    // TODO: Implement Firebase password reset
    throw new Error("Firebase password reset not implemented yet");
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error enviando email de reseteo",
    };
  }
}

// Get user subscription info
export function getUserSubscription(user: User): UserSubscription {
  return (
    user.subscription || {
      plan: "free",
      status: "inactive",
      startDate: Date.now(),
      features: ["basic_inventory"],
    }
  );
}

// Check if user has feature access
export function hasFeatureAccess(user: User, feature: string): boolean {
  const subscription = getUserSubscription(user);
  return (
    subscription.features.includes(feature) && subscription.status === "active"
  );
}

// Get trial days remaining
export function getTrialDaysRemaining(user: User): number {
  const subscription = getUserSubscription(user);
  if (subscription.status !== "trial" || !subscription.endDate) return 0;

  const daysRemaining = Math.ceil(
    (subscription.endDate - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysRemaining);
}

// Initialize demo user
export function initializeDemoUser(): void {
  if (typeof window === "undefined") return;

  const users = readMockUsers();
  const demoUserExists = users.some((u) => u.email === "demo@inventario.com");

  if (!demoUserExists) {
    const now = Date.now();
    const demoUser = {
      id: "demo_user_001",
      email: "demo@inventario.com",
      name: "Usuario Demo",
      firstName: "Usuario",
      lastName: "Demo",
      company: "Empresa Demo",
      industry: "retail",
      createdAt: now,
      updatedAt: now,
      isActive: true,
      subscription: {
        plan: "premium" as const,
        status: "active" as const,
        startDate: now,
        endDate: now + 365 * 24 * 60 * 60 * 1000, // 1 year
        features: [
          "basic_inventory",
          "unlimited_products",
          "advanced_reports",
          "smart_notifications",
          "audit_system",
          "multi_location",
        ],
      },
      passwordHash: hashPassword("demo123"),
    };

    users.push(demoUser);
    writeMockUsers(users);
  }
}
