// Domain types shared across client and server

export type Role = "student" | "instructor" | "admin";
export type CourseStatus = "draft" | "published" | "archived";
export type XenditStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface CourseVideo {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  durationSeconds: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface CourseLearning {
  id: string;
  courseId: string;
  content: string;
  sortOrder: number;
}

export interface CoursePrerequisite {
  id: string;
  courseId: string;
  content: string;
  sortOrder: number;
}

export interface CourseTargetAudience {
  id: string;
  courseId: string;
  content: string;
  sortOrder: number;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  status: CourseStatus;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  instructor?: Profile;
  videos?: CourseVideo[];
  learnings?: CourseLearning[];
  prerequisites?: CoursePrerequisite[];
  targetAudiences?: CourseTargetAudience[];
  enrollmentCount?: number;
}

export interface CartItem {
  id: string;
  userId: string;
  courseId: string;
  addedAt: string;
  course?: Course;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  purchasedAt: string;
  course?: Course;
}

export interface Comment {
  id: string;
  userId: string;
  courseId: string;
  content: string;
  createdAt: string;
  user?: Pick<Profile, "id" | "fullName" | "avatarUrl">;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  courseId: string;
  instructorId: string;
  priceAtPurchase: number;
  course?: Course;
}

export interface Transaction {
  id: string;
  userId: string;
  totalAmount: number;
  xenditInvoiceId: string | null;
  xenditPaymentMethod: string | null;
  xenditStatus: XenditStatus | null;
  paidAt: string | null;
  createdAt: string;
  items?: TransactionItem[];
}

// ─── Auth session ────────────────────────────────────────────────────────────

export interface Session {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// ─── View router state ────────────────────────────────────────────────────────

export type Route =
  | { name: "home" }
  | { name: "login" }
  | { name: "signup" }
  | { name: "verify"; email: string }
  | { name: "courses" }
  | { name: "my-learning" }
  | { name: "course"; courseId: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "payment-success"; transactionId: string }
  | { name: "profile" }
  | { name: "teach" }
  | { name: "teach-courses" }
  | { name: "teach-course-edit"; courseId: string | null }
  | { name: "teach-revenue" }
  | { name: "admin" }
  | { name: "admin-courses" }
  | { name: "admin-users" }
  | { name: "admin-instructors" }
  | { name: "admin-transactions" };
