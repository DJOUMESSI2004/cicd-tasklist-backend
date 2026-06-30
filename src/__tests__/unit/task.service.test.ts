import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Task } from "@prisma/client";

// Mock the prisma module before importing the service
vi.mock("../../lib/prisma.js", () => {
	return {
		default: {
			task: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
		},
	};
});

import prisma from "../../lib/prisma.js";
import * as taskService from "../../services/task.service.js";

const mockPrisma = vi.mocked(prisma);

const mockTask: Task = {
	id: 1,
	title: "Test Task",
	description: "A test task description",
	completed: false,
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("TaskService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findAll", () => {
		it("should return all tasks ordered by createdAt desc", async () => {
			const tasks = [mockTask];
			(mockPrisma.task.findMany as any).mockResolvedValue(tasks);

			const result = await taskService.findAll();

			expect(result).toEqual(tasks);
			expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
				orderBy: { createdAt: "desc" },
			});
		});
	});

	// ... TODO: Add more tests

	describe("findById", () => {
		it("should return the task with the given id", async () => {
			(mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);

			const result = await taskService.findById(1);

			expect(result).toEqual(mockTask);
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it("should return null if the task does not exist", async () => {
			(mockPrisma.task.findUnique as any).mockResolvedValue(null);

			const result = await taskService.findById(999);

			expect(result).toBeNull();
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
				where: { id: 999 },
			});
		});

	});



	describe("create", () => {

		it("should create a new task and return it", async () => {
			const newTaskData = {
				title: "New Task",
				description: "New task description"
			};
			const createdTask = { ...mockTask, ...newTaskData };
			(mockPrisma.task.create as any).mockResolvedValue(createdTask);

			const result = await taskService.create(newTaskData);

			expect(result).toEqual(createdTask);
			expect(mockPrisma.task.create).toHaveBeenCalledWith({
				data: newTaskData,
			});
		});

		it("should throw an error if creation fails", async () => {
			const newTaskData = {
				title: "New Task",
				description: "New task description"
			};
			(mockPrisma.task.create as any).mockRejectedValue(new Error("Creation failed"));

			await expect(taskService.create(newTaskData)).rejects.toThrow("Creation failed");
			expect(mockPrisma.task.create).toHaveBeenCalledWith({
				data: newTaskData,
			});
		});

	});


	describe("update", () => {
		it("should update the task and return it", async () => {
			const updatedData = { title: "Updated Task" };
			(mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);
			const updatedTask = { ...mockTask, ...updatedData };
			(mockPrisma.task.update as any).mockResolvedValue(updatedTask);

			const result = await taskService.update(1, updatedData);

			expect(result).toEqual(updatedTask);
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
			expect(mockPrisma.task.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: updatedData,
			});
		});

		it("should throw an error if the task does not exist", async () => {
			(mockPrisma.task.findUnique as any).mockResolvedValue(null);

			await expect(taskService.update(999, { title: "Updated Task" })).rejects.toThrow("Task not found");
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
		});

		it("should throw an error if update fails", async () => {
			const updatedData = { title: "Updated Task" };
			(mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);
			(mockPrisma.task.update as any).mockRejectedValue(new Error("Update failed"));

			await expect(taskService.update(1, updatedData)).rejects.toThrow("Update failed");
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
			expect(mockPrisma.task.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: updatedData,
			});
		});
	});

	describe("remove", () => {
		it("should delete the task and return it", async () => {
			(mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);
			(mockPrisma.task.delete as any).mockResolvedValue(mockTask);

			const result = await taskService.remove(1);

			expect(result).toEqual(mockTask);
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
			expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 1 } });
		});

		it("should throw an error if the task does not exist", async () => {
			(mockPrisma.task.findUnique as any).mockResolvedValue(null);

			await expect(taskService.remove(999)).rejects.toThrow("Task not found");
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
		});

		it("should throw an error if deletion fails", async () => {
			(mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);
			(mockPrisma.task.delete as any).mockRejectedValue(new Error("Deletion failed"));

			await expect(taskService.remove(1)).rejects.toThrow("Deletion failed");
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
			expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 1 } });
		});
	});

});
