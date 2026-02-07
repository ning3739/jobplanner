"use client";

import { useState, useEffect } from "react";
import { ServiceType, Job } from "@/lib/types";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Lock,
  LogOut,
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
  Edit2,
  Trash2,
  User,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  Circle,
  XCircle,
  AlertCircle,
  FileText,
  Home,
  Building2,
  Sparkles,
  Package,
  Hammer,
  PartyPopper,
  MoreHorizontal,
  X,
  StickyNote,
  Mail,
  ArrowLeft,
} from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const CORRECT_PASSWORD = "Fivestars2026@";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const serviceTypeIcons: Record<string, React.ReactNode> = {
  residential: <Home className="w-4 h-4" />,
  short_term_rental: <Building2 className="w-4 h-4" />,
  commercial: <Building2 className="w-4 h-4" />,
  deep_clean: <Sparkles className="w-4 h-4" />,
  end_of_tenancy: <Package className="w-4 h-4" />,
  post_construction: <Hammer className="w-4 h-4" />,
  event_clean: <PartyPopper className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

const serviceTypeNames: Record<string, string> = {
  residential: "Residential",
  short_term_rental: "Short-Term Rental",
  commercial: "Commercial",
  deep_clean: "Deep Clean",
  end_of_tenancy: "End of Tenancy",
  post_construction: "Post Construction",
  event_clean: "Event Clean",
  other: "Other",
};

const jobStatusNames: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const paymentStatusNames: Record<string, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
};

export default function JobsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; jobId: string | null }>({ isOpen: false, jobId: null });
  const [formData, setFormData] = useState({
    service_type: "",
    customer_name: "",
    address: "",
    phone: "",
    job_status: "pending",
    scheduled_at: "",
    price: "",
    payment_status: "unpaid",
    notes: "",
    email: "",
  });

  useEffect(() => {
    const auth = sessionStorage.getItem("authenticated");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("authenticated", "true");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
      setPassword("");
    }
  };

  const fetchJobs = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await fetch("/api/jobs");
      const result = await response.json();
      if (result.success) setJobs(result.data);
      else setError(result.error);
    } catch {
      setError("Failed to load jobs");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(true); }, []);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) { 
        await fetchJobs();
        resetForm(); 
      }
      else setError(result.error);
    } catch {
      setError("Failed to add job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/jobs/${editingJob.job_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) { 
        await fetchJobs();
        resetForm(); 
      }
      else setError(result.error);
    } catch {
      setError("Failed to update job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirm = (jobId: string) => {
    setDeleteConfirm({ isOpen: true, jobId });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, jobId: null });
  };

  const handleDeleteJob = async () => {
    if (!deleteConfirm.jobId) return;
    const jobId = deleteConfirm.jobId;
    closeDeleteConfirm();
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        await fetchJobs();
        if (selectedJob?.job_id === jobId) setSelectedJob(null);
      }
      else setError(result.error);
    } catch {
      setError("Failed to delete job");
    }
  };

  const startEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      service_type: job.service_type,
      customer_name: job.customer_name,
      address: job.address,
      phone: job.phone,
      job_status: job.job_status,
      scheduled_at: job.scheduled_at,
      price: job.price,
      payment_status: job.payment_status,
      notes: job.notes || "",
      email: job.email || "",
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({ service_type: "", customer_name: "", address: "", phone: "", job_status: "pending", scheduled_at: "", price: "", payment_status: "unpaid", notes: "", email: "" });
    setEditingJob(null);
    setIsFormOpen(false);
  };

  const parseScheduledDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    try {
      if (dateStr.includes("T")) return parseISO(dateStr);
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch { return new Date(); }
  };

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return "Not set";
    try {
      const date = parseScheduledDate(dateStr);
      return format(date, "MMM d, yyyy h:mm a", { locale: enUS });
    } catch { return dateStr; }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
        <div className="hidden md:flex md:w-1/2 bg-slate-900 relative items-center justify-center p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
          <div className="relative z-10 text-center max-w-lg">
            <div className="w-24 h-24 bg-white rounded-sm flex items-center justify-center mx-auto mb-8 shadow-lg">
              <CalendarIcon className="w-12 h-12 text-slate-900" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Job Planner</h2>
            <p className="text-slate-300 text-lg">Streamline your cleaning business with efficient job scheduling and management.</p>
            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-white">Easy</div>
                <div className="text-slate-400 text-sm mt-1">Scheduling</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">Fast</div>
                <div className="text-slate-400 text-sm mt-1">Management</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">Smart</div>
                <div className="text-slate-400 text-sm mt-1">Tracking</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="md:hidden text-center mb-8">
              <div className="w-16 h-16 bg-slate-900 rounded-sm flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">Job Planner</h1>
            </div>
            
            <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-200">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h2>
                <p className="text-slate-500 text-sm">Enter your password to continue</p>
              </div>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900"
                      placeholder="Enter password"
                      autoFocus
                    />
                  </div>
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> {passwordError}
                    </p>
                  )}
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-3 px-4 rounded-sm hover:bg-slate-800 transition font-medium flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> Sign In
                </button>
              </form>
            </div>
            
            <p className="text-center text-slate-400 text-xs mt-6">Secure access to your job management system</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-slate-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-slate-900">Job Planner</h1>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-sm p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition flex items-center gap-1.5 ${viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition flex items-center gap-1.5 ${viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </button>
              </div>
              <button onClick={() => setIsFormOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-sm hover:bg-slate-800 transition text-sm font-medium flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Job</span>
              </button>
              <button onClick={() => { sessionStorage.removeItem("authenticated"); setIsAuthenticated(false); }} className="text-slate-500 hover:text-slate-700 p-2 rounded-sm hover:bg-slate-100 transition" title="Sign Out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className={`${selectedJob ? "flex-1" : "w-full"} transition-all duration-300`}>
            {isFormOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                  <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {editingJob ? <><Edit2 className="w-5 h-5" /> Edit Job</> : <><Plus className="w-5 h-5" /> New Job</>}
                    </h2>
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={editingJob ? handleUpdateJob : handleAddJob} className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Type <span className="text-red-500">*</span></label>
                        <select value={formData.service_type} onChange={(e) => setFormData({ ...formData, service_type: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm" required>
                          <option value="">Select service type</option>
                          <option value={ServiceType.Residential}>Residential</option>
                          <option value={ServiceType.ShortTermRental}>Short-Term Rental</option>
                          <option value={ServiceType.Commercial}>Commercial</option>
                          <option value={ServiceType.DeepClean}>Deep Clean</option>
                          <option value={ServiceType.EndOfTenancy}>End of Tenancy</option>
                          <option value={ServiceType.PostConstruction}>Post Construction</option>
                          <option value={ServiceType.EventClean}>Event Clean</option>
                          <option value={ServiceType.Other}>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm" placeholder="Enter customer name" required />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Address <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm" placeholder="Enter address" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone <span className="text-red-500">*</span></label>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm" placeholder="Enter phone number" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm" placeholder="Enter email address" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Status</label>
                        <select value={formData.job_status} onChange={(e) => setFormData({ ...formData, job_status: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm">
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Scheduled At</label>
                        <input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Price</label>
                        <input type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm" placeholder="Enter price" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Status</label>
                        <select value={formData.payment_status} onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm">
                          <option value="unpaid">Unpaid</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm resize-none" placeholder="Enter notes" rows={3} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                      <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-300 rounded-sm hover:bg-slate-50 transition text-sm font-medium text-slate-700">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white rounded-sm hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50">{isSubmitting ? "Saving..." : editingJob ? "Save Changes" : "Create Job"}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {viewMode === "calendar" && (
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
                <Calendar
                  localizer={localizer}
                  events={jobs.filter(job => job.scheduled_at).map((job) => {
                    const startDate = parseScheduledDate(job.scheduled_at);
                    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                    return { title: `${job.customer_name} - ${serviceTypeNames[job.service_type] || job.service_type}`, start: startDate, end: endDate, resource: job };
                  })}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "600px" }}
                  className="text-sm"
                  onSelectEvent={(event: any) => setSelectedJob(event.resource as Job)}
                  views={["month", "week", "day"]}
                  view={calendarView}
                  date={calendarDate}
                  onNavigate={(newDate) => setCalendarDate(newDate)}
                  onView={(newView) => setCalendarView(newView as "month" | "week" | "day")}
                  eventPropGetter={(event: any) => {
                    const job = event.resource as Job;
                    let backgroundColor = "#475569";
                    if (job.job_status === "completed") backgroundColor = "#059669";
                    else if (job.job_status === "in_progress") backgroundColor = "#d97706";
                    else if (job.job_status === "cancelled") backgroundColor = "#dc2626";
                    return { style: { backgroundColor, borderRadius: "2px", border: "none", color: "white", fontSize: "12px", fontWeight: "500", padding: "2px 6px" } };
                  }}
                />
              </div>
            )}

            {viewMode === "table" && (
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Service</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Scheduled</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Notes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {jobs.length === 0 ? (
                        <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-500"><FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p>No jobs found</p></td></tr>
                      ) : (
                        jobs.map((job, index) => (
                          <tr key={`${job.job_id}-${index}`} onClick={() => setSelectedJob(job)} className={`hover:bg-slate-50 cursor-pointer transition ${selectedJob?.job_id === job.job_id ? "bg-slate-50 border-l-2 border-l-slate-900" : ""}`}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">#{job.job_id}</td>
                            <td className="px-4 py-3 text-sm text-slate-700"><span className="inline-flex items-center gap-1.5">{serviceTypeIcons[job.service_type]}{serviceTypeNames[job.service_type] || job.service_type}</span></td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{job.customer_name}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{job.phone}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{job.email || "-"}</td>
                            <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm ${job.job_status === "completed" ? "bg-emerald-50 text-emerald-700" : job.job_status === "in_progress" ? "bg-amber-50 text-amber-700" : job.job_status === "pending" ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-700"}`}>{jobStatusNames[job.job_status] || job.job_status}</span></td>
                            <td className="px-4 py-3 text-sm text-slate-600">{job.scheduled_at || "-"}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{job.price || "-"}</td>
                            <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm ${job.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : job.payment_status === "partial" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{paymentStatusNames[job.payment_status] || job.payment_status}</span></td>
                            <td className="px-4 py-3 text-sm text-slate-500 max-w-[150px] truncate">{job.notes || "-"}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); startEdit(job); }} className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-100" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); openDeleteConfirm(job.job_id); }} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden divide-y divide-slate-100">
                  {jobs.length === 0 ? (
                    <div className="px-4 py-12 text-center text-slate-500"><FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p>No jobs found</p></div>
                  ) : (
                    jobs.map((job, index) => (
                      <div key={`${job.job_id}-${index}`} onClick={() => setSelectedJob(job)} className={`p-4 cursor-pointer transition ${selectedJob?.job_id === job.job_id ? "bg-slate-50 border-l-2 border-l-slate-900" : "hover:bg-slate-50"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div><span className="text-xs text-slate-500">#{job.job_id}</span><h3 className="font-medium text-slate-900">{job.customer_name}</h3></div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); startEdit(job); }} className="text-slate-400 hover:text-slate-600 p-1.5"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); openDeleteConfirm(job.job_id); }} className="text-red-400 hover:text-red-600 p-1.5"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 text-slate-600">{serviceTypeIcons[job.service_type]}{serviceTypeNames[job.service_type] || job.service_type}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm ${job.job_status === "completed" ? "bg-emerald-50 text-emerald-700" : job.job_status === "in_progress" ? "bg-amber-50 text-amber-700" : job.job_status === "pending" ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-700"}`}>{jobStatusNames[job.job_status] || job.job_status}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm ${job.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : job.payment_status === "partial" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{paymentStatusNames[job.payment_status] || job.payment_status}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{job.phone}</span>
                          {job.price && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.price}</span>}
                        </div>
                        {job.notes && <p className="mt-2 text-sm text-slate-500 truncate"><StickyNote className="w-3.5 h-3.5 inline mr-1" />{job.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedJob && (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16 gap-4">
                <button onClick={() => setSelectedJob(null)} className="text-slate-500 hover:text-slate-700 p-2 rounded-sm hover:bg-slate-100 transition flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Back to Jobs</span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-slate-500">Job #{selectedJob.job_id}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm ${selectedJob.job_status === "completed" ? "bg-emerald-50 text-emerald-700" : selectedJob.job_status === "in_progress" ? "bg-amber-50 text-amber-700" : selectedJob.job_status === "pending" ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-700"}`}>
                    {selectedJob.job_status === "completed" && <CheckCircle className="w-3.5 h-3.5" />}
                    {selectedJob.job_status === "in_progress" && <Circle className="w-3.5 h-3.5" />}
                    {selectedJob.job_status === "pending" && <AlertCircle className="w-3.5 h-3.5" />}
                    {selectedJob.job_status === "cancelled" && <XCircle className="w-3.5 h-3.5" />}
                    {jobStatusNames[selectedJob.job_status] || selectedJob.job_status}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedJob.customer_name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { startEdit(selectedJob); setSelectedJob(null); }} className="bg-slate-900 text-white px-4 py-2.5 rounded-sm hover:bg-slate-800 transition text-sm font-medium flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />Edit Job
                </button>
                <button onClick={() => openDeleteConfirm(selectedJob.job_id)} className="border border-red-200 text-red-600 px-4 py-2.5 rounded-sm hover:bg-red-50 transition text-sm font-medium flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Customer Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs text-slate-500">Name</label>
                      <p className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />{selectedJob.customer_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Phone</label>
                      <p className="text-sm text-slate-900 mt-1 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />{selectedJob.phone}</p>
                    </div>
                    {selectedJob.email && (
                      <div>
                        <label className="text-xs text-slate-500">Email</label>
                        <p className="text-sm text-slate-900 mt-1 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />{selectedJob.email}</p>
                      </div>
                    )}
                    <div className={selectedJob.email ? "" : "sm:col-span-2"}>
                      <label className="text-xs text-slate-500">Address</label>
                      <p className="text-sm text-slate-900 mt-1 flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />{selectedJob.address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Job Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs text-slate-500">Service Type</label>
                      <p className="text-sm text-slate-900 mt-1 flex items-center gap-2">{serviceTypeIcons[selectedJob.service_type]}{serviceTypeNames[selectedJob.service_type] || selectedJob.service_type}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Scheduled At</label>
                      <p className="text-sm text-slate-900 mt-1 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" />{formatDateTime(selectedJob.scheduled_at)}</p>
                    </div>
                  </div>
                </div>

                {selectedJob.notes && (
                  <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2"><StickyNote className="w-4 h-4" />Notes</h2>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedJob.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Payment</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500">Amount</label>
                      <p className="text-3xl font-bold text-slate-900 mt-1">${selectedJob.price || "0"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Status</label>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm ${selectedJob.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : selectedJob.payment_status === "partial" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          {selectedJob.payment_status === "paid" && <CheckCircle className="w-4 h-4" />}
                          {selectedJob.payment_status === "partial" && <AlertCircle className="w-4 h-4" />}
                          {selectedJob.payment_status === "unpaid" && <XCircle className="w-4 h-4" />}
                          {paymentStatusNames[selectedJob.payment_status] || selectedJob.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-sm w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Delete Job</h3>
              <p className="text-sm text-slate-500 text-center">Are you sure you want to delete this job? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeDeleteConfirm} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-sm hover:bg-slate-50 transition text-sm font-medium text-slate-700">Cancel</button>
              <button onClick={() => { handleDeleteJob(); setSelectedJob(null); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-sm hover:bg-red-700 transition text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}