import prisma from "../lib/prisma.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

export async function findAll() {
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: number) {
  return prisma.task.findUnique({
    where: { id },
  });
}

export async function create(data: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
    },
  });
}

export async function update(id: number, data: UpdateTaskInput) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Task not found");
  }
  return prisma.task.update({
    where: { id },
    data,
  });
}

export async function remove(id: number) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Task not found");
  }
  return prisma.task.delete({
    where: { id },
  });
}





// sonar-scanner \
// -Dsonar.host.url=https://sonarqube.cicd.kits.ext.educentre.fr \-Dsonar.token=


// sonar-scanner \
// -Dsonar.host.url=https://sonarqube.cicd.kits.ext.educentre.fr \
// -Dsonar.token=squ_86d8ff9b947dbe687dc9896ca84a60fda177082c

// sonar-scanner -Dsonar.token=squ_86d8ff9b947dbe687dc9896ca84a60fda177082c