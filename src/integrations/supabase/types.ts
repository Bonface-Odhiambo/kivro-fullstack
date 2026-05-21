export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      [tableName: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      [viewName: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: Record<string, unknown>;
    Enums: Record<string, string[]>;
  };
}
