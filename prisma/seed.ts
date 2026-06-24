import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../lib/prisma";

const prisma = createPrismaClient();

async function main() {
  await prisma.queueTicket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const registration = await prisma.service.create({
    data: {
      name: "งานทะเบียน",
      prefix: "A",
      description: "ลงทะเบียนเรียน ถอนรายวิชา",
    },
  });

  const finance = await prisma.service.create({
    data: {
      name: "งานการเงิน",
      prefix: "B",
      description: "ชำระค่าเทอม ขอใบเสร็จ",
    },
  });

  const advising = await prisma.service.create({
    data: {
      name: "งานที่ปรึกษา",
      prefix: "C",
      description: "ปรึกษาอาจารย์ที่ปรึกษา",
    },
  });

  const counterA1 = await prisma.counter.create({
    data: { name: "ช่อง 1", serviceId: registration.id },
  });

  const counterB1 = await prisma.counter.create({
    data: { name: "ช่อง 1", serviceId: finance.id },
  });

  const counterC1 = await prisma.counter.create({
    data: { name: "ช่อง 1", serviceId: advising.id },
  });

  await prisma.user.create({
    data: {
      name: "ผู้ดูแลระบบ",
      email: "admin@example.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      name: "เจ้าหน้าที่ทะเบียน",
      email: "staff1@example.com",
      password: passwordHash,
      role: "STAFF",
      counterId: counterA1.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "เจ้าหน้าที่การเงิน",
      email: "staff2@example.com",
      password: passwordHash,
      role: "STAFF",
      counterId: counterB1.id,
    },
  });

  console.log("Seed completed");
  console.log("Admin: admin@example.com / password123");
  console.log("Staff: staff1@example.com / password123");
  console.log("Mock students: 64010001, 64010002, 64010003");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
