import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { blogPosts } from "../lib/blog";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  await prisma.staff.createMany({
    data: [
      { name: "Admin User", email: "admin@professionalbs.local", password, role: "admin" },
      { name: "Operations Manager", email: "manager@professionalbs.local", password, role: "manager" },
      { name: "PRO Specialist", email: "pro@professionalbs.local", password, role: "pro" }
    ],
    skipDuplicates: true
  });

  const clients = [
    ["Aisha Khan", "aisha@example.com", "+971501112233", "AK Trading LLC", "website"],
    ["Rohit Menon", "rohit@example.com", "+971502224466", "Gulf Tech Partners", "referral"],
    ["Fatima Al Nuaimi", "fatima@example.com", "+971503337799", "Nuaimi Consulting", "walk-in"],
    ["Daniel Cruz", "daniel@example.com", "+971504445566", "Cruz Media FZ", "social"],
    ["Sara Haddad", "sara@example.com", "+971505551234", "Haddad Holdings", "website"]
  ];

  for (const [name, email, phone, company, source] of clients) {
    const client = await prisma.client.upsert({
      where: { id: `seed-${email}` },
      update: {},
      create: {
        id: `seed-${email}`,
        name,
        email,
        phone,
        company,
        source,
        businessType: "Services",
        notes: "Seed client for demo workflows."
      }
    });

    await prisma.serviceRequest.create({
      data: {
        clientId: client.id,
        serviceType: "Trade License Renewal",
        status: "in_progress",
        assignedTo: "PRO Specialist",
        priority: "normal",
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20)
      }
    });

    await prisma.followUp.create({
      data: {
        clientId: client.id,
        step: "Call client for document confirmation",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
      }
    });
  }

  for (const post of blogPosts.slice(0, 3)) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        published: true
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
