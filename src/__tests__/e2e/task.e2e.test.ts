import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		// Clean up database between tests
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});


		it("should return 400 if title is missing", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ description: "Missing title" });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error", "Title is required and must be a non-empty string");
		});

		// Error in createTask: 500
		it("should return 500 on service error", async () => {
			// Mock the service to throw an error
			const originalCreate = testPrisma.task.create;
			testPrisma.task.create = vi.fn().mockRejectedValue(new Error("Service error"));

			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(500);
			expect(res.body).toHaveProperty("error", "Failed to create task");

			// Restore the original method
			testPrisma.task.create = originalCreate;
		});

		// description ?? undefined,

		it("should create a new task with undefined description", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBeNull(); // ✔️ correct
			expect(res.body.completed).toBe(false);
		});



	});

	// ... TODO: Add more tests

	describe("GET /api/tasks", () => {

		it("should return all tasks", async () => {
			// Create a task first
			await testPrisma.task.create({
				data: { title: "Task 1", description: "Description 1" },
			});

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body)).toBe(true);
			expect(res.body.length).toBe(1);
			expect(res.body[0].title).toBe("Task 1");
		});

		it("should return a task by id", async () => {
			// Create a task first
			const createdTask = await testPrisma.task.create({
				data: { title: "Task 2", description: "Description 2" },
			});

			const res = await request(app).get(`/api/tasks/${createdTask.id}`);

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Task 2");
			expect(res.body.description).toBe("Description 2");
		});

		it("should return 404 for non-existing task", async () => {
			const res = await request(app).get("/api/tasks/9999");

			expect(res.status).toBe(404);
			expect(res.body).toHaveProperty("error", "Task not found");
		});

		// Error in getAllTasks 500
		it("should return 500 on service error during getAllTasks", async () => {
			// Mock the service to throw an error
			const originalFindMany = testPrisma.task.findMany;
			testPrisma.task.findMany = vi.fn().mockRejectedValue(new Error("Service error"));

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(500);
			expect(res.body).toHaveProperty("error", "Failed to fetch tasks");

			// Restore the original method
			testPrisma.task.findMany = originalFindMany;
		});

	});




	describe("PUT /api/tasks/:id", () => {
		it("should update an existing task", async () => {
			// Create a task first
			const createdTask = await testPrisma.task.create({
				data: { title: "Task 3", description: "Description 3" },
			});

			const res = await request(app)
				.put(`/api/tasks/${createdTask.id}`)
				.send({ title: "Updated Task 3", completed: true });

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Updated Task 3");
			expect(res.body.completed).toBe(true);
		});

		it("should return 404 when updating a non-existing task", async () => {
			const res = await request(app)
				.put("/api/tasks/9999")
				.send({ title: "Non-existing Task" });

			expect(res.status).toBe(404);
			expect(res.body).toHaveProperty("error", "Task not found");
		});

		// Error in updateTask 500
		it("should return 500 on service error during update", async () => {
			// Mock the service to throw an error
			const originalUpdate = testPrisma.task.update;
			testPrisma.task.update = vi.fn().mockRejectedValue(new Error("Service error"));

			// Create a task first
			const createdTask = await testPrisma.task.create({
				data: { title: "Task 6", description: "Description 6" },
			});

			const res = await request(app)
				.put(`/api/tasks/${createdTask.id}`)
				.send({ title: "Updated Task 6" });

			expect(res.status).toBe(500);
			expect(res.body).toHaveProperty("error", "Failed to update task");

			// Restore the original method
			testPrisma.task.update = originalUpdate;
		});

		// Invalid task ID
		it("should return 400 for invalid task ID during update", async () => {
			const res = await request(app)
				.put("/api/tasks/invalid")
				.send({ title: "Invalid Task ID" });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error", "Invalid task ID");
		});

	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete an existing task", async () => {
			// Create a task first
			const createdTask = await testPrisma.task.create({
				data: { title: "Task 4", description: "Description 4" },
			});

			const res = await request(app).delete(`/api/tasks/${createdTask.id}`);

			expect(res.status).toBe(204);

			// Verify the task is deleted
			const getRes = await request(app).get(`/api/tasks/${createdTask.id}`);
			expect(getRes.status).toBe(404);
		});

		it("should return 404 when deleting a non-existing task", async () => {
			const res = await request(app).delete("/api/tasks/9999");

			expect(res.status).toBe(404);
			expect(res.body).toHaveProperty("error", "Task not found");
		});

		it("should return 500 on service error during deletion", async () => {
			// Mock the service to throw an error
			const originalRemove = testPrisma.task.delete;
			testPrisma.task.delete = vi.fn().mockRejectedValue(new Error("Service error"));

			// Create a task first
			const createdTask = await testPrisma.task.create({
				data: { title: "Task 5", description: "Description 5" },
			});

			const res = await request(app).delete(`/api/tasks/${createdTask.id}`);

			expect(res.status).toBe(500);
			expect(res.body).toHaveProperty("error", "Failed to delete task");

			// Restore the original method
			testPrisma.task.delete = originalRemove;
		});

		it("should return 400 for invalid task ID during deletion", async () => {
			const res = await request(app).delete("/api/tasks/invalid");

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error", "Invalid task ID");
		});
	});


	describe("GET /api/tasks/:id", () => {
		it("should return 404 for non-existing task", async () => {
			const res = await request(app).get("/api/tasks/9999");

			expect(res.status).toBe(404);
			expect(res.body).toHaveProperty("error", "Task not found");
		});

		it("should return 400 for invalid task ID", async () => {
			const res = await request(app).get("/api/tasks/invalid");

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error", "Invalid task ID");
		});

		it("should return 500 on service error during retrieval", async () => {
			// Mock the service to throw an error
			const originalFindUnique = testPrisma.task.findUnique;
			testPrisma.task.findUnique = vi.fn().mockRejectedValue(new Error("Service error"));

			const res = await request(app).get("/api/tasks/1");

			expect(res.status).toBe(500);
			expect(res.body).toHaveProperty("error", "Failed to fetch task");

			// Restore the original method
			testPrisma.task.findUnique = originalFindUnique;
		});


	});



});
