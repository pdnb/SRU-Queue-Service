"use client";

import { RoleBadge } from "@/components/role-badge";
import { ButtonLink } from "@/components/button-link";
import { useEffect, useState } from "react";
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

interface Counter {
  id: string;
  name: string;
  service: { name: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "DISABLED";
  counterId: string | null;
  createdAt: string;
}

type Tab = "active" | "pending";

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [users, setUsers] = useState<User[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [counterId, setCounterId] = useState("");
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [approveCounterId, setApproveCounterId] = useState("");

  const load = async () => {
    const status = tab === "pending" ? "PENDING" : "ACTIVE";
    const [userRes, counterRes] = await Promise.all([
      fetch(`/api/admin/users?status=${status}`),
      fetch("/api/admin/counters"),
    ]);
    const userData = await userRes.json();
    const counterData = await counterRes.json();
    setUsers(userData.users ?? []);
    setCounters(counterData.counters ?? []);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        counterId: counterId || null,
      }),
    });
    setName("");
    setEmail("");
    setPassword("");
    setCounterId("");
    await load();
  };

  const rejectUser = async (userId: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    await load();
  };

  const approveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingUser) return;

    await fetch(`/api/admin/users/${approvingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        role: approveRole,
        counterId: approveCounterId || null,
      }),
    });
    setApprovingUser(null);
    setApproveRole("STAFF");
    setApproveCounterId("");
    await load();
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="space-y-6">
      <ButtonLink href="/admin" variant="outline">
        กลับแดชบอร์ด
      </ButtonLink>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มเจ้าหน้าที่</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={createUser}>
            <div className="space-y-2">
              <Label>ชื่อ</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>รหัสผ่าน</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>บทบาท</Label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
              >
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>เคาน์เตอร์ประจำ (ถ้ามี)</Label>
              <Select
                value={counterId}
                onChange={(e) => setCounterId(e.target.value)}
              >
                <option value="">ไม่ระบุ</option>
                {counters.map((counter) => (
                  <option key={counter.id} value={counter.id}>
                    {counter.name} ({counter.service.name})
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="h-10 md:col-span-2 md:w-fit">
              เพิ่มเจ้าหน้าที่
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>รายการเจ้าหน้าที่</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tab === "active" ? "default" : "outline"}
              onClick={() => setTab("active")}
            >
              ใช้งานอยู่
            </Button>
            <Button
              type="button"
              variant={tab === "pending" ? "default" : "outline"}
              onClick={() => setTab("pending")}
            >
              รออนุมัติ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tab === "active" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>บทบาท</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>วันที่ขอเข้าใช้</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      ไม่มีคำขอรออนุมัติ
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setApprovingUser(user);
                            setApproveRole("STAFF");
                            setApproveCounterId("");
                          }}
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => rejectUser(user.id)}
                        >
                          ปฏิเสธ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>อนุมัติ {approvingUser.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={approveUser}>
                <p className="text-sm text-muted-foreground">{approvingUser.email}</p>
                <div className="space-y-2">
                  <Label>บทบาท</Label>
                  <Select
                    value={approveRole}
                    onChange={(e) => setApproveRole(e.target.value as "ADMIN" | "STAFF")}
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>เคาน์เตอร์ประจำ (ถ้ามี)</Label>
                  <Select
                    value={approveCounterId}
                    onChange={(e) => setApproveCounterId(e.target.value)}
                  >
                    <option value="">ไม่ระบุ</option>
                    {counters.map((counter) => (
                      <option key={counter.id} value={counter.id}>
                        {counter.name} ({counter.service.name})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">ยืนยันอนุมัติ</Button>
                  <Button type="button" variant="outline" onClick={() => setApprovingUser(null)}>
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
