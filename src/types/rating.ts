export interface Rating {
  id?: string;
  targetId: string;
  targetType: "admin" | "course" | "live";
  userId: string;
  userName: string;
  rating: number;
  createdAt?: unknown;
}

export interface RatingStats {
  average: number;
  count: number;
}
