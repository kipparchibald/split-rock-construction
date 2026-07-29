export type ProjectStatus = "planning" | "permitting" | "in_progress" | "punch_list" | "complete" | "on_hold";
export type ProjectType = "residential" | "commercial";
export type BidStatus = "draft" | "submitted" | "won" | "lost" | "expired";
export type EquipmentStatus = "available" | "on_site" | "maintenance" | "retired";
export type SafetySeverity = "near_miss" | "minor" | "serious" | "critical";
export type DocType = "rfi" | "submittal" | "drawing" | "permit" | "change_order" | "contract";
export type Phase = "Site Work" | "Foundation" | "Framing" | "MEP Rough-In" | "Insulation" | "Drywall" | "Exterior" | "Interior Finishes" | "Landscaping" | "Final Walkthrough";

export interface Client {
  id: string; name: string; email: string; phone: string;
  type: "homeowner" | "developer" | "commercial";
  address: string; notes: string;
}
export interface CrewMember {
  id: string; name: string; role: string; trade: string; phone: string;
  status: "active" | "pto" | "off_site"; rate: number; certifications: string[]; projectId?: string;
}
export interface Crew {
  id: string; name: string; leadId: string; trade: string; memberIds: string[]; projectId?: string;
}
export interface Equipment {
  id: string; name: string; category: string; status: EquipmentStatus;
  projectId?: string; nextService: string; hours: number;
}
export interface Bid {
  id: string; title: string; clientId: string; type: ProjectType; status: BidStatus;
  amount: number; submittedAt?: string; dueDate: string; notes: string;
  lineItems: { label: string; amount: number }[];
}
export interface Project {
  id: string; name: string; address: string; clientId: string; type: ProjectType;
  status: ProjectStatus; phase: Phase; progress: number; budget: number; spent: number;
  startDate: string; endDate: string; superintendent: string; sqft: number;
  beds?: number; baths?: number; description: string;
  milestones: { name: string; date: string; done: boolean }[];
  schedule: { phase: Phase; start: string; end: string; pct: number }[];
}
export interface SafetyIncident {
  id: string; date: string; projectId: string; severity: SafetySeverity;
  title: string; description: string; reportedBy: string; status: "open" | "investigating" | "closed";
}
export interface DocumentItem {
  id: string; title: string; type: DocType; projectId: string;
  status: "open" | "pending" | "approved" | "rejected"; updatedAt: string; author: string;
}
export interface ActivityItem {
  id: string; at: string; text: string; kind: "project" | "bid" | "safety" | "doc" | "crew";
}
export interface BudgetLine {
  id: string; projectId: string; category: string; budgeted: number; committed: number; actual: number;
}

export type DrawStatus = "upcoming" | "ready" | "submitted" | "paid" | "held";
export type ChangeOrderStatus = "draft" | "pending_owner" | "approved" | "rejected" | "invoiced";
export type SelectionStatus = "not_started" | "pending_owner" | "approved" | "ordered" | "installed";
export type DailyLogWeather = "clear" | "overcast" | "rain" | "snow" | "wind";

export interface ProgressDraw {
  id: string; projectId: string; name: string; pct: number; amount: number;
  status: DrawStatus; dueDate?: string; paidDate?: string; trigger: string;
}
export interface ChangeOrder {
  id: string; projectId: string; number: string; title: string; amount: number;
  daysImpact: number; status: ChangeOrderStatus; requestedBy: string;
  date: string; description: string;
}
export interface SelectionItem {
  id: string; projectId: string; room: string; category: string; allowance: number;
  actual?: number; status: SelectionStatus; choice?: string;
}
export interface DailyLog {
  id: string; projectId: string; date: string; weather: DailyLogWeather;
  crewCount: number; hours: number; workDone: string; blockers?: string;
  visitors?: string; author: string; photos?: string[];
}
