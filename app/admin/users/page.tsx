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
  counterId: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [counterId, setCounterId] = useState("");

  const load = async () => {
    const [userRes, counterRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/counters"),
    ]);
    const userData = await userRes.json();
    const counterData = await counterRes.json();
    setUsers(userData.users ?? []);
    setCounters(counterData.counters ?? []);
  };

  useEffect(() => {
    load();
  }, []);

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
        <CardHeader>
          <CardTitle>รายการเจ้าหน้าที่</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
