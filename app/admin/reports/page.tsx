"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Download,
  FileText,
  ListOrdered,
  SkipForward,
  Star,
  Timer,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketStatus } from "@/app/generated/prisma/enums";
import {
  type DateRangePreset,
  formatDateParam,
  formatDateTime,
  formatQueueDate,
  getPresetDateRange,
} from "@/lib/date";
import { getStatusLabel } from "@/lib/ticket-status";
import { cn } from "@/lib/utils";

type Tab = "performance" | "tickets" | "ratings";

interface BreakdownRow {
  id: string;
  name: string;
  total: number;
  completed: number;
  skipped: number;
  skipRate: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
}

interface PerformanceReport {
  summary: BreakdownRow;
  byService: BreakdownRow[];
  byCounter: BreakdownRow[];
}

interface TicketRow {
  id: string;
  displayNo: string;
  studentId: string;
  studentName: string;
  serviceName: string;
  counterName: string | null;
  status: TicketStatus;
  queueDate: string;
  createdAt: string;
  calledAt: string | null;
  completedAt: string | null;
  waitMinutes: number | null;
  serviceMinutes: number | null;
}

interface Service {
  id: string;
  name: string;
}

interface Counter {
  id: string;
  name: string;
  service: { id: string; name: string };
}

interface RatingSummary {
  completed: number;
  rated: number;
  responseRate: number;
  avgRating: number;
}

interface RatingBreakdownRow {
  id: string;
  name: string;
  completed: number;
  rated: number;
  responseRate: number;
  avgRating: number;
}

interface RatingRow {
  id: string;
  displayNo: string;
  studentId: string;
  studentName: string;
  serviceName: string;
  counterName: string | null;
  rating: number | null;
  ratedAt: string | null;
  completedAt: string | null;
  queueDate: string;
}

type RatingSortField = "completedAt" | "ratedAt" | "displayNo" | "rating" | "studentId";

type SortField =
  | "createdAt"
  | "calledAt"
  | "completedAt"
  | "displayNo"
  | "studentId"
  | "status";

const PRESETS: Array<{ id: DateRangePreset; label: string }> = [
  { id: "today", label: "วันนี้" },
  { id: "yesterday", label: "เมื่อวาน" },
  { id: "7d", label: "7 วัน" },
  { id: "30d", label: "30 วัน" },
  { id: "month", label: "เดือนนี้" },
];

const STATUS_OPTIONS = Object.values(TicketStatus);

function SortIcon<T extends string>({
  field,
  sortBy,
  sortDir,
}: {
  field: T;
  sortBy: T;
  sortDir: "asc" | "desc";
}) {
  if (sortBy !== field) return <ArrowUpDown className="ml-1 inline size-3.5 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp className="ml-1 inline size-3.5" />
  ) : (
    <ArrowDown className="ml-1 inline size-3.5" />
  );
}

function RatingBreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: RatingBreakdownRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead className="text-right">เสร็จสิ้น</TableHead>
                <TableHead className="text-right">ให้คะแนนแล้ว</TableHead>
                <TableHead className="text-right">อัตราตอบกลับ (%)</TableHead>
                <TableHead className="text-right">คะแนนเฉลี่ย</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.completed}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.rated}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.responseRate}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.avgRating || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-6 text-center text-muted-foreground">ไม่มีข้อมูลในช่วงเวลานี้</p>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead className="text-right">คิวทั้งหมด</TableHead>
                <TableHead className="text-right">เสร็จสิ้น</TableHead>
                <TableHead className="text-right">ข้าม/ไม่มา</TableHead>
                <TableHead className="text-right">อัตรา skip (%)</TableHead>
                <TableHead className="text-right">รอเฉลี่ย (นาที)</TableHead>
                <TableHead className="text-right">ให้บริการเฉลี่ย (นาที)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.completed}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.skipped}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.skipRate}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.avgWaitMinutes}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.avgServiceMinutes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-6 text-center text-muted-foreground">ไม่มีข้อมูลในช่วงเวลานี้</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const initialRange = getPresetDateRange("today");
  const [tab, setTab] = useState<Tab>("performance");
  const [preset, setPreset] = useState<DateRangePreset | null>("today");
  const [from, setFrom] = useState(formatDateParam(initialRange.from));
  const [to, setTo] = useState(formatDateParam(initialRange.to));

  const [performance, setPerformance] = useState<PerformanceReport | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1,
  });
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);

  const [ratingsSummary, setRatingsSummary] = useState<RatingSummary | null>(null);
  const [ratingsByService, setRatingsByService] = useState<RatingBreakdownRow[]>([]);
  const [ratingsByCounter, setRatingsByCounter] = useState<RatingBreakdownRow[]>([]);
  const [ratingRows, setRatingRows] = useState<RatingRow[]>([]);
  const [ratingPagination, setRatingPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1,
  });
  const [ratingServiceFilter, setRatingServiceFilter] = useState("");
  const [ratingCounterFilter, setRatingCounterFilter] = useState("");
  const [ratingSortBy, setRatingSortBy] = useState<RatingSortField>("completedAt");
  const [ratingSortDir, setRatingSortDir] = useState<"asc" | "desc">("desc");
  const [ratingPage, setRatingPage] = useState(1);
  const [loadingRatings, setLoadingRatings] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const applyPreset = (id: DateRangePreset) => {
    const range = getPresetDateRange(id);
    setPreset(id);
    setFrom(formatDateParam(range.from));
    setTo(formatDateParam(range.to));
    setPage(1);
  };

  const handleFromChange = (value: string) => {
    setPreset(null);
    setFrom(value);
    setPage(1);
  };

  const handleToChange = (value: string) => {
    setPreset(null);
    setTo(value);
    setPage(1);
  };

  const buildBaseParams = useCallback(() => {
    const params = new URLSearchParams({ from, to });
    if (studentId.trim()) params.set("studentId", studentId.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (serviceFilter) params.set("serviceId", serviceFilter);
    return params;
  }, [from, to, studentId, statusFilter, serviceFilter]);

  const buildRatingsParams = useCallback(() => {
    const params = new URLSearchParams({ from, to });
    if (ratingServiceFilter) params.set("serviceId", ratingServiceFilter);
    if (ratingCounterFilter) params.set("counterId", ratingCounterFilter);
    return params;
  }, [from, to, ratingServiceFilter, ratingCounterFilter]);

  const loadRatings = useCallback(async () => {
    setLoadingRatings(true);
    try {
      const params = buildRatingsParams();
      params.set("page", String(ratingPage));
      params.set("pageSize", "50");
      params.set("sortBy", ratingSortBy);
      params.set("sortDir", ratingSortDir);

      const response = await fetch(`/api/admin/reports/ratings?${params}`);
      if (!response.ok) return;
      const data = await response.json();
      setRatingsSummary(data.summary);
      setRatingsByService(data.byService ?? []);
      setRatingsByCounter(data.byCounter ?? []);
      setRatingRows(data.tickets ?? []);
      setRatingPagination(data.pagination);
    } finally {
      setLoadingRatings(false);
    }
  }, [buildRatingsParams, ratingPage, ratingSortBy, ratingSortDir]);

  const loadPerformance = useCallback(async () => {
    setLoadingPerformance(true);
    try {
      const params = new URLSearchParams({ from, to });
      const response = await fetch(`/api/admin/reports/performance?${params}`);
      if (!response.ok) return;
      const data = await response.json();
      setPerformance(data.report);
    } finally {
      setLoadingPerformance(false);
    }
  }, [from, to]);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const params = buildBaseParams();
      params.set("page", String(page));
      params.set("pageSize", "50");
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);

      const response = await fetch(`/api/admin/reports/tickets?${params}`);
      if (!response.ok) return;
      const data = await response.json();
      setTickets(data.tickets ?? []);
      setPagination(data.pagination);
    } finally {
      setLoadingTickets(false);
    }
  }, [buildBaseParams, page, sortBy, sortDir]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/services").then((res) => res.json()),
      fetch("/api/admin/counters").then((res) => res.json()),
    ]).then(([servicesData, countersData]) => {
      setServices(servicesData.services ?? []);
      setCounters(countersData.counters ?? []);
    });
  }, []);

  useEffect(() => {
    if (tab === "performance") loadPerformance();
  }, [tab, loadPerformance]);

  useEffect(() => {
    if (tab === "tickets") loadTickets();
  }, [tab, loadTickets]);

  useEffect(() => {
    if (tab === "ratings") loadRatings();
  }, [tab, loadRatings]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const exportCsv = () => {
    const params = buildBaseParams();
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    window.location.href = `/api/admin/reports/tickets/export?${params}`;
  };

  const exportRatingsCsv = () => {
    const params = buildRatingsParams();
    params.set("sortBy", ratingSortBy);
    params.set("sortDir", ratingSortDir);
    window.location.href = `/api/admin/reports/ratings/export?${params}`;
  };

  const toggleRatingSort = (field: RatingSortField) => {
    if (ratingSortBy === field) {
      setRatingSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setRatingSortBy(field);
      setRatingSortDir("desc");
    }
    setRatingPage(1);
  };

  const filteredCounters = ratingServiceFilter
    ? counters.filter((counter) => counter.service.id === ratingServiceFilter)
    : counters;

  const summary = performance?.summary;

  return (
    <div>
      <div className="mb-6">
        <h2 className="section-heading">รายงาน</h2>
        <p className="text-sm text-muted-foreground">วิเคราะห์ประสิทธิภาพและรายการคิวย้อนหลัง</p>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={preset === item.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => applyPreset(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-date">จากวันที่</Label>
              <Input
                id="from-date"
                type="date"
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">ถึงวันที่</Label>
              <Input
                id="to-date"
                type="date"
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex gap-1 rounded-lg border bg-card p-1">
        <button
          type="button"
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            tab === "performance"
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => setTab("performance")}
        >
          <Timer className="size-4" aria-hidden />
          ประสิทธิภาพ
        </button>
        <button
          type="button"
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            tab === "tickets"
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => setTab("tickets")}
        >
          <FileText className="size-4" aria-hidden />
          รายการคิว
        </button>
        <button
          type="button"
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            tab === "ratings"
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => setTab("ratings")}
        >
          <Star className="size-4" aria-hidden />
          คะแนน
        </button>
      </div>

      {tab === "performance" && (
        <div className={cn(loadingPerformance && "opacity-60 pointer-events-none")}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="คิวทั้งหมด" value={summary?.total ?? 0} icon={ListOrdered} tone="cta" />
            <StatCard
              title="เสร็จสิ้น"
              value={summary?.completed ?? 0}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              title="ข้าม/ไม่มา"
              value={summary?.skipped ?? 0}
              icon={SkipForward}
              tone="warning"
            />
            <StatCard
              title="อัตรา skip (%)"
              value={summary?.skipRate ?? 0}
              icon={SkipForward}
              tone="muted"
            />
          </div>
          <div className="mt-4 grid gap-4 grid-cols-2">
            <StatCard
              title="เวลารอเฉลี่ย (นาที)"
              value={summary?.avgWaitMinutes ?? 0}
              icon={Timer}
              tone="warning"
            />
            <StatCard
              title="เวลาให้บริการเฉลี่ย (นาที)"
              value={summary?.avgServiceMinutes ?? 0}
              icon={Timer}
              tone="cta"
            />
          </div>
          <div className="mt-6 space-y-6">
            <BreakdownTable title="แยกตามบริการ" rows={performance?.byService ?? []} />
            <BreakdownTable title="แยกตามเคาน์เตอร์" rows={performance?.byCounter ?? []} />
          </div>
        </div>
      )}

      {tab === "tickets" && (
        <div className={cn(loadingTickets && "opacity-60 pointer-events-none")}>
          <Card className="mb-4">
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="student-search">ค้นหารหัสนักศึกษา</Label>
                <Input
                  id="student-search"
                  placeholder="เช่น 65100"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter">สถานะ</Label>
                <Select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-filter">บริการ</Label>
                <Select
                  id="service-filter"
                  value={serviceFilter}
                  onChange={(e) => {
                    setServiceFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={exportCsv}
                >
                  <Download className="size-4" aria-hidden />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {tickets.length ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleSort("displayNo")}
                          >
                            เลขคิว
                            <SortIcon field="displayNo" sortBy={sortBy} sortDir={sortDir} />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleSort("studentId")}
                          >
                            นักศึกษา
                            <SortIcon field="studentId" sortBy={sortBy} sortDir={sortDir} />
                          </button>
                        </TableHead>
                        <TableHead>บริการ</TableHead>
                        <TableHead>เคาน์เตอร์</TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleSort("status")}
                          >
                            สถานะ
                            <SortIcon field="status" sortBy={sortBy} sortDir={sortDir} />
                          </button>
                        </TableHead>
                        <TableHead>วันคิว</TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleSort("createdAt")}
                          >
                            รับคิว
                            <SortIcon field="createdAt" sortBy={sortBy} sortDir={sortDir} />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleSort("calledAt")}
                          >
                            เรียก
                            <SortIcon field="calledAt" sortBy={sortBy} sortDir={sortDir} />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleSort("completedAt")}
                          >
                            เสร็จ
                            <SortIcon field="completedAt" sortBy={sortBy} sortDir={sortDir} />
                          </button>
                        </TableHead>
                        <TableHead className="text-right">รอ (นาที)</TableHead>
                        <TableHead className="text-right">ให้บริการ (นาที)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.displayNo}</TableCell>
                          <TableCell>
                            <div>{ticket.studentName}</div>
                            <div className="text-xs text-muted-foreground">{ticket.studentId}</div>
                          </TableCell>
                          <TableCell>{ticket.serviceName}</TableCell>
                          <TableCell>{ticket.counterName ?? "-"}</TableCell>
                          <TableCell>
                            <StatusBadge status={ticket.status} size="default" />
                          </TableCell>
                          <TableCell className="text-xs">{formatQueueDate(ticket.queueDate)}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(ticket.createdAt)}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(ticket.calledAt)}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(ticket.completedAt)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {ticket.waitMinutes ?? "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {ticket.serviceMinutes ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      แสดง {(pagination.page - 1) * pagination.pageSize + 1}–
                      {Math.min(pagination.page * pagination.pageSize, pagination.total)} จาก{" "}
                      {pagination.total} รายการ
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ก่อนหน้า
                      </Button>
                      <span className="flex items-center px-2 text-sm tabular-nums">
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        ถัดไป
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-6 text-center text-muted-foreground">ไม่มีข้อมูลในช่วงเวลานี้</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "ratings" && (
        <div className={cn(loadingRatings && "pointer-events-none opacity-60")}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="เสร็จสิ้น"
              value={ratingsSummary?.completed ?? 0}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              title="ให้คะแนนแล้ว"
              value={ratingsSummary?.rated ?? 0}
              icon={Star}
              tone="brand"
            />
            <StatCard
              title="อัตราตอบกลับ (%)"
              value={ratingsSummary?.responseRate ?? 0}
              icon={ListOrdered}
              tone="muted"
            />
            <StatCard
              title="คะแนนเฉลี่ย"
              value={ratingsSummary?.avgRating ?? 0}
              icon={Star}
              tone="warning"
            />
          </div>

          <div className="mt-6 space-y-6">
            <RatingBreakdownTable title="แยกตามบริการ" rows={ratingsByService} />
            <RatingBreakdownTable title="แยกตามเคาน์เตอร์" rows={ratingsByCounter} />
          </div>

          <Card className="mt-6">
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="rating-service-filter">บริการ</Label>
                <Select
                  id="rating-service-filter"
                  value={ratingServiceFilter}
                  onChange={(e) => {
                    setRatingServiceFilter(e.target.value);
                    setRatingCounterFilter("");
                    setRatingPage(1);
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating-counter-filter">เคาน์เตอร์</Label>
                <Select
                  id="rating-counter-filter"
                  value={ratingCounterFilter}
                  onChange={(e) => {
                    setRatingCounterFilter(e.target.value);
                    setRatingPage(1);
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  {filteredCounters.map((counter) => (
                    <option key={counter.id} value={counter.id}>
                      {counter.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={exportRatingsCsv}
                >
                  <Download className="size-4" aria-hidden />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="pt-6">
              {ratingRows.length ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleRatingSort("displayNo")}
                          >
                            เลขคิว
                            <SortIcon
                              field="displayNo"
                              sortBy={ratingSortBy}
                              sortDir={ratingSortDir}
                            />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleRatingSort("studentId")}
                          >
                            นักศึกษา
                            <SortIcon
                              field="studentId"
                              sortBy={ratingSortBy}
                              sortDir={ratingSortDir}
                            />
                          </button>
                        </TableHead>
                        <TableHead>บริการ</TableHead>
                        <TableHead>เคาน์เตอร์</TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleRatingSort("rating")}
                          >
                            คะแนน
                            <SortIcon
                              field="rating"
                              sortBy={ratingSortBy}
                              sortDir={ratingSortDir}
                            />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleRatingSort("ratedAt")}
                          >
                            ให้คะแนนเมื่อ
                            <SortIcon
                              field="ratedAt"
                              sortBy={ratingSortBy}
                              sortDir={ratingSortDir}
                            />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => toggleRatingSort("completedAt")}
                          >
                            เสร็จสิ้นเมื่อ
                            <SortIcon
                              field="completedAt"
                              sortBy={ratingSortBy}
                              sortDir={ratingSortDir}
                            />
                          </button>
                        </TableHead>
                        <TableHead>วันคิว</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratingRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.displayNo}</TableCell>
                          <TableCell>
                            <div>{row.studentName}</div>
                            <div className="text-xs text-muted-foreground">{row.studentId}</div>
                          </TableCell>
                          <TableCell>{row.serviceName}</TableCell>
                          <TableCell>{row.counterName ?? "-"}</TableCell>
                          <TableCell className="tabular-nums">{row.rating ?? "-"}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(row.ratedAt)}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(row.completedAt)}</TableCell>
                          <TableCell className="text-xs">{formatQueueDate(row.queueDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      แสดง {(ratingPagination.page - 1) * ratingPagination.pageSize + 1}–
                      {Math.min(
                        ratingPagination.page * ratingPagination.pageSize,
                        ratingPagination.total,
                      )}{" "}
                      จาก {ratingPagination.total} รายการ
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={ratingPage <= 1}
                        onClick={() => setRatingPage((p) => p - 1)}
                      >
                        ก่อนหน้า
                      </Button>
                      <span className="flex items-center px-2 text-sm tabular-nums">
                        {ratingPagination.page} / {ratingPagination.totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={ratingPage >= ratingPagination.totalPages}
                        onClick={() => setRatingPage((p) => p + 1)}
                      >
                        ถัดไป
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-6 text-center text-muted-foreground">ไม่มีข้อมูลในช่วงเวลานี้</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
