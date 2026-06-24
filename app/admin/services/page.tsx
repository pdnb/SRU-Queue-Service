"use client";

import { ActiveBadge } from "@/components/active-badge";
import { ButtonLink } from "@/components/button-link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  prefix: string;
  description: string | null;
  isActive: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/services");
    const data = await response.json();
    setServices(data.services ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const createService = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, prefix, description }),
    });
    setName("");
    setPrefix("");
    setDescription("");
    await load();
  };

  const toggleActive = async (service: Service) => {
    await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !service.isActive }),
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
          <CardTitle>เพิ่มบริการ</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" onSubmit={createService}>
            <div className="space-y-2">
              <Label>ชื่อบริการ</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Prefix (A-Z)</Label>
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                maxLength={1}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>รายละเอียด</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" className="h-10 md:col-span-4 md:w-fit">
              เพิ่มบริการ
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการบริการ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prefix</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-bold">{service.prefix}</TableCell>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>
                    <ActiveBadge active={service.isActive} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(service)}>
                      {service.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
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
