// 服务类型枚举
export enum ServiceType {
  Residential = "residential",
  ShortTermRental = "short_term_rental",
  Commercial = "commercial",
  DeepClean = "deep_clean",
  EndOfTenancy = "end_of_tenancy",
  PostConstruction = "post_construction",
  EventClean = "event_clean",
  Other = "other",
}

// 定义 Job 类型
export interface Job {
  job_id: string;
  service_type: string;
  customer_name: string;
  address: string;
  phone: string;
  job_status: string;
  scheduled_at: string;
  price: string;
  payment_status: string;
  notes: string;
  email: string;
}
