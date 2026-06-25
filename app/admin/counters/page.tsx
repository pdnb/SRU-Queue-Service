"use client";

import { ActiveBadge } from "@/components/active-badge";
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

interface Service {
  id: string;
  name: string;
}

interface Counter {
  id: string;
  name: string;
  isActive: boolean;
  service: Service;
  staff: { name: string } | null;
}

export default function AdminCountersPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState("");

  const load = async () => {
    const [counterRes, serviceRes] = await Promise.all([
      fetch("/api/admin/counters"),
      fetch("/api/admin/services"),
    ]);
    const counterData = await counterRes.json();
    const serviceData = await serviceRes.json();
    setCounters(counterData.counters ?? []);
    setServices(serviceData.services ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const createCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/counters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, serviceId }),
    });
    setName("");
    setServiceId("");
    await load();
  };

  const toggleActive = async (counter: Counter) => {
    await fetch(`/api/admin/counters/${counter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !counter.isActive }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <ButtonLink href="/admin" variant="outline">
        กลับแดชบอร์ด
      </ButtonLink>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มเคาน์เตอร์</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={createCounter}>
            <div className="space-y-2">
              <Label>ชื่อเคาน์เตอร์</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>บริการ</Label>
              <Select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
              >
                <option value="">เลือกบริการ</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="h-10">เพิ่มเคาน์เตอร์</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการเคาน์เตอร์</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เคาน์เตอร์</TableHead>
                <TableHead>บริการ</TableHead>
                <TableHead>เจ้าหน้าที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {counters.map((counter) => (
                <TableRow key={counter.id}>
                  <TableCell>{counter.name}</TableCell>
                  <TableCell>{counter.service.name}</TableCell>
                  <TableCell>{counter.staff?.name ?? "-"}</TableCell>
                  <TableCell>
                    <ActiveBadge active={counter.isActive} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(counter)}>
                      {counter.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </Button>
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
