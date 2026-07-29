import type {
  ActivityItem, Bid, BudgetLine, ChangeOrder, Client, Crew, CrewMember, DailyLog, DocumentItem, Equipment, ProgressDraw, Project, SafetyIncident, SelectionItem,
} from "./types";

export const COMPANY = {
  name: "Split Rock Construction",
  shortName: "Split Rock",
  tagline: "Homes built on solid ground",
  location: "Boise, ID",
  phone: "(208) 555-0142",
  email: "hello@splitrock.build",
  website: "splitrock.build",
};

export const clients: Client[] = [
  { id: "c1", name: "James & Elena Hart", email: "elena.hart@email.com", phone: "(208) 555-2201", type: "homeowner", address: "1842 River Bend Dr, Boise, ID", notes: "Custom ranch, board-form concrete accent." },
  { id: "c2", name: "Marcus Cole", email: "marcus@colehomes.dev", phone: "(208) 555-3344", type: "developer", address: "90 Market St, Boise, ID", notes: "3-lot speculative series in Meridian." },
  { id: "c3", name: "Priya & Noah Bennett", email: "noah.b@email.com", phone: "(208) 555-1188", type: "homeowner", address: "22 Willow Creek Ln, Eagle, ID", notes: "Two-story modern farmhouse, ADU later." },
  { id: "c4", name: "Treasure Valley Holdings", email: "ops@tvholdings.com", phone: "(208) 555-9001", type: "commercial", address: "410 Commerce Park, Boise, ID", notes: "Future commercial pipeline — light industrial shell." },
  { id: "c5", name: "Diane Okonkwo", email: "diane.o@email.com", phone: "(208) 555-7720", type: "homeowner", address: "9 Crestview Ct, Meridian, ID", notes: "Accessible single-level with heated floors." },
];

export const members: CrewMember[] = [
  { id: "m1", name: "Tyler Brooks", role: "Superintendent", trade: "General", phone: "(208) 555-4011", status: "active", rate: 58, certifications: ["OSHA 30", "First Aid"], projectId: "p1" },
  { id: "m2", name: "Sam Ortega", role: "Lead Carpenter", trade: "Framing", phone: "(208) 555-4012", status: "active", rate: 42, certifications: ["OSHA 10"], projectId: "p1" },
  { id: "m3", name: "Riley Chen", role: "Foreman", trade: "Concrete", phone: "(208) 555-4013", status: "active", rate: 44, certifications: ["OSHA 30", "ACI Flatwork"], projectId: "p2" },
  { id: "m4", name: "Jordan Hale", role: "Electrician", trade: "Electrical", phone: "(208) 555-4014", status: "active", rate: 48, certifications: ["Journeyman Electrician"], projectId: "p1" },
  { id: "m5", name: "Casey Nguyen", role: "Plumber", trade: "Plumbing", phone: "(208) 555-4015", status: "pto", rate: 46, certifications: ["Journeyman Plumber"] },
  { id: "m6", name: "Morgan Ellis", role: "Project Manager", trade: "General", phone: "(208) 555-4016", status: "active", rate: 62, certifications: ["PMP", "OSHA 30"], projectId: "p3" },
  { id: "m7", name: "Alex Rivera", role: "Finish Carpenter", trade: "Finish", phone: "(208) 555-4017", status: "active", rate: 40, certifications: ["OSHA 10"], projectId: "p3" },
  { id: "m8", name: "Kim Park", role: "Safety Lead", trade: "Safety", phone: "(208) 555-4018", status: "active", rate: 45, certifications: ["OSHA 30", "CHST"] },
];

export const crews: Crew[] = [
  { id: "cr1", name: "Framing Alpha", leadId: "m2", trade: "Framing", memberIds: ["m2", "m7"], projectId: "p1" },
  { id: "cr2", name: "Foundation Crew", leadId: "m3", trade: "Concrete", memberIds: ["m3"], projectId: "p2" },
  { id: "cr3", name: "MEP Squad", leadId: "m4", trade: "MEP", memberIds: ["m4", "m5"], projectId: "p1" },
  { id: "cr4", name: "Finish Team", leadId: "m7", trade: "Finish", memberIds: ["m7"], projectId: "p3" },
];

export const equipment: Equipment[] = [
  { id: "e1", name: "CAT 305 Mini Excavator", category: "Earthmoving", status: "on_site", projectId: "p2", nextService: "2026-08-15", hours: 1240 },
  { id: "e2", name: "Skid Steer S70", category: "Earthmoving", status: "on_site", projectId: "p1", nextService: "2026-09-01", hours: 890 },
  { id: "e3", name: "Telehandler 42ft", category: "Material Handling", status: "available", nextService: "2026-08-28", hours: 2100 },
  { id: "e4", name: "Trailer Compressor", category: "Tools", status: "on_site", projectId: "p3", nextService: "2026-10-12", hours: 450 },
  { id: "e5", name: "Concrete Saw Walk-Behind", category: "Tools", status: "maintenance", nextService: "2026-07-30", hours: 320 },
  { id: "e6", name: "F150 SuperCrew #12", category: "Fleet", status: "available", nextService: "2026-09-20", hours: 0 },
];

export const projects: Project[] = [
  {
    id: "p1", name: "Hart Residence", address: "1842 River Bend Dr, Boise", clientId: "c1", type: "residential",
    status: "in_progress", phase: "MEP Rough-In", progress: 62, budget: 685000, spent: 412400,
    startDate: "2025-11-03", endDate: "2026-09-18", superintendent: "Tyler Brooks", sqft: 2840, beds: 4, baths: 3,
    description: "Custom ranch with board-form concrete entry, open kitchen, and covered patio.",
    milestones: [
      { name: "Permit issued", date: "2025-10-20", done: true },
      { name: "Foundation complete", date: "2025-12-12", done: true },
      { name: "Dry-in", date: "2026-03-28", done: true },
      { name: "Rough inspections", date: "2026-07-15", done: false },
      { name: "Final CO", date: "2026-09-18", done: false },
    ],
    schedule: [
      { phase: "Site Work", start: "2025-11-03", end: "2025-11-22", pct: 100 },
      { phase: "Foundation", start: "2025-11-24", end: "2025-12-20", pct: 100 },
      { phase: "Framing", start: "2026-01-06", end: "2026-03-01", pct: 100 },
      { phase: "MEP Rough-In", start: "2026-03-03", end: "2026-07-20", pct: 75 },
      { phase: "Insulation", start: "2026-07-21", end: "2026-08-02", pct: 0 },
      { phase: "Drywall", start: "2026-08-03", end: "2026-08-22", pct: 0 },
      { phase: "Interior Finishes", start: "2026-08-24", end: "2026-09-12", pct: 0 },
      { phase: "Final Walkthrough", start: "2026-09-15", end: "2026-09-18", pct: 0 },
    ],
  },
  {
    id: "p2", name: "Willow Creek Farmhouse", address: "22 Willow Creek Ln, Eagle", clientId: "c3", type: "residential",
    status: "in_progress", phase: "Foundation", progress: 28, budget: 742000, spent: 198500,
    startDate: "2026-04-14", endDate: "2027-01-30", superintendent: "Riley Chen", sqft: 3120, beds: 5, baths: 3.5,
    description: "Two-story modern farmhouse with wrap porch and prep for future ADU over garage.",
    milestones: [
      { name: "Permit issued", date: "2026-04-01", done: true },
      { name: "Foundation complete", date: "2026-07-30", done: false },
      { name: "Dry-in", date: "2026-10-15", done: false },
      { name: "Final CO", date: "2027-01-30", done: false },
    ],
    schedule: [
      { phase: "Site Work", start: "2026-04-14", end: "2026-05-02", pct: 100 },
      { phase: "Foundation", start: "2026-05-05", end: "2026-07-30", pct: 55 },
      { phase: "Framing", start: "2026-08-03", end: "2026-10-10", pct: 0 },
      { phase: "MEP Rough-In", start: "2026-10-12", end: "2026-11-20", pct: 0 },
      { phase: "Exterior", start: "2026-11-02", end: "2026-12-05", pct: 0 },
      { phase: "Interior Finishes", start: "2026-12-08", end: "2027-01-20", pct: 0 },
      { phase: "Final Walkthrough", start: "2027-01-25", end: "2027-01-30", pct: 0 },
    ],
  },
  {
    id: "p3", name: "Crestview Accessible Home", address: "9 Crestview Ct, Meridian", clientId: "c5", type: "residential",
    status: "punch_list", phase: "Final Walkthrough", progress: 94, budget: 518000, spent: 501200,
    startDate: "2025-06-02", endDate: "2026-08-08", superintendent: "Morgan Ellis", sqft: 1960, beds: 3, baths: 2,
    description: "Single-level accessible home with zero-threshold showers and radiant floors.",
    milestones: [
      { name: "Permit issued", date: "2025-05-18", done: true },
      { name: "Dry-in", date: "2025-10-02", done: true },
      { name: "Rough inspections", date: "2026-01-14", done: true },
      { name: "Punch list", date: "2026-07-20", done: false },
      { name: "Final CO", date: "2026-08-08", done: false },
    ],
    schedule: [
      { phase: "Site Work", start: "2025-06-02", end: "2025-06-20", pct: 100 },
      { phase: "Foundation", start: "2025-06-22", end: "2025-07-18", pct: 100 },
      { phase: "Framing", start: "2025-07-21", end: "2025-09-15", pct: 100 },
      { phase: "MEP Rough-In", start: "2025-09-16", end: "2025-11-10", pct: 100 },
      { phase: "Interior Finishes", start: "2026-02-01", end: "2026-07-10", pct: 100 },
      { phase: "Landscaping", start: "2026-07-12", end: "2026-07-28", pct: 90 },
      { phase: "Final Walkthrough", start: "2026-08-01", end: "2026-08-08", pct: 40 },
    ],
  },
  {
    id: "p4", name: "Cole Spec — Lot 7", address: "Meridian Ridge Plat, Lot 7", clientId: "c2", type: "residential",
    status: "planning", phase: "Site Work", progress: 8, budget: 425000, spent: 18200,
    startDate: "2026-09-01", endDate: "2027-04-15", superintendent: "Tyler Brooks", sqft: 2100, beds: 3, baths: 2.5,
    description: "Spec home in Cole series — efficient plan set, standard finishes package.",
    milestones: [
      { name: "Plan set locked", date: "2026-08-01", done: false },
      { name: "Permit submitted", date: "2026-08-15", done: false },
      { name: "Ground break", date: "2026-09-01", done: false },
    ],
    schedule: [
      { phase: "Site Work", start: "2026-09-01", end: "2026-09-18", pct: 0 },
      { phase: "Foundation", start: "2026-09-20", end: "2026-10-15", pct: 0 },
      { phase: "Framing", start: "2026-10-18", end: "2026-12-05", pct: 0 },
      { phase: "Interior Finishes", start: "2027-02-01", end: "2027-04-01", pct: 0 },
      { phase: "Final Walkthrough", start: "2027-04-08", end: "2027-04-15", pct: 0 },
    ],
  },
  {
    id: "p5", name: "Commerce Park Shell (Pipeline)", address: "410 Commerce Park, Boise", clientId: "c4", type: "commercial",
    status: "permitting", phase: "Site Work", progress: 5, budget: 2100000, spent: 42000,
    startDate: "2027-03-01", endDate: "2027-12-15", superintendent: "Morgan Ellis", sqft: 18000,
    description: "Future light industrial shell — Split Rock's first commercial step.",
    milestones: [
      { name: "LOI signed", date: "2026-06-01", done: true },
      { name: "Entitlements", date: "2026-11-01", done: false },
      { name: "Permit", date: "2027-02-01", done: false },
    ],
    schedule: [
      { phase: "Site Work", start: "2027-03-01", end: "2027-04-15", pct: 0 },
      { phase: "Foundation", start: "2027-04-16", end: "2027-06-01", pct: 0 },
      { phase: "Framing", start: "2027-06-02", end: "2027-09-01", pct: 0 },
      { phase: "Exterior", start: "2027-08-15", end: "2027-10-30", pct: 0 },
      { phase: "Final Walkthrough", start: "2027-12-01", end: "2027-12-15", pct: 0 },
    ],
  },
];

export const bids: Bid[] = [
  { id: "b1", title: "Hart Residence — Base Bid", clientId: "c1", type: "residential", status: "won", amount: 685000, submittedAt: "2025-09-12", dueDate: "2025-09-20", notes: "Won on schedule confidence.", lineItems: [
    { label: "Site & foundation", amount: 98000 }, { label: "Structure & envelope", amount: 210000 }, { label: "MEP", amount: 125000 }, { label: "Finishes", amount: 185000 }, { label: "Allowance & contingency", amount: 67000 },
  ]},
  { id: "b2", title: "Willow Creek Farmhouse", clientId: "c3", type: "residential", status: "won", amount: 742000, submittedAt: "2026-02-28", dueDate: "2026-03-10", notes: "Includes ADU rough-in allowance.", lineItems: [
    { label: "Site & foundation", amount: 112000 }, { label: "Structure & envelope", amount: 245000 }, { label: "MEP", amount: 138000 }, { label: "Finishes", amount: 198000 }, { label: "Contingency", amount: 49000 },
  ]},
  { id: "b3", title: "Cole Spec Series — 3 Lots", clientId: "c2", type: "residential", status: "submitted", amount: 1245000, submittedAt: "2026-07-10", dueDate: "2026-08-01", notes: "Volume pricing if all three awarded.", lineItems: [
    { label: "Lot 7 build", amount: 425000 }, { label: "Lot 8 build", amount: 410000 }, { label: "Lot 9 build", amount: 410000 },
  ]},
  { id: "b4", title: "Commerce Park Shell — Design Assist", clientId: "c4", type: "commercial", status: "draft", amount: 2100000, dueDate: "2026-09-15", notes: "First commercial bid package.", lineItems: [
    { label: "Site development", amount: 320000 }, { label: "Structure", amount: 980000 }, { label: "Envelope", amount: 420000 }, { label: "MEP core", amount: 280000 }, { label: "GC fee & contingency", amount: 100000 },
  ]},
  { id: "b5", title: "Riverside Addition (lost)", clientId: "c1", type: "residential", status: "lost", amount: 186000, submittedAt: "2025-04-02", dueDate: "2025-04-15", notes: "Client delayed.", lineItems: [
    { label: "Addition structure", amount: 110000 }, { label: "MEP & finishes", amount: 76000 },
  ]},
];

export const safetyIncidents: SafetyIncident[] = [
  { id: "s1", date: "2026-07-12", projectId: "p1", severity: "near_miss", title: "Unsecured ladder near framing deck", description: "Ladder shifted on uneven grade; no injury.", reportedBy: "Kim Park", status: "closed" },
  { id: "s2", date: "2026-07-22", projectId: "p2", severity: "minor", title: "Cut on rebar — first aid", description: "Worker cut glove on rebar ends. Rebar caps ordered.", reportedBy: "Riley Chen", status: "investigating" },
  { id: "s3", date: "2026-06-03", projectId: "p3", severity: "near_miss", title: "Delivery truck reverse without spotter", description: "Spotter protocol re-briefed.", reportedBy: "Kim Park", status: "closed" },
];

export const documents: DocumentItem[] = [
  { id: "d1", title: "RFI-014 Structural hold-down schedule", type: "rfi", projectId: "p1", status: "open", updatedAt: "2026-07-25", author: "Sam Ortega" },
  { id: "d2", title: "Submittal — Exterior windows package", type: "submittal", projectId: "p1", status: "pending", updatedAt: "2026-07-20", author: "Morgan Ellis" },
  { id: "d3", title: "A-series drawings Rev C", type: "drawing", projectId: "p2", status: "approved", updatedAt: "2026-06-18", author: "Morgan Ellis" },
  { id: "d4", title: "Building permit BP-2026-8841", type: "permit", projectId: "p2", status: "approved", updatedAt: "2026-04-01", author: "Tyler Brooks" },
  { id: "d5", title: "CO-003 Kitchen island relocate", type: "change_order", projectId: "p1", status: "pending", updatedAt: "2026-07-18", author: "Tyler Brooks" },
  { id: "d6", title: "Owner contract — Crestview", type: "contract", projectId: "p3", status: "approved", updatedAt: "2025-05-22", author: "Morgan Ellis" },
  { id: "d7", title: "RFI-003 Soil report clarification", type: "rfi", projectId: "p2", status: "approved", updatedAt: "2026-05-10", author: "Riley Chen" },
];

export const budgetLines: BudgetLine[] = [
  { id: "bl1", projectId: "p1", category: "Labor", budgeted: 210000, committed: 198000, actual: 172400 },
  { id: "bl2", projectId: "p1", category: "Materials", budgeted: 245000, committed: 230000, actual: 151200 },
  { id: "bl3", projectId: "p1", category: "Subcontractors", budgeted: 160000, committed: 155000, actual: 72000 },
  { id: "bl4", projectId: "p1", category: "Equipment", budgeted: 35000, committed: 28000, actual: 9800 },
  { id: "bl5", projectId: "p1", category: "Contingency", budgeted: 35000, committed: 8000, actual: 7000 },
  { id: "bl6", projectId: "p2", category: "Labor", budgeted: 230000, committed: 95000, actual: 62000 },
  { id: "bl7", projectId: "p2", category: "Materials", budgeted: 280000, committed: 140000, actual: 88000 },
  { id: "bl8", projectId: "p2", category: "Subcontractors", budgeted: 170000, committed: 80000, actual: 38500 },
  { id: "bl9", projectId: "p2", category: "Equipment", budgeted: 32000, committed: 18000, actual: 10000 },
  { id: "bl10", projectId: "p3", category: "Labor", budgeted: 165000, committed: 165000, actual: 162000 },
  { id: "bl11", projectId: "p3", category: "Materials", budgeted: 190000, committed: 188000, actual: 186500 },
  { id: "bl12", projectId: "p3", category: "Subcontractors", budgeted: 120000, committed: 120000, actual: 118200 },
  { id: "bl13", projectId: "p3", category: "Equipment", budgeted: 18000, committed: 16000, actual: 15500 },
  { id: "bl14", projectId: "p3", category: "Contingency", budgeted: 25000, committed: 20000, actual: 19000 },
];

export const activity: ActivityItem[] = [
  { id: "a1", at: "2026-07-28T09:15:00", text: "Rough electrical inspection scheduled for Hart Residence", kind: "project" },
  { id: "a2", at: "2026-07-27T16:40:00", text: "Bid package submitted: Cole Spec Series — 3 Lots", kind: "bid" },
  { id: "a3", at: "2026-07-27T11:05:00", text: "Safety: minor rebar cut logged at Willow Creek", kind: "safety" },
  { id: "a4", at: "2026-07-26T14:22:00", text: "RFI-014 opened — hold-down schedule clarification", kind: "doc" },
  { id: "a5", at: "2026-07-26T08:00:00", text: "Framing Alpha assigned to Hart Residence week of Aug 4", kind: "crew" },
  { id: "a6", at: "2026-07-25T15:30:00", text: "Crestview punch list items reduced to 6 remaining", kind: "project" },
];


export const progressDraws: ProgressDraw[] = [
  { id: "pd1", projectId: "p1", name: "Contract deposit", pct: 0.1, amount: 68500, status: "paid", paidDate: "2025-10-25", trigger: "Signed contract" },
  { id: "pd2", projectId: "p1", name: "Foundation complete", pct: 0.15, amount: 102750, status: "paid", paidDate: "2025-12-14", trigger: "Foundation inspected" },
  { id: "pd3", projectId: "p1", name: "Dried-in / shell", pct: 0.2, amount: 137000, status: "paid", paidDate: "2026-03-30", trigger: "Weather-tight" },
  { id: "pd4", projectId: "p1", name: "Rough-in complete", pct: 0.2, amount: 137000, status: "ready", dueDate: "2026-07-30", trigger: "MEP rough + inspections" },
  { id: "pd5", projectId: "p1", name: "Finishes progress", pct: 0.2, amount: 137000, status: "upcoming", trigger: "Cabinets & flooring in" },
  { id: "pd6", projectId: "p1", name: "Substantial completion", pct: 0.1, amount: 68500, status: "upcoming", trigger: "CO / punch started" },
  { id: "pd7", projectId: "p1", name: "Final retainage", pct: 0.05, amount: 34250, status: "upcoming", trigger: "Punch + lien waivers" },
  { id: "pd8", projectId: "p2", name: "Contract deposit", pct: 0.1, amount: 74200, status: "paid", paidDate: "2026-04-10", trigger: "Signed contract" },
  { id: "pd9", projectId: "p2", name: "Foundation complete", pct: 0.15, amount: 111300, status: "ready", dueDate: "2026-08-05", trigger: "Foundation inspected" },
  { id: "pd10", projectId: "p3", name: "Final retainage", pct: 0.05, amount: 25900, status: "held", trigger: "Punch list sign-off" },
];

export const changeOrders: ChangeOrder[] = [
  { id: "co1", projectId: "p1", number: "CO-003", title: "Kitchen island relocate + quartz upgrade", amount: 12800, daysImpact: 5, status: "pending_owner", requestedBy: "Elena Hart", date: "2026-07-18", description: "Move island 18in and upgrade countertop package." },
  { id: "co2", projectId: "p1", number: "CO-002", title: "Add exterior gas stub for grill", amount: 2400, daysImpact: 1, status: "approved", requestedBy: "James Hart", date: "2026-05-02", description: "Gas line rough to patio." },
  { id: "co3", projectId: "p2", number: "CO-001", title: "Upgrade windows to triple-pane", amount: 18600, daysImpact: 0, status: "approved", requestedBy: "Noah Bennett", date: "2026-05-20", description: "Full package upgrade before order." },
  { id: "co4", projectId: "p3", number: "CO-004", title: "Extra landscape lighting", amount: 3100, daysImpact: 2, status: "invoiced", requestedBy: "Diane Okonkwo", date: "2026-07-01", description: "Path lights along front walk." },
];

export const selections: SelectionItem[] = [
  { id: "sel1", projectId: "p1", room: "Kitchen", category: "Countertops", allowance: 12000, actual: 14800, status: "pending_owner", choice: "Calacatta quartz upgrade" },
  { id: "sel2", projectId: "p1", room: "Kitchen", category: "Cabinets", allowance: 28000, actual: 26500, status: "ordered", choice: "Shaker white / walnut island" },
  { id: "sel3", projectId: "p1", room: "Bath primary", category: "Tile", allowance: 4500, status: "not_started" },
  { id: "sel4", projectId: "p1", room: "Flooring", category: "Hardwood", allowance: 16000, actual: 15200, status: "approved", choice: "White oak 5in" },
  { id: "sel5", projectId: "p2", room: "Kitchen", category: "Appliances", allowance: 14000, status: "pending_owner" },
  { id: "sel6", projectId: "p2", room: "Exterior", category: "Siding", allowance: 22000, actual: 21800, status: "approved", choice: "Board & batten + lap" },
];

export const dailyLogs: DailyLog[] = [
  { id: "dl1", projectId: "p1", date: "2026-07-28", weather: "clear", crewCount: 6, hours: 48, workDone: "Finished second-floor electrical rough. Plumber set tub valves.", blockers: "Waiting on RFI-014 hold-downs before sheathing punch.", author: "Tyler Brooks" },
  { id: "dl2", projectId: "p1", date: "2026-07-27", weather: "overcast", crewCount: 5, hours: 40, workDone: "HVAC trunk runs main floor. Window flashing check complete.", author: "Tyler Brooks" },
  { id: "dl3", projectId: "p2", date: "2026-07-28", weather: "clear", crewCount: 4, hours: 32, workDone: "Footings poured east wing. Rebar inspection passed AM.", author: "Riley Chen" },
  { id: "dl4", projectId: "p3", date: "2026-07-25", weather: "clear", crewCount: 2, hours: 12, workDone: "Punch list paint touch-ups rooms 2–4. Landscape lights staged.", author: "Morgan Ellis" },
];
