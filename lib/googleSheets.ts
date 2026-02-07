import { google } from "googleapis";
import { Job } from "./types";

// Google Sheets 客户端
export async function getGoogleSheetsClient() {
  // 支持两种方式：环境变量（Vercel）或本地文件
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    : null;

  if (!credentials) {
    // 本地开发时使用文件
    const path = await import("path");
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(
        process.cwd(),
        "credentials",
        "google-service-account.json",
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await auth.getClient();
    return google.sheets({ version: "v4", auth: client as any });
  }

  // Vercel 部署时使用环境变量
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client as any });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Job";

// 获取所有 jobs
export async function getAllJobs(): Promise<Job[]> {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:K`, // 从第二行开始读取（跳过标题行）
  });

  const rows = response.data.values || [];

  return rows.map((row) => ({
    job_id: String(row[0] || "").trim(),
    service_type: String(row[1] || "").trim(),
    customer_name: String(row[2] || "").trim(),
    address: String(row[3] || "").trim(),
    phone: String(row[4] || "").trim(),
    job_status: String(row[5] || "").trim(),
    scheduled_at: String(row[6] || "").trim(),
    price: String(row[7] || "").trim(),
    payment_status: String(row[8] || "").trim(),
    notes: String(row[9] || "").trim(),
    email: String(row[10] || "").trim(),
  }));
}

// 添加新 job
export async function addJob(job: Omit<Job, "job_id">): Promise<Job> {
  const sheets = await getGoogleSheetsClient();

  // 生成新的 job_id
  const allJobs = await getAllJobs();
  const newJobId =
    allJobs.length > 0
      ? String(Math.max(...allJobs.map((j) => parseInt(j.job_id) || 0)) + 1)
      : "1";

  const newJob: Job = {
    job_id: newJobId,
    ...job,
  };

  const values = [
    [
      newJob.job_id,
      newJob.service_type,
      newJob.customer_name,
      newJob.address,
      newJob.phone,
      newJob.job_status,
      newJob.scheduled_at,
      newJob.price,
      newJob.payment_status,
      newJob.notes,
      newJob.email,
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:K`,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });

  return newJob;
}

// 更新 job
export async function updateJob(
  jobId: string,
  updates: Partial<Job>,
): Promise<Job | null> {
  const sheets = await getGoogleSheetsClient();
  const normalizedJobId = String(jobId).trim();

  console.log("updateJob called with:", { jobId, updates });

  // 获取所有数据以找到对应的行
  const allJobs = await getAllJobs();
  const rowIndex = allJobs.findIndex((job) => job.job_id === normalizedJobId);

  if (rowIndex === -1) {
    console.log("Job not found for id:", normalizedJobId);
    return null;
  }

  // 实际行号是 rowIndex + 2（因为索引从0开始，且有标题行）
  const actualRow = rowIndex + 2;

  const currentJob = allJobs[rowIndex];
  const updatedJob: Job = {
    ...currentJob,
    ...updates,
    job_id: currentJob.job_id, // 保证 job_id 不被更改
  };

  console.log("Updating job to:", updatedJob);

  const values = [
    [
      updatedJob.job_id,
      updatedJob.service_type,
      updatedJob.customer_name,
      updatedJob.address,
      updatedJob.phone,
      updatedJob.job_status,
      updatedJob.scheduled_at,
      updatedJob.price,
      updatedJob.payment_status,
      updatedJob.notes,
      updatedJob.email,
    ],
  ];

  console.log("Writing to range:", `${SHEET_NAME}!A${actualRow}:K${actualRow}`);
  console.log("Values:", values);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${actualRow}:K${actualRow}`,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });

  return updatedJob;
}

// 删除 job
export async function deleteJob(jobId: string): Promise<boolean> {
  const normalizedJobId = String(jobId).trim();

  const sheets = await getGoogleSheetsClient();
  const allJobs = await getAllJobs();
  
  const rowIndex = allJobs.findIndex((job) => job.job_id === normalizedJobId);

  if (rowIndex === -1) {
    return false;
  }

  const actualRow = rowIndex + 2;

  const sheetMetadata = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  // 尝试找到匹配的 sheet，如果找不到则使用第一个
  let sheet = sheetMetadata.data.sheets?.find(
    (s) => s.properties?.title === SHEET_NAME,
  );
  
  if (!sheet) {
    sheet = sheetMetadata.data.sheets?.[0];
  }

  if (!sheet || sheet.properties?.sheetId === undefined) {
    return false;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: actualRow - 1,
              endIndex: actualRow,
            },
          },
        },
      ],
    },
  });

  return true;
}

// 根据 ID 获取单个 job
export async function getJobById(jobId: string): Promise<Job | null> {
  const normalizedJobId = String(jobId).trim();
  const allJobs = await getAllJobs();
  return allJobs.find((job) => job.job_id === normalizedJobId) || null;
}
