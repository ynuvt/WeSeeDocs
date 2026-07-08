const { z } = require('zod');

const updateDraftSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  type: z.enum(['social', 'article', 'caption'], {
    errorMap: () => ({ message: "Type must be one of: social, article, or caption" })
  }),
  body: z.string().min(1, "Body is required").max(5000, "Body must be at most 5000 characters"),
  tags: z.array(
    z.string().trim().min(1, "Tag cannot be empty").max(30, "Tag must be at most 30 characters")
  ).max(10, "Cannot exceed 10 tags"),
  status: z.enum(['Draft', 'In Review', 'Approved', 'Published'], {
    errorMap: () => ({ message: "Status must be one of: Draft, In Review, Approved, or Published" })
  }),
  version: z.number().int().positive("Version must be a positive integer")
}).strict();

const createDraftSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  type: z.enum(['social', 'article', 'caption'], {
    errorMap: () => ({ message: "Type must be one of: social, article, or caption" })
  }),
  body: z.string().min(1, "Body is required").max(5000, "Body must be at most 5000 characters"),
  tags: z.array(
    z.string().trim().min(1, "Tag cannot be empty").max(30, "Tag must be at most 30 characters")
  ).max(10, "Cannot exceed 10 tags"),
  status: z.enum(['Draft', 'In Review', 'Approved', 'Published'], {
    errorMap: () => ({ message: "Status must be one of: Draft, In Review, Approved, or Published" })
  }),
  author: z.string().trim().min(1, "Author name is required").max(100, "Author name must be at most 100 characters")
}).strict();

module.exports = {
  updateDraftSchema,
  createDraftSchema
};
