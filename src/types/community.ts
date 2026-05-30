export type CommunityPostType = "duvida" | "projeto" | "discussao" | "dica";

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  type: CommunityPostType;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: Date;
}
